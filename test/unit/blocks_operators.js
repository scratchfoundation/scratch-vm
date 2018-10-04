const test = require('tap').test;
const Operators = require('../../src/blocks/scratch3_operators');

const blocks = new Operators(null);

test('getPrimitives', t => {
    t.type(blocks.getPrimitives(), 'object');
    t.end();
});

test('add', t => {
    t.strictEqual(blocks.add({NUM1: '1', NUM2: '1'}), 2);
    t.strictEqual(blocks.add({NUM1: 'foo', NUM2: 'bar'}), 0);
    t.end();
});

test('subtract', t => {
    t.strictEqual(blocks.subtract({NUM1: '1', NUM2: '1'}), 0);
    t.strictEqual(blocks.subtract({NUM1: 'foo', NUM2: 'bar'}), 0);
    t.end();
});

test('multiply', t => {
    t.strictEqual(blocks.multiply({NUM1: '2', NUM2: '2'}), 4);
    t.strictEqual(blocks.multiply({NUM1: 'foo', NUM2: 'bar'}), 0);
    t.end();
});

test('divide', t => {
    t.strictEqual(blocks.divide({NUM1: '2', NUM2: '2'}), 1);
    t.strictEqual(blocks.divide({NUM1: '1', NUM2: '0'}), Infinity); // @todo
    t.ok(isNaN(blocks.divide({NUM1: 'foo', NUM2: 'bar'}))); // @todo
    t.end();
});

test('lt', t => {
    t.strictEqual(blocks.lt({OPERAND1: '1', OPERAND2: '2'}), true);
    t.strictEqual(blocks.lt({OPERAND1: '2', OPERAND2: '1'}), false);
    t.strictEqual(blocks.lt({OPERAND1: '1', OPERAND2: '1'}), false);
    t.strictEqual(blocks.lt({OPERAND1: '10', OPERAND2: '2'}), false);
    t.strictEqual(blocks.lt({OPERAND1: 'a', OPERAND2: 'z'}), true);
    t.end();
});

test('equals', t => {
    t.strictEqual(blocks.equals({OPERAND1: '1', OPERAND2: '2'}), false);
    t.strictEqual(blocks.equals({OPERAND1: '2', OPERAND2: '1'}), false);
    t.strictEqual(blocks.equals({OPERAND1: '1', OPERAND2: '1'}), true);
    t.strictEqual(blocks.equals({OPERAND1: 'あ', OPERAND2: 'ア'}), false);
    t.end();
});

test('gt', t => {
    t.strictEqual(blocks.gt({OPERAND1: '1', OPERAND2: '2'}), false);
    t.strictEqual(blocks.gt({OPERAND1: '2', OPERAND2: '1'}), true);
    t.strictEqual(blocks.gt({OPERAND1: '1', OPERAND2: '1'}), false);
    t.end();
});

test('and', t => {
    t.strictEqual(blocks.and({OPERAND1: true, OPERAND2: true}), true);
    t.strictEqual(blocks.and({OPERAND1: true, OPERAND2: false}), false);
    t.strictEqual(blocks.and({OPERAND1: false, OPERAND2: false}), false);
    t.end();
});

test('or', t => {
    t.strictEqual(blocks.or({OPERAND1: true, OPERAND2: true}), true);
    t.strictEqual(blocks.or({OPERAND1: true, OPERAND2: false}), true);
    t.strictEqual(blocks.or({OPERAND1: false, OPERAND2: false}), false);
    t.end();
});

test('not', t => {
    t.strictEqual(blocks.not({OPERAND: true}), false);
    t.strictEqual(blocks.not({OPERAND: false}), true);
    t.end();
});

test('random', t => {
    const min = 0;
    const max = 100;
    const result = blocks.random({FROM: min, TO: max});
    t.ok(result >= min);
    t.ok(result <= max);
    t.end();
});

test('random - equal', t => {
    const min = 1;
    const max = 1;
    t.strictEqual(blocks.random({FROM: min, TO: max}), min);
    t.end();
});

test('random - decimal', t => {
    const min = 0.1;
    const max = 10;
    const result = blocks.random({FROM: min, TO: max});
    t.ok(result >= min);
    t.ok(result <= max);
    t.end();
});

test('random - int', t => {
    const min = 0;
    const max = 10;
    const result = blocks.random({FROM: min, TO: max});
    t.ok(result >= min);
    t.ok(result <= max);
    t.end();
});

test('random - reverse', t => {
    const min = 0;
    const max = 10;
    const result = blocks.random({FROM: max, TO: min});
    t.ok(result >= min);
    t.ok(result <= max);
    t.end();
});

test('join', t => {
    t.strictEqual(blocks.join({STRING1: 'foo', STRING2: 'bar'}), 'foobar');
    t.strictEqual(blocks.join({STRING1: '1', STRING2: '2'}), '12');
    t.end();
});

test('letterOf', t => {
    t.strictEqual(blocks.letterOf({STRING: 'foo', LETTER: 0}), '');
    t.strictEqual(blocks.letterOf({STRING: 'foo', LETTER: 1}), 'f');
    t.strictEqual(blocks.letterOf({STRING: 'foo', LETTER: 2}), 'o');
    t.strictEqual(blocks.letterOf({STRING: 'foo', LETTER: 3}), 'o');
    t.strictEqual(blocks.letterOf({STRING: 'foo', LETTER: 4}), '');
    t.strictEqual(blocks.letterOf({STRING: 'foo', LETTER: 'bar'}), '');
    t.end();
});

test('length', t => {
    t.strictEqual(blocks.length({STRING: ''}), 0);
    t.strictEqual(blocks.length({STRING: 'foo'}), 3);
    t.strictEqual(blocks.length({STRING: '1'}), 1);
    t.strictEqual(blocks.length({STRING: '100'}), 3);
    t.end();
});

test('contains', t => {
    t.strictEqual(blocks.contains({STRING1: 'hello world', STRING2: 'hello'}), true);
    t.strictEqual(blocks.contains({STRING1: 'foo', STRING2: 'bar'}), false);
    t.strictEqual(blocks.contains({STRING1: 'HeLLo world', STRING2: 'hello'}), true);
    t.end();
});

test('mod', t => {
    t.strictEqual(blocks.mod({NUM1: 1, NUM2: 1}), 0);
    t.strictEqual(blocks.mod({NUM1: 3, NUM2: 6}), 3);
    t.strictEqual(blocks.mod({NUM1: -3, NUM2: 6}), 3);
    t.end();
});

test('round', t => {
    t.strictEqual(blocks.round({NUM: 1}), 1);
    t.strictEqual(blocks.round({NUM: 1.1}), 1);
    t.strictEqual(blocks.round({NUM: 1.5}), 2);
    t.end();
});

test('mathop', t => {
    t.strictEqual(blocks.mathop({OPERATOR: 'abs', NUM: -1}), 1);
    t.strictEqual(blocks.mathop({OPERATOR: 'floor', NUM: 1.5}), 1);
    t.strictEqual(blocks.mathop({OPERATOR: 'ceiling', NUM: 0.1}), 1);
    t.strictEqual(blocks.mathop({OPERATOR: 'sqrt', NUM: 1}), 1);
    t.strictEqual(blocks.mathop({OPERATOR: 'sin', NUM: 1}), 0.0174524064);
    t.strictEqual(blocks.mathop({OPERATOR: 'sin', NUM: 90}), 1);
    t.strictEqual(blocks.mathop({OPERATOR: 'cos', NUM: 1}), 0.9998476952);
    t.strictEqual(blocks.mathop({OPERATOR: 'cos', NUM: 180}), -1);
    t.strictEqual(blocks.mathop({OPERATOR: 'tan', NUM: 1}), 0.0174550649);
    t.strictEqual(blocks.mathop({OPERATOR: 'tan', NUM: 90}), Infinity);
    t.strictEqual(blocks.mathop({OPERATOR: 'tan', NUM: 180}), 0);
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
