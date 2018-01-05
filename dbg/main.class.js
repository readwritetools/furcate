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
var Expressions = require('./expressions.class.js');
var DefsFile = require('./defs-file.class.js');
var SourceFile = require('./source-file.class.js');

module.exports = class Main {

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
