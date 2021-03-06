//=============================================================================
//
// File:         furcate/src/defs-file.class.js
// Language:     ECMAScript 2015
// Copyright:    Read Write Tools
// License:      MIT
// Initial date: Jan 3, 2018
// Usage:       Parse the defs file into a map
//
//=============================================================================

import {expect}			from 'joezone';
import {aver}			from 'joezone';
import {terminal}		from 'joezone';
import {Pfile}			from 'joezone';
import {TextReader}		from 'joezone';
import Expressions		from './expressions.class';

export default class DefsFile {

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

