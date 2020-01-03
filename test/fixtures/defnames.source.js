//=============================================================================
//
// File:         bifurcate/test/fixtures/def-names.*.js
// Language:     ECMAScript 2015
// Copyright:    Read Write Tools
// License:      MIT
// Initial date: Jan 5, 2018
// Contents:     def names
//
//=============================================================================

#define REGULAR				Regular
#define UNDERSCORED_STRING 	With underscore in name
#define $DOLLAR				Some prefer using a dollar sign
#define TitleCase			Upper and lower allowed
#define lowercase			All lowercase allowed
#define V2					Contains numerals
#define TERMINALCOMMENT		Contains terminal comment // terminal comment
#define BLOCKCOMMENT		Block comment /* Caution: block comments not allowed on #define lines */
// #define INVISIBLE1 inside comment
/*
	#define INVISIBLE2 inside block comment
*/   

 1. <REGULAR>
 2. <UNDERSCORED_STRING>
 3. <$DOLLAR>
 4. <TitleCase>
 5. <lowercase>
 6. <V2>
 7. <TERMINALCOMMENT>
 8. <BLOCKCOMMENT>
 9. <INVISIBLE1>
10. <INVISIBLE2>
