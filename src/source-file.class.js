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

import {expect}			from 'joezone';
import {aver}			from 'joezone';
import {terminal}		from 'joezone';
import {Pfile}			from 'joezone';
import {TextReader}		from 'joezone';
import {TextWriter}		from 'joezone';
import Expressions		from './expressions.class';
import fs				from 'fs';

export default class SourceFile {

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
		var tempPfile = new Pfile(outputPfile);

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

