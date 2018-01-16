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
var DefsFile = require('./defs-file.class.js');
var SourceFile = require('./source-file.class.js');
var fs = require('fs');

module.exports = class CLI {
	
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
		s.push("defValue          := unicode-text");
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
