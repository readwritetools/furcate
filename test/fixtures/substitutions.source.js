//=============================================================================
//
// File:         bifurcate/test/fixtures/substitution.*.js
// Language:     ECMAScript 2015
// Copyright:    Joe Honton © 2018
// License:      CC-BY-NC-ND 4.0
// Initial date: Jan 5, 2018
// Contents:     substitutions
//
//=============================================================================

#define VAR1   Regular
#define VAR2   "Quoted text"
#define VAR3   Contains terminal comment // terminal comment
#define VAR4   // no value
#define VAR5   1234567890

 1. <VAR1>
 2. `<VAR1>`
 3. '<VAR1>'
 4. "<VAR1>"
 5. (<VAR1>)
 6. <VAR2>
 7. <VAR3>
 8. <VAR4>
 9. <VAR5><VAR5>
10. <VAR5> <VAR5>
