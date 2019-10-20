//=============================================================================
//
// File:         bifurcate/test/cases/core.test.js
// Language:     Bequiesce
// Copyright:    Joe Honton © 2018
// License:      CC-BY-NC-ND 4.0
// Initial date: Jan 5, 2018
//
//=============================================================================

//@common
var Pfile = require('joezone').Pfile;
var Diff = require('joezone').Diff;
var CLI = require('../../../dbg/cli.class.js');
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
		
	var diff = new Diff('\x1b[41m', '\x1b[0m', '\x1b[42m', '\x1b[0m');  // red/green console
	var results = diff.diffFiles(pfExpected, pfActual);
	if (results != '')
		console.log(results);
	if (results == '')
		FS.unlinkSync(pfActual.name);

	return results;
}


//-----------------------------------------------------------------------------
//@using core
results = runTest(input, expected);

//@testing code
input='affirmatives.source.js';			expected='affirmatives.dest.js';					;; results == ''
input='negatives.source.js';			expected='negatives.dest.js';						;; results == ''
input='block-comments.source.js';		expected='block-comments.dest.js';					;; results == ''
input='defnames.source.js';				expected='defnames.dest.js';						;; results == ''
input='substitutions.source.js';		expected='substitutions.dest.js';					;; results == ''
input='nested.source.js';				expected='nested.dest.js';							;; results == ''
input='subordinate-phrase.source.blue';	expected='subordinate-phrase.dest.blue';			;; results == ''
