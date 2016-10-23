var test = require('tap').test;
var Operators = require('../../src/blocks/scratch3_operators');

var blocks = new Operators(null);

test('getPrimitives', function (t) {
    t.type(blocks.getPrimitives(), 'object');
    t.end();
});

test('add', function (t) {
    t.strictEqual(blocks.add({NUM1: '1', NUM2: '1'}), 2);
    t.strictEqual(blocks.add({NUM1: 'foo', NUM2: 'bar'}), 0);
    t.end();
});

test('subtract', function (t) {
    t.strictEqual(blocks.subtract({NUM1: '1', NUM2: '1'}), 0);
    t.strictEqual(blocks.subtract({NUM1: 'foo', NUM2: 'bar'}), 0);
    t.end();
});

test('multiply', function (t) {
    t.strictEqual(blocks.multiply({NUM1: '2', NUM2: '2'}), 4);
    t.strictEqual(blocks.multiply({NUM1: 'foo', NUM2: 'bar'}), 0);
    t.end();
});

test('divide', function (t) {
    t.strictEqual(blocks.divide({NUM1: '2', NUM2: '2'}), 1);
    t.strictEqual(blocks.divide({NUM1: '1', NUM2: '0'}), Infinity);   // @todo
    t.ok(isNaN(blocks.divide({NUM1: 'foo', NUM2: 'bar'})));           // @todo
    t.end();
});

test('lt', function (t) {
    t.strictEqual(blocks.lt({OPERAND1: '1', OPERAND2: '2'}), true);
    t.strictEqual(blocks.lt({OPERAND1: '2', OPERAND2: '1'}), false);
    t.strictEqual(blocks.lt({OPERAND1: '1', OPERAND2: '1'}), false);
    t.end();
});

test('equals', function (t) {
    t.strictEqual(blocks.equals({OPERAND1: '1', OPERAND2: '2'}), false);
    t.strictEqual(blocks.equals({OPERAND1: '2', OPERAND2: '1'}), false);
    t.strictEqual(blocks.equals({OPERAND1: '1', OPERAND2: '1'}), true);
    t.end();
});

test('gt', function (t) {
    t.strictEqual(blocks.gt({OPERAND1: '1', OPERAND2: '2'}), false);
    t.strictEqual(blocks.gt({OPERAND1: '2', OPERAND2: '1'}), true);
    t.strictEqual(blocks.gt({OPERAND1: '1', OPERAND2: '1'}), false);
    t.end();
});

test('and', function (t) {
    t.strictEqual(blocks.and({OPERAND1: true, OPERAND2: true}), true);
    t.strictEqual(blocks.and({OPERAND1: true, OPERAND2: false}), false);
    t.strictEqual(blocks.and({OPERAND1: false, OPERAND2: false}), false);
    t.end();
});

test('or', function (t) {
    t.strictEqual(blocks.or({OPERAND1: true, OPERAND2: true}), true);
    t.strictEqual(blocks.or({OPERAND1: true, OPERAND2: false}), true);
    t.strictEqual(blocks.or({OPERAND1: false, OPERAND2: false}), false);
    t.end();
});

test('not', function (t) {
    t.strictEqual(blocks.not({OPERAND: true}), false);
    t.strictEqual(blocks.not({OPERAND: false}), true);
    t.end();
});

test('random', function (t) {
    var min = 0;
    var max = 100;
    var result = blocks.random({FROM: min, TO: max});
    t.ok(result >= min);
    t.ok(result <= max);
    t.end();
});

test('random - equal', function (t) {
    var min = 1;
    var max = 1;
    t.strictEqual(blocks.random({FROM: min, TO: max}), min);
    t.end();
});

test('random - decimal', function (t) {
    var min = 0.1;
    var max = 10;
    var result = blocks.random({FROM: min, TO: max});
    t.ok(result >= min);
    t.ok(result <= max);
    t.end();
});

test('random - int', function (t) {
    var min = 0;
    var max = 10;
    var result = blocks.random({FROM: min, TO: max});
    t.ok(result >= min);
    t.ok(result <= max);
    t.end();
});

test('random - reverse', function (t) {
    var min = 0;
    var max = 10;
    var result = blocks.random({FROM: max, TO: min});
    t.ok(result >= min);
    t.ok(result <= max);
    t.end();
});

test('join', function (t) {
    t.strictEqual(blocks.join({STRING1: 'foo', STRING2: 'bar'}), 'foobar');
    t.strictEqual(blocks.join({STRING1: '1', STRING2: '2'}), '12');
    t.end();
});

test('letterOf', function (t) {
    t.strictEqual(blocks.letterOf({STRING: 'foo', LETTER: 0}), '');
    t.strictEqual(blocks.letterOf({STRING: 'foo', LETTER: 1}), 'f');
    t.strictEqual(blocks.letterOf({STRING: 'foo', LETTER: 2}), 'o');
    t.strictEqual(blocks.letterOf({STRING: 'foo', LETTER: 3}), 'o');
    t.strictEqual(blocks.letterOf({STRING: 'foo', LETTER: 4}), '');
    t.strictEqual(blocks.letterOf({STRING: 'foo', LETTER: 'bar'}), '');
    t.end();
});

test('length', function (t) {
    t.strictEqual(blocks.length({STRING: ''}), 0);
    t.strictEqual(blocks.length({STRING: 'foo'}), 3);
    t.strictEqual(blocks.length({STRING: '1'}), 1);
    t.strictEqual(blocks.length({STRING: '100'}), 3);
    t.end();
});

test('mod', function (t) {
    t.strictEqual(blocks.mod({NUM1: 1, NUM2: 1}), 0);
    t.strictEqual(blocks.mod({NUM1: 3, NUM2: 6}), 3);
    t.strictEqual(blocks.mod({NUM1: -3, NUM2: 6}), 3);
    t.end();
});

test('round', function (t) {
    t.strictEqual(blocks.round({NUM: 1}), 1);
    t.strictEqual(blocks.round({NUM: 1.1}), 1);
    t.strictEqual(blocks.round({NUM: 1.5}), 2);
    t.end();
});

test('mathop', function (t) {
    t.strictEqual(blocks.mathop({OPERATOR: 'abs', NUM: -1}), 1);
    t.strictEqual(blocks.mathop({OPERATOR: 'floor', NUM: 1.5}), 1);
    t.strictEqual(blocks.mathop({OPERATOR: 'ceiling', NUM: 0.1}), 1);
    t.strictEqual(blocks.mathop({OPERATOR: 'sqrt', NUM: 1}), 1);
    t.strictEqual(blocks.mathop({OPERATOR: 'sin', NUM: 1}), 0.01745240643728351);
    t.strictEqual(blocks.mathop({OPERATOR: 'cos', NUM: 1}), 0.9998476951563913);
    t.strictEqual(blocks.mathop({OPERATOR: 'tan', NUM: 1}), 0.017455064928217585);
    t.strictEqual(blocks.mathop({OPERATOR: 'asin', NUM: 1}), 90);
    t.strictEqual(blocks.mathop({OPERATOR: 'acos', NUM: 1}), 0);
    t.strictEqual(blocks.mathop({OPERATOR: 'atan', NUM: 1}), 45);
    t.strictEqual(blocks.mathop({OPERATOR: 'ln', NUM: 1}), 0);
    t.strictEqual(blocks.mathop({OPERATOR: 'log', NUM: 1}), 0);
    t.strictEqual(blocks.mathop({OPERATOR: 'e ^', NUM: 1}), 2.718281828459045);
    t.strictEqual(blocks.mathop({OPERATOR: '10 ^', NUM: 1}), 10);
    t.strictEqual(blocks.mathop({OPERATOR: 'undefined', NUM: 1}), 0);
    t.end();
});
