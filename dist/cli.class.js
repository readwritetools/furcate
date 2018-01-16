var expect = require('joezone').expect, terminal = require('joezone').terminal, Pfile = require('joezone').Pfile, DefsFile = require('./defs-file.class.js'), SourceFile = require('./source-file.class.js'), fs = require('fs');

module.exports = class CLI {
    constructor() {
        this.inputPfile = null, this.outputPfile = null, this.definesPfile = null, Object.seal(this);
    }
    validateOptions() {
        var e = Array.from(process.argv);
        2 == e.length && this.usageAndExit();
        for (let s = e.length - 1; s > 1; s--) {
            var i = e[s];
            switch (i) {
              case '--version':
                return this.exit(this.showVersion()), !1;

              case '--syntax':
                return this.exit(this.listSyntax()), !1;

              case '--examples':
                return this.exit(this.listExamples()), !1;

              case '--help':
                return this.exit(this.listHelp()), !1;
            }
            0 == i.indexOf('--defs') && (this.definesPfile = new Pfile(i.substr(7)), e.splice(s, 1));
        }
        return 4 != e.length && this.usageAndExit(), 'String' == e[2].constructor.name && (this.inputPfile = new Pfile(e[2])), 
        'String' == e[3].constructor.name && (this.outputPfile = new Pfile(e[3])), !0;
    }
    usageAndExit() {
        var e = [];
        e.push('usage: furcate [inputfile] [outputfile] [options]'), e.push(''), e.push('options:'), 
        e.push('    --defs       filename that contains #define statements'), e.push('    --version'), 
        e.push('    --syntax     explains the furcate syntax'), e.push('    --examples   show examples of furcate usage'), 
        e.push('    --help       show furcate syntax and examples'), this.exit(e.join('\n'));
    }
    showVersion() {
        try {
            var e = new Pfile(__dirname).addPath('../package.json').name, i = fs.readFileSync(e, 'utf-8'), s = JSON.parse(i);
            return `version v${s.version}`;
        } catch (e) {
            return `version unknown ${e.message}`;
        }
    }
    listSyntax() {
        var e = [];
        return e.push('Syntax: furcate has definitions, affirmative conditionals, negative contitionals,'), 
        e.push('        substitutions, and comments.'), e.push(''), e.push('definition        := \'#define\' defName defValue'), 
        e.push('defName           := [A-Z] | [a-z] | [0-9] | \'-\' | \'_\''), e.push('defValue          := unicode-text'), 
        e.push(''), e.push('begin affirmative := \'<<\' defName'), e.push('end affirmative   := defName \'>>\''), 
        e.push('begin negative    := \'<<!\' defName'), e.push('end negative      := \'!\' defName \'>>\''), 
        e.push(''), e.push('substitution      := \'<\' defName \'>\''), e.push(''), e.push('terminal-comment  := \'//\' unicode-text'), 
        e.push('block-comment     := \'/*\' unicode-text \'*/\''), e.push(''), e.join('\n');
    }
    listExamples() {
        var e = [];
        return e.push('Sample defining HELLO and using it in a substitution'), e.push(''), 
        e.push('  #define HELLO Hola Mundo'), e.push(''), e.push('  function f(name) {'), 
        e.push('    console.log(\'<HELLO> \' + name)'), e.push('  }'), e.push(''), e.push('Sample defining PRO-VERSION and conditionally including a block of code'), 
        e.push(''), e.push('  #define PRO-VERSION'), e.push('  <<PRO-VERSION'), e.push('    var goldmine = new Bitcoin();'), 
        e.push('    goldmine.payday();'), e.push('  PRO-VERSION>>'), e.push(''), e.push('Sample not defining PRO-VERSION and conditionally excluding a block of code'), 
        e.push(''), e.push('  #define FREE-VERSION'), e.push('  <<!PRO-VERSION'), e.push('    var poorman = new Chips();'), 
        e.push('    poorman.payday();'), e.push('  !PRO-VERSION>>'), e.join('\n');
    }
    listHelp() {
        var e = [];
        return e.push('usage: furcate [inputfile] [outputfile] [options]'), e.push(''), 
        e.push(this.listSyntax()), e.push(''), e.push(this.listExamples()), e.join('\n');
    }
    exit(e) {
        terminal.writeToConsoleOrStderr('\nFurcate branches and replaces files using definitions, conditionals, and substitutions\n'), 
        terminal.writeToConsoleOrStderr(e + '\n'), process.exit(0);
    }
    execute() {
        var e = new DefsFile(), i = new SourceFile(e);
        e.read(this.definesPfile);
        var s = i.parse(this.inputPfile, this.outputPfile);
        process.exit(s);
    }
    testApi(e, i, s) {
        expect(e, 'String'), expect(i, 'String'), expect(s, [ 'String', 'null' ]), this.inputPfile = new Pfile(e), 
        this.outputPfile = new Pfile(i), null != s && (this.definesPfile = new Pfile(s));
        var t = new DefsFile(), n = new SourceFile(t);
        t.read(this.definesPfile);
        n.parse(this.inputPfile, this.outputPfile);
    }
};