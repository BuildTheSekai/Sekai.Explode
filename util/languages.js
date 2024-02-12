const path = require('path');
const config = require('../config.json');
const LANG = require('../language/default.json');

/**
 * @type {typeof import('../language/default.json')}
 */
const configLANG = require(path.join(__dirname, '..', 'language', (config.language ?? 'default') + '.json'));

Object.assign(LANG, configLANG);

class FormatSyntaxError extends SyntaxError {
    /**
     * @param {string} message
     */
    constructor(message) {
        super(message);
    }
}

// enum like in Java?!
/**
 * @enum {State} format 関数で用いる有限オートマトンの状態。
 */
class State {
    constructor() {}
    static PLAIN = new State();
    static ESCAPED = new State();
    static AFTER_DOLLAR = new State();
    static IN_PLACEHOLDER = new State();
}

/**
 * 文字列中のプレースホルダを指定された値で置き換える。
 * 
 * `str` は `"${"` と `"}"` に囲まれたプレースホルダを含むことができる。
 * 文字列 `placeholder` について、 `str` 中の `"${" + placeholder + "}"` は
 * `values?.[placeholder.trim()]` に置き換えられる。
 * ただし、`placeholder.trim()` は `placeholder` の先頭と末尾の空白文字を除いた文字列である。
 * プレースホルダ外において、`"\\\\""`, `"\\$", `"\\{" はそれぞれ `"\\"`, `"$"`, `"{"` に置き換えられる。
 * 
 * 例:
 * ```
 * format("text ${a} abc", { a: 123 });    // == "text 123 abc"
 * format("text ${ a } abc", { a: 123 });  // == "text 123 abc"
 * format("text \\${a} abc", { a: 123 });  // == "text ${a} abc"
 * format("text $\\{a} abc", { a: 123 });  // == "text ${a} abc"
 * ```
 * 
 * @param {string} str 文字列のフォーマット
 * @param {Object=} values プレースホルダを置き換える値
 */
function strFormat(str, values) {
    let result = '';
    let placeholder = '';

    // 入力を str, 状態を PLAIN, ESCAPED, AFTER_DOLLAR, IN_PLACEHOLDER とした有限オートマトンを構成
    // 入力は常に1文字ずつ読み進められる。
    let state = State.PLAIN;
    for (const c of str) {
        switch (state) {
            case State.PLAIN:
                if (c == '\\')
                    state = State.ESCAPED;
                else if (c == '$')
                    state = State.AFTER_DOLLAR;
                else
                    result += c;
                break;
            case State.ESCAPED:
                if (c == '\\' || c == '$' || c == '{')
                    result += c;
                else
                    result += '\\' + c;
                state = State.PLAIN;
                break;
            case State.AFTER_DOLLAR:
                if (c == '\\') {
                    result += '$';
                    state = State.ESCAPED;
                } else if (c == '{') {
                    state = State.IN_PLACEHOLDER;
                } else {
                    result += '$' + 'c';
                    state = State.PLAIN;
                }
                break;
            case State.IN_PLACEHOLDER:
                if (c == '}') {
                    result += values?.[placeholder.trim()];
                    placeholder = '';
                    state = State.PLAIN;
                } else {
                    placeholder += c;
                }
                break;
        }
    }

    if (state == State.ESCAPED)
        result += '\\';
    if (state == State.IN_PLACEHOLDER)
        throw new FormatSyntaxError("Unexpected end of input; '}' expected")

    return result;
}

module.exports = { LANG, FormatSyntaxError, strFormat };
