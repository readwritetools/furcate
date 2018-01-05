//=============================================================================
//
// File:         bifurcate/test/fixtures/nested.*.js
// Language:     ECMAScript 2015
// Copyright:    Joe Honton © 2018
// License:      CC-BY-NC-ND 4.0
// Initial date: Jan 5, 2018
// Contents:     nested conditionals
//
//=============================================================================
 
class log1 {
	static trace(msg) {
		process.stderr.write(`${gray}   [TRACE] ${nocolor}${msg}\n`);
	}
	static warning(msg) {
		process.stderr.write(`${gray} [WARNING] ${nocolor}${msg}\n`);
	}
}


// #define INNERMOST Innermost
//Comment A
	// Comment B
		// Comment C
			// Comment D
				Innermost
			// Comment E
		// Comment F
	// Comment G
//Comment H
