//=============================================================================
//
// File:         bifurcate/src/expressions.class.js
// Language:     ECMAScript 2015
// Copyright:    Joe Honton © 2018
// License:      CC-BY-NC-ND 4.0
// Initial date: Jan 4, 2018
// Usage:        Regular expressions
//
//=============================================================================

module.exports = class  Expressions {

	constructor() {		
		// careful: JS needs solidus to be escaped so '\\s' becomes '\s'
		this.define = '(#define\\s*)';									// #define
		this.valuedDefine = '(#define\\s*)([$_A-Za-z0-9]*?\\s)(.*)';	// #define RWDOC value
		this.negativeOpen = '(<<![$_A-Za-z0-9]*?(?![$_A-Za-z0-9]))';	// <<!$RW_DOC
		this.negativeClose = '((?:\\s|^)![$_A-Za-z0-9]*>>)';			// !$RW_DOC>>
		this.affirmativeOpen = '(<<[$_A-Za-z0-9]*?(?![$_A-Za-z0-9]))';	// <<$RW_DOC
		this.affirmativeClose = '((?:\\s|^)[$_A-Za-z0-9]*>>)';			// $RW_DOC>>
		this.substitutionVariable = '(<[$_A-Za-z0-9]*?>)';				// <$RW_DOC>
		this.beginBlockComment = '(\\/\\*)';							// /*
		this.endBlockComment = '(\\*\\/)';								// */
		this.leadingComment = '(^\\/\\/.*)';							// terminal comment at beginning of line  
		this.terminalComment = '(?:[^:])(\\/\\/.*)';					// ignores http://    (also be sure to add 1 to get the intended index of the match)  
		this.anything = this.makeAnything();
		Object.seal(this);
	}
	
	makeAnything() {
		var multi = new Array();
		multi.push(this.define);
		multi.push(this.negativeOpen);
		multi.push(this.negativeClose);
		multi.push(this.affirmativeOpen);
		multi.push(this.affirmativeClose);
		multi.push(this.substitutionVariable);
		multi.push(this.beginBlockComment);
		multi.push(this.endBlockComment);
		multi.push(this.leadingComment);
		multi.push(this.terminalComment);
		return multi.join('|');
	}
}
