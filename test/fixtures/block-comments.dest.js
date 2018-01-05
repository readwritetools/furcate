//=============================================================================
//
// File:         bifurcate/test/fixtures/block-comments.*.js
// Language:     ECMAScript 2015
// Copyright:    Joe Honton © 2018
// License:      CC-BY-NC-ND 4.0
// Initial date: Jan 5, 2018
// Contents:     block comments
//
//=============================================================================
 
/*
<<BCM1
class log1 {
	static trace(msg) {
		process.stderr.write(`${gray}   [TRACE] ${nocolor}${msg}\n`);
	}
	static warning(msg) {
		process.stderr.write(`${gray} [WARNING] ${nocolor}${msg}\n`);
	}
	static abnormal(msg) {
		process.stderr.write(`${red}[ABNORMAL] ${nocolor}${msg}\n`);
	}
	static logic(msg) {
		process.stderr.write(`${red}   [LOGIC] ${nocolor}${msg}\n`);
	}
}
BCM1>>
*/
class log2 {
	static trace(msg) {
		process.stderr.write(`${gray}   [TRACE] ${nocolor}${msg}\n`);
	}
	/*
	static warning(msg) {
		process.stderr.write(`${gray} [WARNING] ${nocolor}${msg}\n`);
	}
	static abnormal(msg) {
		process.stderr.write(`${red}[ABNORMAL] ${nocolor}${msg}\n`);
	}
	*/
	static logic(msg) {
		process.stderr.write(`${red}   [LOGIC] ${nocolor}${msg}\n`);
	}
}
/*
<<!BCM3
class log3 {
	static trace(msg) {
		process.stderr.write(`${gray}   [TRACE] ${nocolor}${msg}\n`);
	}
	static warning(msg) {
		process.stderr.write(`${gray} [WARNING] ${nocolor}${msg}\n`);
	}
	static abnormal(msg) {
		process.stderr.write(`${red}[ABNORMAL] ${nocolor}${msg}\n`);
	}
	static logic(msg) {
		process.stderr.write(`${red}   [LOGIC] ${nocolor}${msg}\n`);
	}
}
!BCM3>>
*/
