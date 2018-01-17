var Pfile = require('joezone').Pfile;
var Diff = require('joezone').Diff;
//=============================================================================
//
// File:         furcate/src/cli.class.js
// Language:     ECMAScript 2015
// Copyright:    Joe Honton © 2018
// License:      CC-BY-NC-ND 4.0
// Initial date: Jan 11, 2018
// Contents:     Command line interface
//
//=============================================================================

var expect = require('joezone').expect;
var terminal = require('joezone').terminal;
var Pfile = require('joezone').Pfile;
//=============================================================================
//
// File:         furcate/src/defs-file.class.js
// Language:     ECMAScript 2015
// Copyright:    Joe Honton © 2018
// License:      CC-BY-NC-ND 4.0
// Initial date: Jan 3, 2018
// Usage:       Parse the defs file into a map
//
//=============================================================================

var expect = require('joezone').expect;
var aver = require('joezone').aver;
var terminal = require('joezone').terminal;
var Pfile = require('joezone').Pfile;
var TextReader = require('joezone').TextReader;
//=============================================================================
//
// File:         furcate/src/expressions.class.js
// Language:     ECMAScript 2015
// Copyright:    Joe Honton © 2018
// License:      CC-BY-NC-ND 4.0
// Initial date: Jan 4, 2018
// Usage:        Regular expressions
//
//=============================================================================

class  Expressions {

	constructor() {		
		// careful: JS needs solidus to be escaped so '\\s' becomes '\s'
		this.define = '(#define\\s*)';										// #define
		this.valuedDefine = '(#define\\s*)([\\-$_A-Za-z0-9]*?\\s)(.*)';		// #define $R-W_DOC value
		this.negativeOpen = '(<<![\\-$_A-Za-z0-9]*?(?![\\-$_A-Za-z0-9]))';	// <<!$R-W_DOC
		this.negativeClose = '((?:\\s|^)![\\-$_A-Za-z0-9]*>>)';				// !$R-W_DOC>>
		this.affirmativeOpen = '(<<[\\-$_A-Za-z0-9]*?(?![\\-$_A-Za-z0-9]))';// <<$R-W_DOC
		this.affirmativeClose = '((?:\\s|^)[\\-$_A-Za-z0-9]*>>)';			// $R-W_DOC>>
		this.substitutionVariable = '(<[\\-$_A-Za-z0-9]*?>)';				// <$R-W_DOC>
		this.beginBlockComment = '(\\/\\*)';								// /*
		this.endBlockComment = '(\\*\\/)';									// */
		this.leadingComment = '(^\\/\\/.*)';								// terminal comment at beginning of line  
		this.terminalComment = '(?:[^:])(\\/\\/.*)';						// ignores http://    (also be sure to add 1 to get the intended index of the match)  
		this.anything = this.makeAnything();
		Object.seal(this);
	}
	
	makeAnything() {
		var multi = new Array();
		multi.push(this.define);
		multi.push(this.negativeOpen);
		multi.push(this.negativeClose);
		multi.push(this.affirmativeOpen);
		multi.push(this.affirmativeClose);
		multi.push(this.substitutionVariable);
		multi.push(this.beginBlockComment);
		multi.push(this.endBlockComment);
		multi.push(this.leadingComment);
		multi.push(this.terminalComment);
		return multi.join('|');
	}
}


class DefsFile {

	constructor() {
		this.defsMap = new Map();			// defName (String) => defValue (String)
		this.patterns = new Expressions();
		
		Object.seal(this);
	}

	// Read a defs file and build a map of defNames => defValues
	//< this.defsMap is populated 
	read(defsPfile) {
		expect(defsPfile, ['Pfile', 'null']);
		
		if (defsPfile == null)
			return;
		
		if (!defsPfile.exists()) {
			terminal.abnormal(`--defs file not found ${defsPfile.name}`);
			return;
		}
		// terminal.trace(`Reading defs from ${defsPfile.name}`);
		
		try {
			var tr = new TextReader();
			tr.open(defsPfile.name);
			var line = '';
			while ((line = tr.getline()) != null)
				this.parseLine(line);
			tr.close();
		}
		catch(err) {
			terminal.abnormal(err.message);
		}
	}
	
	//> a line of text from the --defs file
	parseLine(line) {
		var [defName, defValue] = this.parsePrivate(line);
		if (defName != null) {
			this.defsMap.set(defName, defValue);
		}
	}
	
	//> a line of text from the --defs file
	//< [null, null] if the line is blank or all comments or does not contain #define
	//< [defName, defValue]
	parsePrivate(line) {
		var regexp = null;
		var result = null;
		
		// find any full line comments, and continue
		regexp = new RegExp(this.patterns.leadingComment, 'g');
		result = regexp.exec(line);
		if (result != null)
			return [null, null];
		
		// find and remove any terminal comment
		regexp = new RegExp(this.patterns.terminalComment, 'g');
		result = regexp.exec(line);
		if (result != null)
			line = line.substr(0, result.index+1);
		
		// ignore blank lines
		if (line.trim() == '')
			return [null, null];

		// #define
		regexp = new RegExp(this.patterns.define, 'g');
		result = regexp.exec(line);
		if (result == null) {
			terminal.abnormal('Unhandled item in --defs file ', terminal.red(line));
			return [null, null];
		}

		// #define DEFNAME DEFVALUE
		regexp = new RegExp(this.patterns.valuedDefine, 'g');
		result = regexp.exec(line);
		if (result != null) {
			aver (result.length == 4);
			var match3 = result[3].trim();
			var match2 = result[2].trim();
			return (match2 == '') ? [match3, ''] : [match2, match3];
		}
		
		terminal.logic('Expected to find #define in ', terminal.red(line));
		return [null, null];
	}
}


//=============================================================================
//
// File:         furcate/src/source-file.class.js
// Language:     ECMAScript 2015
// Copyright:    Joe Honton © 2018
// License:      CC-BY-NC-ND 4.0
// Initial date: Jan 3, 2018
// Usage:        Parse the source file replacing defs and conditinally including/excluding blocks
//
//=============================================================================

var expect = require('joezone').expect;
var aver = require('joezone').aver;
var terminal = require('joezone').terminal;
var Pfile = require('joezone').Pfile;
var TextReader = require('joezone').TextReader;
var TextWriter = require('joezone').TextWriter;
var fs = require('fs');

class SourceFile {

	//< defsFile is the defsFile parser class 
	constructor(defsFile) {
		expect(defsFile, 'DefsFile');

		this.defsFile = defsFile;				// the --defs parser class
		this.patterns = new Expressions();		// regex patterns
		
		this.emitIndex = 0;						// index into the current line of the next char that needs to be sent to output
		this.emitPieces = new Array();			// a collection of text to be emitted, for the current line
		
		this.isInsideBlockComment = false;		// true when inside a /* block comment */
		this.conditionalStack = new Array();	// where each item in the stack LIFO stack is {DEFNAME, isMasking}

		this.suppressLineIfEmpty = false;		// this switch is turned on/off for each line
		
		Object.seal(this);
	}

	get defsMap() {
		return this.defsFile.defsMap;
	}
	
	//< returns true if we are currently in masking mode
	isCurrentlyMasking() {
		var depth = this.conditionalStack.length;
		if (depth == 0)
			return false;
		else
			return this.conditionalStack[depth-1].isMasking;
	}
	
	//=============================================================================
	// parsing
	//=============================================================================

	// Read a defs file and build a map of defNames => defValues
	//> inputPfile is the source file to read and parse
	//> outputPfile is the dest file
	//< returns 0 on sucess and 1 on failure, which is passed to process.ext()
	parse(inputPfile, outputPfile) {
		expect(inputPfile, 'Pfile');
		expect(outputPfile, 'Pfile');
		
		if (!inputPfile.exists())
			return 1;
		
		outputPfile.makeAbsolute();
		var outputPath = new Pfile(outputPfile.getPath());
		if (!outputPath.exists())
			outputPath.mkDir();
		
		// use temp file for buffering output, in case the input and output are the same name
		var tempPfile = new Pfile(outputPfile).replaceExtension('tmp');

		try {
			var tr = new TextReader();
			tr.open(inputPfile.name);
			// terminal.trace(`Reading source file ${inputPfile.name}`);
			
			var tw = new TextWriter();
			tw.open(tempPfile.name);
			// terminal.trace(`Writing output file ${outputPfile.name}`);
			
			var line = '';
			while ((line = tr.getline()) != null) {
				this.emitIndex = 0;
				this.emitPieces = new Array();
				var outputLine = this.parseSourceLine(line);
				
				if (!this.isCurrentlyMasking()) {
					// do not emit blank lines when in masking mode
					if (!(this.suppressLineIfEmpty && outputLine.trim() == ''))
						tw.putline(outputLine);
				}
			}
		
			tr.close();
			tw.close();
			
			// rename temp to final filename
			fs.renameSync(tempPfile.name, outputPfile.name);
			
			return 0;
		}
		catch(err) {
			terminal.abnormal(err.message);
			return 1;
		}
	}
	
	//> a line of text from the source file
	//< a modified line
	parseSourceLine(line) {
		var regexp = null;
		var result = null;
		this.suppressLineIfEmpty = false;
		
		// find any of the patterns we care about
		regexp = new RegExp(this.patterns.anything, 'g');
		var result = null;
		while ((result = regexp.exec(line)) != null) {
			
			// push any regular text in front of the match to the emitter
			var regularText = line.substring(this.emitIndex, result.index);
			this.emitText(regularText);
			
			var rc = this.processRegExpMatch(line, result[0], result.index, regexp.lastIndex);
			if (rc !== false)
				return rc;
		}
		
		// push any regular text after the last match to the emitter
		var regularText = line.substr(this.emitIndex);
		this.emitText(regularText);

		return this.emitPieces.join('');
	}
	
	//> line is the full line
	//> matchingText is the first text matching any of the possible patterns we are looking for
	//> index is the position  (within the line) of the first char of the matching text
	//> lastIndex is the position (within the line) of the last char of the matching text
	//< normally returns false, but lines matching #define return text to be emitted
	//
	processRegExpMatch(line, matchingText, index, lastIndex) {
		var regexp = null;
		var result = null;
		
		this.emitIndex = lastIndex;

		regexp = new RegExp(this.patterns.negativeOpen, 'g');
		if (regexp.exec(matchingText) != null) {
			this.negativeOpen(matchingText);
			return false;
		}
		
		regexp = new RegExp(this.patterns.negativeClose, 'g');
		if (regexp.exec(matchingText) != null) {
			this.negativeClose(matchingText);
			return false;
		}
		
		regexp = new RegExp(this.patterns.affirmativeOpen, 'g');
		if (regexp.exec(matchingText) != null) {
			this.affirmativeOpen(matchingText);
			return false;
		}
		
		regexp = new RegExp(this.patterns.affirmativeClose, 'g');
		if (regexp.exec(matchingText) != null) {
			this.affirmativeClose(matchingText);
			return false;
		}
		
		regexp = new RegExp(this.patterns.substitutionVariable, 'g');
		if (regexp.exec(matchingText) != null) {
			this.substitutionVariable(matchingText, lastIndex);
			return false;
		}
		
		regexp = new RegExp(this.patterns.beginBlockComment, 'g');
		if (regexp.exec(matchingText) != null) {
			this.beginBlockComment(matchingText);
			return false;
		}
		
		regexp = new RegExp(this.patterns.endBlockComment, 'g');
		if (regexp.exec(matchingText) != null) {
			this.endBlockComment(matchingText);
			return false;
		}
		
		regexp = new RegExp(this.patterns.leadingComment, 'g');
		if (regexp.exec(matchingText) != null) {
			this.leadingComment(matchingText);
			return false;
		}
		
		regexp = new RegExp(this.patterns.terminalComment, 'g');
		if (regexp.exec(matchingText) != null) {
			this.terminalComment(matchingText);
			this.emitIndex++;
			return false;
		}

		regexp = new RegExp(this.patterns.define, 'g');
		if (regexp.exec(matchingText) != null) {
			return this.define(line);
		}
		
	}
	
	//=============================================================================
	// emitting
	//=============================================================================

	//^ Add the given text to the emit array
	emitText(text) {
		if (!this.isCurrentlyMasking())
			this.emitPieces.push(text);
	}
		
	//< returns the string that should be emitted
	define(line) {
		// do not honor this match when inside a block commment
		if (this.isInsideBlockComment) {
			return line;
		}
		
		// parse the line and add definition to the defsMap
		this.defsFile.parseLine(line);
		return `// ${line}`;
	}

	negativeOpen(matchingText) {
		// do not honor this match when inside a block commment
		if (this.isInsideBlockComment) {
			this.emitText(matchingText);
			return;
		}
		
		var defName = matchingText.replace('<<!', '').trim();
		if (this.defsMap.has(defName) == false) {
			this.emitText(matchingText);
			return;
		}

		// Add an item to the LIFO stack
		// if we are currently in masking mode, the new item must honor than, so it will also be masking
		// if we are not currently masking, set to true if the defName does not exist, false if it does exist.
		var isDefValueTrue = this.isTrue(this.defsMap.get(defName));
		var isMasking = (this.isCurrentlyMasking() ? true : isDefValueTrue);
		var stackItem = {defName, isMasking};
		this.conditionalStack.push(stackItem);

		// emit any whitespace that occurred before or after the <<!DEFNAME
		var ws = matchingText.replace('<<!' + defName, '');
		this.emitText(ws);
		this.suppressLineIfEmpty = true;
	}

	negativeClose(matchingText) {
		// do not honor this match when inside a block commment
		if (this.isInsideBlockComment) {
			this.emitText(matchingText);
			return;
		}
		
		var defName = matchingText.replace('!', '').replace('>>', '').trim();
		if (this.defsMap.has(defName) == false) {
			this.emitText(matchingText);
			return;
		}

		// pop the LIFO stack
		var stackItem = this.conditionalStack.pop();
		if (defName != stackItem.defName) {
			terminal.abnormal('Mismatched conditional mark: opening name was ', terminal.red(stackItem.defName), ' but closing name is ', terminal.red(defName));
		}

		// emit any whitespace that occurred before or after the !DEFNAME>>
		var ws = matchingText.replace('!' + defName + '>>', '');
		this.emitText(ws);
		this.suppressLineIfEmpty = true;
	}
	
	affirmativeOpen(matchingText) {
		// do not honor this match when inside a block commment
		if (this.isInsideBlockComment) {
			this.emitText(matchingText);
			return;
		}
		
		var defName = matchingText.replace('<<', '').trim();
		if (this.defsMap.has(defName) == false) {
			this.emitText(matchingText);
			return;
		}
		
		// Add an item to the LIFO stack
		// if we are currently in masking mode, the new item must honor that, so it will also be masking
		// if we are not currently masking, set to true if the defName exists, false if it doesn't exist.
		var isDefValueFalse = this.isFalse(this.defsMap.get(defName));
		var isMasking = (this.isCurrentlyMasking() ? true : isDefValueFalse);
		var stackItem = {defName, isMasking};
		this.conditionalStack.push(stackItem);

		// emit any whitespace that occurred before or after the <<DEFNAME
		var ws = matchingText.replace('<<' + defName, '');
		this.emitText(ws);
		this.suppressLineIfEmpty = true;
	}

	affirmativeClose(matchingText) {
		// do not honor this match when inside a block commment
		if (this.isInsideBlockComment) {
			this.emitText(matchingText);
			return;
		}
		
		var defName = matchingText.replace('>>', '').trim();
		if (this.defsMap.has(defName) == false) {
			this.emitText(matchingText);
			return;
		}
		
		// pop the LIFO stack
		var stackItem = this.conditionalStack.pop();
		if (defName != stackItem.defName) {
			terminal.abnormal('Mismatched conditional mark: opening name was ', terminal.red(stackItem.defName), ' but closing name is ', terminal.red(defName));
		}

		// emit any whitespace that occurred before or after the DEFNAME>>
		var ws = matchingText.replace(defName + '>>', '');
		this.emitText(ws);
		this.suppressLineIfEmpty = true;
	}
	
	substitutionVariable(matchingText, lastIndex) {
		// no substitutions when inside a block commment
		if (this.isInsideBlockComment) {
			this.emitText(matchingText);
			return;
		}

		var defName = matchingText.replace('<', '').replace('>', '');
		
		if (this.defsMap.has(defName)) {
			var defValue = this.defsMap.get(defName);
			this.emitText(defValue);
		}
		else
			this.emitText(matchingText);
	}
	
	beginBlockComment(matchingText) {
		this.emitText(matchingText);
		this.isInsideBlockComment = true;
	}
	
	endBlockComment(matchingText) {
		this.emitText(matchingText);
		this.isInsideBlockComment = false;
	}
	
	leadingComment(matchingText) {
		this.emitText(matchingText);
	}
	
	terminalComment(matchingText) {
		var actualComment = matchingText.substr(1);	// remove the look-behind
		this.emitText(matchingText);
	}
	
	isFalse(text) {
		if (text == '0' || text == 'false' || text == 'False' || text == 'FALSE')
			return true;
		else
			return false;
	}
	
	isTrue(text) {
		return !this.isFalse(text);
	}
	
}



class CLI {
	
    constructor() {
		this.inputPfile = null;
		this.outputPfile = null;
		this.definesPfile = null;
		
		Object.seal(this);
    }
    
    //^ Check to see if all the necessary command line arguments are present and valid
	// argv[0] node
	// argv[1] main.js
	// argv[2] input
	// argv[3] output
	// argv[4] --options
    //< returns false to prevent actual execution
    validateOptions() {
    	    	
    	var argv = Array.from(process.argv);
    	
    	if (argv.length == 2)
    		this.usageAndExit();

    	for (let i = argv.length-1; i > 1 ; i--) {
    		var arg = argv[i];
	    	switch (arg) {
		    	case '--version':
		    		this.exit(this.showVersion());
		    		return false;
	    		
		    	case '--syntax':
		    		this.exit(this.listSyntax());
		    		return false;
		    		
		    	case '--examples':
		    		this.exit(this.listExamples());
		    		return false;
		    		
		    	case '--help':
		    		this.exit(this.listHelp());
		    		return false;
	    	}
	    	
	    	if (arg.indexOf('--defs') == 0) {
	    		this.definesPfile = new Pfile(arg.substr(7));
	    		argv.splice(i, 1);
	    	}
    	}

    	// after stripping off any --defs option, there should be just the input and output left
    	if (argv.length != 4)
    		this.usageAndExit();
    	
    	if (argv[2].constructor.name == 'String')
    		this.inputPfile = new Pfile(argv[2]);
    	
    	if (argv[3].constructor.name == 'String')
    		this.outputPfile = new Pfile(argv[3]);
    	
    	return true;
    }
    
    usageAndExit() {
		var s = [];
		s.push("usage: furcate [inputfile] [outputfile] [options]");
		s.push("");
		s.push("options:");
		s.push("    --defs       filename that contains #define statements");
		s.push("    --version");
		s.push("    --syntax     explains the furcate syntax");
		s.push("    --examples   show examples of furcate usage");
		s.push("    --help       show furcate syntax and examples");
		this.exit(s.join("\n"));
    }
    
    showVersion() {
    	try {
    		var packageFile = new Pfile(__dirname).addPath('../package.json').name;
	    	var contents = fs.readFileSync(packageFile, 'utf-8');
	    	var obj = JSON.parse(contents);
	    	return `version v${obj.version}`;
    	}
    	catch (err) {
    		return `version unknown ${err.message}`;
    	}
    }

    listSyntax() {
		var s = [];
		s.push("Syntax: furcate has definitions, affirmative conditionals, negative contitionals,");
		s.push("        substitutions, and comments.");
		s.push("");
		s.push("definition        := '#define' defName defValue");
		s.push("defName           := [A-Z] | [a-z] | [0-9] | '$' |'-' | '_'"); 
		s.push("defValue          := boolean | unicode-text");
		s.push("boolean           := 0 | false | False | FALSE | 1 | true | True | TRUE");
		s.push("");
		s.push("begin affirmative := '<<' defName");
		s.push("end affirmative   := defName '>>'");
		s.push("begin negative    := '<<!' defName");
		s.push("end negative      := '!' defName '>>'");
		s.push("");
		s.push("substitution      := '<' defName '>'");
		s.push("");
		s.push("terminal-comment  := '//' unicode-text");
		s.push("block-comment     := '/*' unicode-text '*/'");
		s.push("");
		return s.join("\n")
    }
    
    listExamples() {
		var s = [];
		s.push("Sample defining HELLO and using it in a substitution");
		s.push("");
		s.push("  #define HELLO Hola Mundo");
		s.push("");
		s.push("  function f(name) {");
		s.push("    console.log('<HELLO> ' + name)");
		s.push("  }");
		s.push("");
		s.push("Sample defining PRO-VERSION and conditionally including a block of code");
		s.push("");
		s.push("  #define PRO-VERSION");
		s.push("  <<PRO-VERSION");
		s.push("    var goldmine = new Bitcoin();");
		s.push("    goldmine.payday();");
		s.push("  PRO-VERSION>>");
		s.push("");
		s.push("Sample not defining PRO-VERSION and conditionally excluding a block of code");
		s.push("");
		s.push("  #define FREE-VERSION");
		s.push("  <<!PRO-VERSION");
		s.push("    var poorman = new Chips();");
		s.push("    poorman.payday();");
		s.push("  !PRO-VERSION>>");
		return s.join("\n")
    }

    listHelp() {
		var s = [];
		s.push("usage: furcate [inputfile] [outputfile] [options]");
		s.push("");
		s.push( this.listSyntax() );
		s.push("");
		s.push( this.listExamples() );
		return s.join("\n")
    }
    
    exit(message) {
		terminal.writeToConsoleOrStderr("\nFurcate branches and replaces files using definitions, conditionals, and substitutions\n");
		terminal.writeToConsoleOrStderr(message + "\n");
		process.exit(0);    
    }

    execute() {
		var defsFile = new DefsFile();
		var sourceFile = new SourceFile(defsFile);

		defsFile.read(this.definesPfile);		
		var rc = sourceFile.parse(this.inputPfile, this.outputPfile);
		
		process.exit(rc);
    }

    testApi(input, output, defs) {
    	expect(input, 'String');
    	expect(output, 'String');
    	expect(defs, ['String', 'null']);

    	this.inputPfile = new Pfile(input);
    	this.outputPfile = new Pfile(output);
    	if (defs != null)
    		this.definesPfile = new Pfile(defs);
    	
		var defsFile = new DefsFile();
		var sourceFile = new SourceFile(defsFile);

		defsFile.read(this.definesPfile);		
		var rc = sourceFile.parse(this.inputPfile, this.outputPfile);
    }
}

var FS = require('fs');
var action;
var fixtures;
var input
var expected;
var results;
var runTest = function(input, expected) {
	var fixturePath = '../test/fixtures/';
	var outputPath = '../test/output/';
	var pfInput = new Pfile(`${fixturePath}${input}`);
	var pfExpected = new Pfile(`${fixturePath}${expected}`).makeAbsolute();
	var pfActual = new Pfile(`${outputPath}${expected}`);
	var pfDefsFile = new Pfile(`${fixturePath}defines.frc`);
	
	var cli = new CLI();
	cli.testApi(pfInput.name, pfActual.name, pfDefsFile.name);
		
	var diff = new Diff('\x1b[41m', '\x1b[0m', '\x1b[42m', '\x1b[0m');  
	var results = diff.diffFiles(pfExpected, pfActual);
	if (results != '')
		console.log(results);
	if (results == '')
		FS.unlinkSync(pfActual.name);
	return results;
}
input='subordinate-phrase.source.blue';	expected='subordinate-phrase.dest.blue';
results = runTest(input, expected);
global.__b = (results == '');
