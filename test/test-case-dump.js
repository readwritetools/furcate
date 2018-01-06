var Pfile = require('joezone').Pfile;
var Diff = require('joezone').Diff;
//=============================================================================
//
// File:         bifurcate/src/main.class.js
// Language:     ECMAScript 2015
// Copyright:    Joe Honton © 2018
// License:      CC-BY-NC-ND 4.0
// Initial date: Jan 3, 2018
// Usage:        bifurcate inputfile outputfile --defs=defsfile
//
//=============================================================================

var expect = require('joezone').expect;
var Pfile = require('joezone').Pfile;
//=============================================================================
//
// File:         bifurcate/src/expressions.class.js
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
		this.define = '(#define\\s*)';									// #define
		this.valuedDefine = '(#define\\s*)([$_A-Za-z0-9]*?\\s)(.*)';	// #define RWDOC value
		this.negativeOpen = '(<<![$_A-Za-z0-9]*?(?![$_A-Za-z0-9]))';	// <<!$RW_DOC
		this.negativeClose = '((?:\\s|^)![$_A-Za-z0-9]*>>)';			// !$RW_DOC>>
		this.affirmativeOpen = '(<<[$_A-Za-z0-9]*?(?![$_A-Za-z0-9]))';	// <<$RW_DOC
		this.affirmativeClose = '((?:\\s|^)[$_A-Za-z0-9]*>>)';			// $RW_DOC>>
		this.substitutionVariable = '(<[$_A-Za-z0-9]*?>)';				// <$RW_DOC>
		this.beginBlockComment = '(\\/\\*)';							// /*
		this.endBlockComment = '(\\*\\/)';								// */
		this.leadingComment = '(^\\/\\/.*)';							// terminal comment at beginning of line  
		this.terminalComment = '(?:[^:])(\\/\\/.*)';					// ignores http://    (also be sure to add 1 to get the intended index of the match)  
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

//=============================================================================
//
// File:         bifurcate/src/defs-file.class.js
// Language:     ECMAScript 2015
// Copyright:    Joe Honton © 2018
// License:      CC-BY-NC-ND 4.0
// Initial date: Jan 3, 2018
// Usage:       Parse the defs file into a map
//
//=============================================================================

var expect = require('joezone').expect;
var aver = require('joezone').aver;
var Pfile = require('joezone').Pfile;
var TextReader = require('joezone').TextReader;
//=============================================================================
//
// File:         bifurcate/src/terminal.class.js
// Language:     ECMAScript 2015
// Copyright:    Joe Honton © 2018
// License:      CC-BY-NC-ND 4.0
// Initial date: Jan 3, 2018
// Usage:        general purpose console logger with terminal colors
//
//=============================================================================

class Terminal {

	static gray(str)	{ return `\x1b[90m${str}\x1b[0m`; }
	static red(str)		{ return `\x1b[91m${str}\x1b[0m`; }
	static green(str)	{ return `\x1b[92m${str}\x1b[0m`; }
	static yellow(str)	{ return `\x1b[93m${str}\x1b[0m`; }
	static blue(str)	{ return `\x1b[94m${str}\x1b[0m`; }
	static magenta(str)	{ return `\x1b[95m${str}\x1b[0m`; }
	static cyan(str)	{ return `\x1b[96m${str}\x1b[0m`; }
	static white(str)	{ return `\x1b[97m${str}\x1b[0m`; }

	static trace(...params) {
		Terminal.write(Terminal.gray(  '   [TRACE] '), params.join(''));
	}
	
	static invalid(...params) {
		Terminal.write(Terminal.yellow(' [INVALID] '), params.join(''));
	}
	
	static warning(...params) {
		Terminal.write(Terminal.yellow(' [WARNING] '), params.join(''));
	}
	
	static abnormal(...params) {
		Terminal.write(Terminal.red(   '[ABNORMAL] ') + Terminal.getFunctionName(4), params.join(''));
	}
	
	static logic(...params) {
		Terminal.write(Terminal.red(   '   [LOGIC] ') + Terminal.getFunctionName(4), params.join(''));
	}
	
	static setProcessName(name) {
		Object.defineProperty(Terminal, 'processName', { value: name, writable: true});
	}
	
	static getProcessName() {
		return (Terminal.processName == undefined) ? '' : Terminal.gray(Terminal.processName);
	}

	static write(tag, message) {
		Terminal.writeToConsoleOrStderr(Terminal.getProcessName() + tag + message + '\n');
	}
	
	//^ Send message to browser console or CLI stderr
	writeToConsoleOrStderr(message) {
		if (typeof console == 'object' && typeof console.warn == 'function')
			console.warn(message);
		else if (typeof process == 'object' && typeof process.stderr == 'object' && typeof process.stderr.write == 'function')
			process.stderr.write(message);
		else
			throw new Error(message);
	}

	//^ Take a snapshot of the stack and return
    //< {className.memberName}
	static getFunctionName(depth) {
		// create an Error object, but don't throw it
		var stackTraceLine = (new Error).stack.split("\n")[depth];
		
		// extract the classname and member name from the backtrace (assuming the backtrace pattern adopted by "node")
		var regex1 = /at (.*) ?\(/g;
		var matches = regex1.exec(stackTraceLine);
		var desiredOutput = '';
		if (matches == null)
			return stackTraceLine;
		if (matches.length > 1)
			desiredOutput += matches[1].trim();
		desiredOutput = Terminal.rightAlign(desiredOutput, 30);
		return `{${desiredOutput}} `;
	}

	// Can't use Text.rightAlign because it results in a circular require
	//^ Right align the given string to fit within a fixed width character column
    static rightAlign(s, width) {
    	var columnLen = width;
    	var stringLen = s.length;
    	if (stringLen > columnLen)
    		return s.substr(0,columnLen-3) + '...';
    	else
    		return ' '.repeat(columnLen+1 - stringLen) + s;
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
// File:         bifurcate/src/source-file.class.js
// Language:     ECMAScript 2015
// Copyright:    Joe Honton © 2018
// License:      CC-BY-NC-ND 4.0
// Initial date: Jan 3, 2018
// Usage:       Parse the source file replacing defs and conditinally including/excluding blocks
//
//=============================================================================

var expect = require('joezone').expect;
var aver = require('joezone').aver;
var Pfile = require('joezone').Pfile;
var TextReader = require('joezone').TextReader;
var TextWriter = require('joezone').TextWriter;

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
	parse(inputPfile, outputPfile) {
		expect(inputPfile, 'Pfile');
		expect(outputPfile, 'Pfile');
		
		if (!inputPfile.exists())
			return;
		
		outputPfile.makeAbsolute();
		var outputPath = new Pfile(outputPfile.getPath());
		if (!outputPath.exists())
			outputPath.mkDir();
		
		try {
			var tr = new TextReader();
			tr.open(inputPfile.name);

			var tw = new TextWriter();
			tw.open(outputPfile.name);
			
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
		}
		catch(err) {
			terminal.abnormal(err.message);
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
		
		// Add an item to the LIFO stack
		// if we are currently in masking mode, the new item must honor than, so it will also be masking
		// if we are not currently masking, set to true if the defName does not exist, false if it does exist.
		var defNameExists = this.defsMap.has(defName);
		var isMasking = (this.isCurrentlyMasking() ? true : defNameExists);
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
		
		// Add an item to the LIFO stack
		// if we are currently in masking mode, the new item must honor that, so it will also be masking
		// if we are not currently masking, set to true if the defName exists, false if it doesn't exist.
		var defNameExists = this.defsMap.has(defName);
		var isMasking = (this.isCurrentlyMasking() ? true : !defNameExists);
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
}



class Main {

	constructor() {
		this.inputPfile = null;
		this.outputPfile = null;
		this.definesPfile = null;
		
		this.defsFile = new DefsFile();
		this.sourceFile = new SourceFile(this.defsFile);
		this.patterns = new Expressions();
		
		Object.seal(this);
	}

	// CLI interface
	cli() {
		if (this.parseArgs() == false)
			return;
		
		this.process();		
	}
	
	// API interface
	api(inputFile, outputFile, defsFile) {
		expect(inputFile, 'String');
		expect(outputFile, 'String');
		expect(defsFile, ['String', 'null']);
		
		this.inputPfile = new Pfile(inputFile);
		this.inputPfile.makeAbsolute();
		this.outputPfile = new Pfile(outputFile);
		if (defsFile != null)
			this.definesPfile = new Pfile(defsFile);
		
		this.process();		
	}
	
	//< return false to halt execution
	parseArgs() {
		// argv[0] node
		// argv[1] main.js
		// argv[2] inputfile
		// argv[3] outputfile
		// argv[4] option
		if (process.argv.length < 4) {
			process.stderr.write("usage: bifurcate inputfile outputfile --defs=deffile");
			return false;
		}

		this.inputPfile = new Pfile(process.argv[2]);
		this.inputPfile.makeAbsolute();
		if (!this.inputPfile.exists()) {
			process.stderr.write(`${inputPfile.name} not found`);
			return false;
		}
		
		this.outputPfile = new Pfile(process.argv[3]);
		
		if (process.argv.length > 4) {
			if (process.argv[4].indexOf('--defs=') == 0) {
				this.definesPfile = new Pfile(process.argv[4].substr(7));
			}
		}
		return true;
	}

	// common to CLI and API
	process() {
		this.defsFile.read(this.definesPfile);		
		this.sourceFile.parse(this.inputPfile, this.outputPfile);
	}
}

var FS = require('fs');
var Log = require('joezone').Log;
global.log = new Log();
var term = terminal;
var action;
var fixtures;
var input
var expected;
var results;
var runTest = function(input, expected) {
	var fixturePath = './test/fixtures/';
	var outputPath = './test/output/';
	var pfInput = new Pfile(`${fixturePath}${input}`);
	var pfExpected = new Pfile(`${fixturePath}${expected}`).makeAbsolute();
	var pfActual = new Pfile(`${outputPath}${expected}`);
	var pfDefsFile = new Pfile(`${fixturePath}defines.def`);
	
	var main = new Main();
	main.api(pfInput.name, pfActual.name, pfDefsFile.name);
		
	var diff = new Diff('\x1b[41m', '\x1b[0m', '\x1b[42m', '\x1b[0m');  
	var results = diff.diffFiles(pfExpected, pfActual);
	if (results != '')
		console.log(results);
	if (results == '')
		FS.unlinkSync(pfActual.name);
	return results;
}
input='nested.source.js';			expected='nested.dest.js';
results = runTest(input, expected);
global.__b = (results == '');
