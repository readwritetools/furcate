var expect = require('joezone').expect, aver = require('joezone').aver, terminal = require('joezone').terminal, Pfile = require('joezone').Pfile, TextReader = require('joezone').TextReader, TextWriter = require('joezone').TextWriter, Expressions = require('./expressions.class.js'), fs = require('fs');

module.exports = class SourceFile {
    constructor(e) {
        expect(e, 'DefsFile'), this.defsFile = e, this.patterns = new Expressions(), this.emitIndex = 0, 
        this.emitPieces = new Array(), this.isInsideBlockComment = !1, this.conditionalStack = new Array(), 
        this.suppressLineIfEmpty = !1, Object.seal(this);
    }
    get defsMap() {
        return this.defsFile.defsMap;
    }
    isCurrentlyMasking() {
        var e = this.conditionalStack.length;
        return 0 != e && this.conditionalStack[e - 1].isMasking;
    }
    parse(e, t) {
        if (expect(e, 'Pfile'), expect(t, 'Pfile'), !e.exists()) return 1;
        t.makeAbsolute();
        var i = new Pfile(t.getPath());
        i.exists() || i.mkDir();
        var s = new Pfile(t).replaceExtension('tmp');
        try {
            var n = new TextReader();
            n.open(e.name);
            var a = new TextWriter();
            a.open(s.name);
            for (var r = ''; null != (r = n.getline()); ) {
                this.emitIndex = 0, this.emitPieces = new Array();
                var l = this.parseSourceLine(r);
                this.isCurrentlyMasking() || this.suppressLineIfEmpty && '' == l.trim() || a.putline(l);
            }
            return n.close(), a.close(), fs.renameSync(s.name, t.name), 0;
        } catch (e) {
            return terminal.abnormal(e.message), 1;
        }
    }
    parseSourceLine(e) {
        var t = null, i = null;
        this.suppressLineIfEmpty = !1, t = new RegExp(this.patterns.anything, 'g');
        for (i = null; null != (i = t.exec(e)); ) {
            var s = e.substring(this.emitIndex, i.index);
            this.emitText(s);
            var n = this.processRegExpMatch(e, i[0], i.index, t.lastIndex);
            if (!1 !== n) return n;
        }
        s = e.substr(this.emitIndex);
        return this.emitText(s), this.emitPieces.join('');
    }
    processRegExpMatch(e, t, i, s) {
        return this.emitIndex = s, null != new RegExp(this.patterns.negativeOpen, 'g').exec(t) ? (this.negativeOpen(t), 
        !1) : null != new RegExp(this.patterns.negativeClose, 'g').exec(t) ? (this.negativeClose(t), 
        !1) : null != new RegExp(this.patterns.affirmativeOpen, 'g').exec(t) ? (this.affirmativeOpen(t), 
        !1) : null != new RegExp(this.patterns.affirmativeClose, 'g').exec(t) ? (this.affirmativeClose(t), 
        !1) : null != new RegExp(this.patterns.substitutionVariable, 'g').exec(t) ? (this.substitutionVariable(t, s), 
        !1) : null != new RegExp(this.patterns.beginBlockComment, 'g').exec(t) ? (this.beginBlockComment(t), 
        !1) : null != new RegExp(this.patterns.endBlockComment, 'g').exec(t) ? (this.endBlockComment(t), 
        !1) : null != new RegExp(this.patterns.leadingComment, 'g').exec(t) ? (this.leadingComment(t), 
        !1) : null != new RegExp(this.patterns.terminalComment, 'g').exec(t) ? (this.terminalComment(t), 
        this.emitIndex++, !1) : null != new RegExp(this.patterns.define, 'g').exec(t) ? this.define(e) : void 0;
    }
    emitText(e) {
        this.isCurrentlyMasking() || this.emitPieces.push(e);
    }
    define(e) {
        return this.isInsideBlockComment ? e : (this.defsFile.parseLine(e), `// ${e}`);
    }
    negativeOpen(e) {
        if (this.isInsideBlockComment) this.emitText(e); else {
            var t = e.replace('<<!', '').trim();
            if (0 != this.defsMap.has(t)) {
                var i = this.isTrue(this.defsMap.get(t)), s = !!this.isCurrentlyMasking() || i, n = {
                    defName: t,
                    isMasking: s
                };
                this.conditionalStack.push(n);
                var a = e.replace('<<!' + t, '');
                this.emitText(a), this.suppressLineIfEmpty = !0;
            }
        }
    }
    negativeClose(e) {
        if (this.isInsideBlockComment) this.emitText(e); else {
            var t = e.replace('!', '').replace('>>', '').trim();
            if (0 != this.defsMap.has(t)) {
                var i = this.conditionalStack.pop();
                t != i.defName && terminal.abnormal('Mismatched conditional mark: opening name was ', terminal.red(i.defName), ' but closing name is ', terminal.red(t));
                var s = e.replace('!' + t + '>>', '');
                this.emitText(s), this.suppressLineIfEmpty = !0;
            }
        }
    }
    affirmativeOpen(e) {
        if (this.isInsideBlockComment) this.emitText(e); else {
            var t = e.replace('<<', '').trim();
            if (0 != this.defsMap.has(t)) {
                var i = this.isFalse(this.defsMap.get(t)), s = !!this.isCurrentlyMasking() || i, n = {
                    defName: t,
                    isMasking: s
                };
                this.conditionalStack.push(n);
                var a = e.replace('<<' + t, '');
                this.emitText(a), this.suppressLineIfEmpty = !0;
            }
        }
    }
    affirmativeClose(e) {
        if (this.isInsideBlockComment) this.emitText(e); else {
            var t = e.replace('>>', '').trim();
            if (0 != this.defsMap.has(t)) {
                var i = this.conditionalStack.pop();
                t != i.defName && terminal.abnormal('Mismatched conditional mark: opening name was ', terminal.red(i.defName), ' but closing name is ', terminal.red(t));
                var s = e.replace(t + '>>', '');
                this.emitText(s), this.suppressLineIfEmpty = !0;
            }
        }
    }
    substitutionVariable(e, t) {
        if (this.isInsideBlockComment) this.emitText(e); else {
            var i = e.replace('<', '').replace('>', '');
            if (this.defsMap.has(i)) {
                var s = this.defsMap.get(i);
                this.emitText(s);
            } else this.emitText(e);
        }
    }
    beginBlockComment(e) {
        this.emitText(e), this.isInsideBlockComment = !0;
    }
    endBlockComment(e) {
        this.emitText(e), this.isInsideBlockComment = !1;
    }
    leadingComment(e) {
        this.emitText(e);
    }
    terminalComment(e) {
        e.substr(1);
        this.emitText(e);
    }
    isFalse(e) {
        return '0' == e || 'false' == e || 'False' == e || 'FALSE' == e;
    }
    isTrue(e) {
        return !this.isFalse(e);
    }
};