module.exports = class Expressions {
    constructor() {
        this.define = '(#define\\s*)', this.valuedDefine = '(#define\\s*)([$_A-Za-z0-9]*?\\s)(.*)', 
        this.negativeOpen = '(<<![$_A-Za-z0-9]*?(?![$_A-Za-z0-9]))', this.negativeClose = '((?:\\s|^)![$_A-Za-z0-9]*>>)', 
        this.affirmativeOpen = '(<<[$_A-Za-z0-9]*?(?![$_A-Za-z0-9]))', this.affirmativeClose = '((?:\\s|^)[$_A-Za-z0-9]*>>)', 
        this.substitutionVariable = '(<[$_A-Za-z0-9]*?>)', this.beginBlockComment = '(\\/\\*)', 
        this.endBlockComment = '(\\*\\/)', this.leadingComment = '(^\\/\\/.*)', this.terminalComment = '(?:[^:])(\\/\\/.*)', 
        this.anything = this.makeAnything(), Object.seal(this);
    }
    makeAnything() {
        var e = new Array();
        return e.push(this.define), e.push(this.negativeOpen), e.push(this.negativeClose), 
        e.push(this.affirmativeOpen), e.push(this.affirmativeClose), e.push(this.substitutionVariable), 
        e.push(this.beginBlockComment), e.push(this.endBlockComment), e.push(this.leadingComment), 
        e.push(this.terminalComment), e.join('|');
    }
};