







<figure>
	<img src='/img/tasks/furcate/furcate-wikimedia-rosser1954.jpg' width='100%' />
	<figcaption></figcaption>
</figure>

# Furcate

## Macro preprocessor for JavaScript


<address>
<img src='/img/rwtools.png' width=80 /> by <a href='https://readwritetools.com' title='Read Write Tools'>Read Write Tools</a> <time datetime=2016-10-19>Nov 19, 2016</time></address>



<table>
	<tr><th>Abstract</th></tr>
	<tr><td>The <span class=product>furcate</span> command line utility branches and replaces files using definitions, conditionals, and substitutions.</td></tr>
</table>

### Motivation

The C language has a macro preprocessor which allows programmers to inject
xeno-language statements into their source code. This is useful because it
allows a single code base to be used for two or more targets without having to
rely on compile time or execution time conditionals.

The <span>furcate</span> utility provides a similar feature for JavaScript
source code.

### Prerequisites and installation

The <span>furcate</span> utility uses Node.js. Package installation is done
via NPM. These are the only two prerequisites.

To install the utility and make it available to your Bash shell, use this
command.

```bash
[user@host]# npm install -g furcate
```

### Usage

The software is invoked from the command line with:

```bash
[user@host]# furcate [input-file] [output-file] --defs=definitions-file
```

The input file is a regular JavaScript source code file with:

   * macro definitions
   * macro affirmative conditionals
   * macro negative conditionals
   * macro substitutions
   * comments

The definitions file contains the `#define` statements for evaluating which macro
conditional statements to keep or discard.

The macro syntax adheres to the following EBNF.

```ebnf
definition        := '#define' defName defValue
defName           := [A-Z] | [a-z] | [0-9] | '$' |'-' | '_'
defValue          := boolean | unicode-text
boolean           := 0 | false | False | FALSE | 1 | true | True | TRUE

begin affirmative := '<<' defName
end affirmative   := defName '>>'
begin negative    := '<<!' defName
end negative      := '!' defName '>>'

substitution      := '<' defName '>'

terminal-comment  := '//' unicode-text
block-comment     := '/*' unicode-text '*/'
```

Here is an example that defines HELLO and uses it in a substitution:

```furcate
#define HELLO Hola Mundo

function f(name) {
    console.log('<HELLO> ' + name);
}
```

Here is an example that defines PRO-VERSION and conditionally includes a block
of code:

```furcate
#define PRO-VERSION
<<PRO-VERSION
    var goldmine = new Bitcoin();
    goldmine.payday();
PRO-VERSION>>
```

Here is an example that defines FREE-VERSION and conditionally excludes a block
of code:

```furcate
#define FREE-VERSION
<<!FREE-VERSION
    var goldmine = new Bitcoin();
    goldmine.payday();
!FREE-VERSION>>
<<FREE-VERSION
    var poorman = new Chips();
    poorman.payday();
FREE-VERSION>>
```

### License

The <span>furcate</span> command line utility is licensed under the MIT
License.

<img src='/img/blue-seal-mit.png' width=80 align=right />

<details>
	<summary>MIT License</summary>
	<p>Copyright © 2020 Read Write Tools.</p>
	<p>Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:</p>
	<p>The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.</p>
	<p>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.</p>
</details>

### Availability


<table>
	<tr><td>Source code</td> 			<td><a href='https://github.com/readwritetools/furcate'>github</a></td></tr>
	<tr><td>Package installation</td> <td><a href='https://www.npmjs.com/package/furcate'>NPM</a></td></tr>
	<tr><td>Documentation</td> 		<td><a href='https://hub.readwritetools.com/tasks/furcate.blue'>Read Write Hub</a></td></tr>
</table>

