/* Copyright (c) 2019 Read Write Tools */
var expect = require('joezone').expect, aver = require('joezone').aver, terminal = require('joezone').terminal, Pfile = require('joezone').Pfile, TextReader = require('joezone').TextReader, Expressions = require('./expressions.class.js');

module.exports = class DefsFile {
    constructor() {
        this.defsMap = new Map(), this.patterns = new Expressions(), Object.seal(this);
    }
    read(e) {
        if (expect(e, [ 'Pfile', 'null' ]), null != e) if (e.exists()) try {
            var n = new TextReader();
            n.open(e.name);
            for (var r = ''; null != (r = n.getline()); ) this.parseLine(r);
            n.close();
        } catch (e) {
            terminal.abnormal(e.message);
        } else terminal.abnormal(`--defs file not found ${e.name}`);
    }
    parseLine(e) {
        var [n, r] = this.parsePrivate(e);
        null != n && this.defsMap.set(n, r);
    }
    parsePrivate(e) {
        var n = null;
        if (null != (n = new RegExp(this.patterns.leadingComment, 'g').exec(e))) return [ null, null ];
        if (null != (n = new RegExp(this.patterns.terminalComment, 'g').exec(e)) && (e = e.substr(0, n.index + 1)), 
        '' == e.trim()) return [ null, null ];
        if (null == (n = new RegExp(this.patterns.define, 'g').exec(e))) return terminal.abnormal('Unhandled item in --defs file ', terminal.red(e)), 
        [ null, null ];
        if (null != (n = new RegExp(this.patterns.valuedDefine, 'g').exec(e))) {
            aver(4 == n.length);
            var r = n[3].trim(), l = n[2].trim();
            return '' == l ? [ r, '' ] : [ l, r ];
        }
        return terminal.logic('Expected to find #define in ', terminal.red(e)), [ null, null ];
    }
};