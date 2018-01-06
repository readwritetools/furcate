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

module.exports = class Terminal {

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
