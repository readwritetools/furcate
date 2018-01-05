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

export default class terminal {

	static gray(str)	{ return `\x1b[90m${str}\x1b[0m`; }
	static red(str)		{ return `\x1b[91m${str}\x1b[0m`; }
	static green(str)	{ return `\x1b[92m${str}\x1b[0m`; }
	static yellow(str)	{ return `\x1b[93m${str}\x1b[0m`; }
	static blue(str)	{ return `\x1b[94m${str}\x1b[0m`; }
	static magenta(str)	{ return `\x1b[95m${str}\x1b[0m`; }
	static cyan(str)	{ return `\x1b[96m${str}\x1b[0m`; }
	static white(str)	{ return `\x1b[97m${str}\x1b[0m`; }

	static trace(...params) {
		process.stderr.write(terminal.gray('   [TRACE] ') + params.join('') + '\n');
	}
	
	static warning(...params) {
		process.stderr.write(terminal.gray(' [WARNING] ') + params.join('') + '\n');
	}
	
	static abnormal(...params) {
		process.stderr.write( terminal.red('[ABNORMAL] ') + params.join('') + '\n');
	}
	
	static logic(...params) {
		process.stderr.write( terminal.red('   [LOGIC] ') + params.join('') + '\n');
	}
}
