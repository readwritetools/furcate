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
 
<<NEST1
class log1 {
	<<NEST2
	static trace(msg) {
		process.stderr.write(`${gray}   [TRACE] ${nocolor}${msg}\n`);
	}
	static warning(msg) {
		process.stderr.write(`${gray} [WARNING] ${nocolor}${msg}\n`);
	}
	NEST2>>
	<<!NEST3
	static abnormal(msg) {
		process.stderr.write(`${red}[ABNORMAL] ${nocolor}${msg}\n`);
	}
	static logic(msg) {
		process.stderr.write(`${red}   [LOGIC] ${nocolor}${msg}\n`);
	}
	!NEST3>>
}
NEST1>>

<<!NEST4
class log1 {
	<<NEST5
	static trace(msg) {
		process.stderr.write(`${gray}   [TRACE] ${nocolor}${msg}\n`);
	}
	static warning(msg) {
		process.stderr.write(`${gray} [WARNING] ${nocolor}${msg}\n`);
	}
	NEST5>>
	<<!NEST6
	static abnormal(msg) {
		process.stderr.write(`${red}[ABNORMAL] ${nocolor}${msg}\n`);
	}
	static logic(msg) {
		process.stderr.write(`${red}   [LOGIC] ${nocolor}${msg}\n`);
	}
	!NEST6>>
}
!NEST4>>

#define INNERMOST Innermost
<<NEST1
//Comment A
	<<NEST2
	// Comment B
		<<NEST3
		// Comment C
			<<NEST4
			// Comment D
				<INNERMOST>
			NEST4>>
			// Comment E
		NEST3>>
		// Comment F
	NEST2>>
	// Comment G
NEST1>>
//Comment H
