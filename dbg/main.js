//=============================================================================
//
// File:         furcate/src/main.js
// Language:     ECMAScript 2015
// Copyright:    Read Write Tools
// License:      MIT
// Initial date: Dec 31, 2017
// Usage:        main entry point
//
//=============================================================================

var CLI = require('./cli.class.js');
var cli = new CLI();

// Read the command line and execute
if (cli.validateOptions())
	cli.execute();
