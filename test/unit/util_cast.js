const test = require('tap').test;
const cast = require('../../src/util/cast');

test('toNumber', t => {
    // Numeric
    t.strictEqual(cast.toNumber(0), 0);
    t.strictEqual(cast.toNumber(1), 1);
    t.strictEqual(cast.toNumber(3.14), 3.14);

    // String
    t.strictEqual(cast.toNumber('0'), 0);
    t.strictEqual(cast.toNumber('1'), 1);
    t.strictEqual(cast.toNumber('3.14'), 3.14);
    t.strictEqual(cast.toNumber('0.1e10'), 1000000000);
    t.strictEqual(cast.toNumber('foobar'), 0);

    // Boolean
    t.strictEqual(cast.toNumber(true), 1);
    t.strictEqual(cast.toNumber(false), 0);
    t.strictEqual(cast.toNumber('true'), 0);
    t.strictEqual(cast.toNumber('false'), 0);

    // Undefined & object
    t.strictEqual(cast.toNumber(undefined), 0);
    t.strictEqual(cast.toNumber({}), 0);
    t.strictEqual(cast.toNumber(NaN), 0);
    t.end();
});

test('toBoolean', t => {
    // Numeric
    t.strictEqual(cast.toBoolean(0), false);
    t.strictEqual(cast.toBoolean(1), true);
    t.strictEqual(cast.toBoolean(3.14), true);

    // String
    t.strictEqual(cast.toBoolean('0'), false);
    t.strictEqual(cast.toBoolean('1'), true);
    t.strictEqual(cast.toBoolean('3.14'), true);
    t.strictEqual(cast.toBoolean('0.1e10'), true);
    t.strictEqual(cast.toBoolean('foobar'), true);

    // Boolean
    t.strictEqual(cast.toBoolean(true), true);
    t.strictEqual(cast.toBoolean(false), false);

    // Undefined & object
    t.strictEqual(cast.toBoolean(undefined), false);
    t.strictEqual(cast.toBoolean({}), true);
    t.end();
});

test('toString', t => {
    // Numeric
    t.strictEqual(cast.toString(0), '0');
    t.strictEqual(cast.toString(1), '1');
    t.strictEqual(cast.toString(3.14), '3.14');

    // String
    t.strictEqual(cast.toString('0'), '0');
    t.strictEqual(cast.toString('1'), '1');
    t.strictEqual(cast.toString('3.14'), '3.14');
    t.strictEqual(cast.toString('0.1e10'), '0.1e10');
    t.strictEqual(cast.toString('foobar'), 'foobar');

    // Boolean
    t.strictEqual(cast.toString(true), 'true');
    t.strictEqual(cast.toString(false), 'false');

    // Undefined & object
    t.strictEqual(cast.toString(undefined), 'undefined');
    t.strictEqual(cast.toString({}), '[object Object]');
    t.end();
});

test('toRgbColorList', t => {
    // Hex (minimal, see "color" util tests)
    t.deepEqual(cast.toRgbColorList('#000'), [0, 0, 0]);
    t.deepEqual(cast.toRgbColorList('#000000'), [0, 0, 0]);
    t.deepEqual(cast.toRgbColorList('#fff'), [255, 255, 255]);
    t.deepEqual(cast.toRgbColorList('#ffffff'), [255, 255, 255]);

    // Decimal (minimal, see "color" util tests)
    t.deepEqual(cast.toRgbColorList(0), [0, 0, 0]);
    t.deepEqual(cast.toRgbColorList(1), [0, 0, 1]);
    t.deepEqual(cast.toRgbColorList(16777215), [255, 255, 255]);

    // Malformed
    t.deepEqual(cast.toRgbColorList('ffffff'), [0, 0, 0]);
    t.deepEqual(cast.toRgbColorList('foobar'), [0, 0, 0]);
    t.end();
});

test('toRgbColorObject', t => {
    // Hex (minimal, see "color" util tests)
    t.deepEqual(cast.toRgbColorObject('#000'), {r: 0, g: 0, b: 0});
    t.deepEqual(cast.toRgbColorObject('#000000'), {r: 0, g: 0, b: 0});
    t.deepEqual(cast.toRgbColorObject('#fff'), {r: 255, g: 255, b: 255});
    t.deepEqual(cast.toRgbColorObject('#ffffff'), {r: 255, g: 255, b: 255});

    // Decimal (minimal, see "color" util tests)
    t.deepEqual(cast.toRgbColorObject(0), {a: 255, r: 0, g: 0, b: 0});
    t.deepEqual(cast.toRgbColorObject(1), {a: 255, r: 0, g: 0, b: 1});
    t.deepEqual(cast.toRgbColorObject(16777215), {a: 255, r: 255, g: 255, b: 255});
    t.deepEqual(cast.toRgbColorObject('0x80010203'), {a: 128, r: 1, g: 2, b: 3});

    // Malformed
    t.deepEqual(cast.toRgbColorObject('ffffff'), {a: 255, r: 0, g: 0, b: 0});
    t.deepEqual(cast.toRgbColorObject('foobar'), {a: 255, r: 0, g: 0, b: 0});
    t.deepEqual(cast.toRgbColorObject('#nothex'), {a: 255, r: 0, g: 0, b: 0});
    t.end();
});

test('compare', t => {
    // Numeric
    t.strictEqual(cast.compare(0, 0), 0);
    t.strictEqual(cast.compare(1, 0), 1);
    t.strictEqual(cast.compare(0, 1), -1);
    t.strictEqual(cast.compare(1, 1), 0);

    // String
    t.strictEqual(cast.compare('0', '0'), 0);
    t.strictEqual(cast.compare('0.1e10', '1000000000'), 0);
    t.strictEqual(cast.compare('foobar', 'FOOBAR'), 0);
    t.ok(cast.compare('dog', 'cat') > 0);

    // Boolean
    t.strictEqual(cast.compare(true, true), 0);
    t.strictEqual(cast.compare(true, false), 1);
    t.strictEqual(cast.compare(false, true), -1);
    t.strictEqual(cast.compare(true, true), 0);

    // Undefined & object
    t.strictEqual(cast.compare(undefined, undefined), 0);
    t.strictEqual(cast.compare(undefined, 'undefined'), 0);
    t.strictEqual(cast.compare({}, {}), 0);
    t.strictEqual(cast.compare({}, '[object Object]'), 0);
    t.end();
});

test('isInt', t => {
    // Numeric
    t.strictEqual(cast.isInt(0), true);
    t.strictEqual(cast.isInt(1), true);
    t.strictEqual(cast.isInt(0.0), true);
    t.strictEqual(cast.isInt(3.14), false);
    t.strictEqual(cast.isInt(NaN), true);

    // String
    t.strictEqual(cast.isInt('0'), true);
    t.strictEqual(cast.isInt('1'), true);
    t.strictEqual(cast.isInt('0.0'), false);
    t.strictEqual(cast.isInt('0.1e10'), false);
    t.strictEqual(cast.isInt('3.14'), false);

    // Boolean
    t.strictEqual(cast.isInt(true), true);
    t.strictEqual(cast.isInt(false), true);

    // Undefined & object
    t.strictEqual(cast.isInt(undefined), false);
    t.strictEqual(cast.isInt({}), false);
    t.end();
});

test('toListIndex', t => {
    const list = [0, 1, 2, 3, 4, 5];
    const empty = [];

    // Valid
    t.strictEqual(cast.toListIndex(1, list.length, false), 1);
    t.strictEqual(cast.toListIndex(6, list.length, false), 6);

    // Invalid
    t.strictEqual(cast.toListIndex(-1, list.length, false), cast.LIST_INVALID);
    t.strictEqual(cast.toListIndex(0.1, list.length, false), cast.LIST_INVALID);
    t.strictEqual(cast.toListIndex(0, list.length, false), cast.LIST_INVALID);
    t.strictEqual(cast.toListIndex(7, list.length, false), cast.LIST_INVALID);

    // "all"
    t.strictEqual(cast.toListIndex('all', list.length, true), cast.LIST_ALL);
    t.strictEqual(cast.toListIndex('all', list.length, false), cast.LIST_INVALID);

    // "last"
    t.strictEqual(cast.toListIndex('last', list.length, false), list.length);
    t.strictEqual(cast.toListIndex('last', empty.length, false), cast.LIST_INVALID);

    // "random"
    const random = cast.toListIndex('random', list.length, false);
    t.ok(random <= list.length);
    t.ok(random > 0);
    t.strictEqual(cast.toListIndex('random', empty.length, false), cast.LIST_INVALID);

    // "any" (alias for "random")
    const any = cast.toListIndex('any', list.length, false);
    t.ok(any <= list.length);
    t.ok(any > 0);
    t.strictEqual(cast.toListIndex('any', empty.length, false), cast.LIST_INVALID);
    t.end();
});
