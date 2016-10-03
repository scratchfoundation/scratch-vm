var test = require('tap').test;
var cast = require('../../src/util/cast');

test('toNumber', function (t) {
    // Numeric
    t.equal(cast.toNumber(0), 0);
    t.equal(cast.toNumber(1), 1);
    t.equal(cast.toNumber(3.14), 3.14);

    // String
    t.equal(cast.toNumber('0'), 0);
    t.equal(cast.toNumber('1'), 1);
    t.equal(cast.toNumber('3.14'), 3.14);
    t.equal(cast.toNumber('0.1e10'), 1000000000);
    t.equal(cast.toNumber('foobar'), 0);

    // Boolean
    t.equal(cast.toNumber(true), 1);
    t.equal(cast.toNumber(false), 0);
    t.equal(cast.toNumber('true'), 0);
    t.equal(cast.toNumber('false'), 0);

    // Undefined & object
    t.equal(cast.toNumber(undefined), 0);
    t.equal(cast.toNumber({}), 0);
    t.end();
});

test('toBoolean', function (t) {
    // Numeric
    t.equal(cast.toBoolean(0), false);
    t.equal(cast.toBoolean(1), true);
    t.equal(cast.toBoolean(3.14), true);

    // String
    t.equal(cast.toBoolean('0'), false);
    t.equal(cast.toBoolean('1'), true);
    t.equal(cast.toBoolean('3.14'), true);
    t.equal(cast.toBoolean('0.1e10'), true);
    t.equal(cast.toBoolean('foobar'), true);

    // Boolean
    t.equal(cast.toBoolean(true), true);
    t.equal(cast.toBoolean(false), false);

    // Undefined & object
    t.equal(cast.toBoolean(undefined), false);
    t.equal(cast.toBoolean({}), true);
    t.end();
});

test('toString', function (t) {
    // Numeric
    t.equal(cast.toString(0), '0');
    t.equal(cast.toString(1), '1');
    t.equal(cast.toString(3.14), '3.14');

    // String
    t.equal(cast.toString('0'), '0');
    t.equal(cast.toString('1'), '1');
    t.equal(cast.toString('3.14'), '3.14');
    t.equal(cast.toString('0.1e10'), '0.1e10');
    t.equal(cast.toString('foobar'), 'foobar');

    // Boolean
    t.equal(cast.toString(true), 'true');
    t.equal(cast.toString(false), 'false');

    // Undefined & object
    t.equal(cast.toString(undefined), 'undefined');
    t.equal(cast.toString({}), '[object Object]');
    t.end();
});

test('toRbgColorList', function (t) {
    // Hex (minimal, see "color" util tests)
    t.deepEqual(cast.toRgbColorList('#000'), [0,0,0]);
    t.deepEqual(cast.toRgbColorList('#000000'), [0,0,0]);
    t.deepEqual(cast.toRgbColorList('#fff'), [255,255,255]);
    t.deepEqual(cast.toRgbColorList('#ffffff'), [255,255,255]);

    // Decimal (minimal, see "color" util tests)
    t.deepEqual(cast.toRgbColorList(0), [0,0,0]);
    t.deepEqual(cast.toRgbColorList(1), [0,0,1]);
    t.deepEqual(cast.toRgbColorList(16777215), [255,255,255]);

    // Malformed
    t.deepEqual(cast.toRgbColorList('ffffff'), [0,0,0]);
    t.deepEqual(cast.toRgbColorList('foobar'), [0,0,0]);
    t.end();
});

test('compare', function (t) {
    // Numeric
    t.equal(cast.compare(0, 0), 0);
    t.equal(cast.compare(1, 0), 1);
    t.equal(cast.compare(0, 1), -1);
    t.equal(cast.compare(1, 1), 0);

    // String
    t.equal(cast.compare('0', '0'), 0);
    t.equal(cast.compare('0.1e10', '1000000000'), 0);
    t.equal(cast.compare('foobar', 'FOOBAR'), 0);
    t.equal(cast.compare('dog', 'cat'), 1);

    // Boolean
    t.equal(cast.compare(true, true), 0);
    t.equal(cast.compare(true, false), 1);
    t.equal(cast.compare(false, true), -1);
    t.equal(cast.compare(true, true), 0);

    // Undefined & object
    t.equal(cast.compare(undefined, undefined), 0);
    t.equal(cast.compare(undefined, 'undefined'), 0);
    t.equal(cast.compare({}, {}), 0);
    t.equal(cast.compare({}, '[object Object]'), 0);
    t.end();
});

test('isInt', function (t) {
    // Numeric
    t.equal(cast.isInt(0), true);
    t.equal(cast.isInt(1), true);
    t.equal(cast.isInt(0.0), true);
    t.equal(cast.isInt(3.14), false);
    t.equal(cast.isInt(NaN), true);

    // String
    t.equal(cast.isInt('0'), true);
    t.equal(cast.isInt('1'), true);
    t.equal(cast.isInt('0.0'), false);      // @todo This should be true
    t.equal(cast.isInt('0.1e10'), false);   // @todo This should be true
    t.equal(cast.isInt('3.14'), false);

    // Boolean
    t.equal(cast.isInt(true), true);
    t.equal(cast.isInt(false), true);

    // Undefined & object
    t.equal(cast.isInt(undefined), false);
    t.equal(cast.isInt({}), false);
    t.end();
});

test('toListIndex', function (t) {
    var list = [0,1,2,3,4,5];
    var empty = [];

    // Valid
    t.equal(cast.toListIndex(1, list.length), 1);
    t.equal(cast.toListIndex(6, list.length), 6);

    // Invalid
    t.equal(cast.toListIndex(-1, list.length), 'INVALID');
    t.equal(cast.toListIndex(0.1, list.length), 'INVALID');
    t.equal(cast.toListIndex(0, list.length), 'INVALID');
    t.equal(cast.toListIndex(7, list.length), 'INVALID');

    // "all"
    t.equal(cast.toListIndex('all', list.length), 'ALL');

    // "last"
    t.equal(cast.toListIndex('last', list.length), list.length);
    t.equal(cast.toListIndex('last', empty.length), 'INVALID');

    // "random"
    var random = cast.toListIndex('random', list.length);
    t.ok(random <= list.length);
    t.ok(random > 0);
    t.equal(cast.toListIndex('random', empty.length), 'INVALID');

    // "any" (alias for "random")
    var any = cast.toListIndex('any', list.length);
    t.ok(any <= list.length);
    t.ok(any > 0);
    t.equal(cast.toListIndex('any', empty.length), 'INVALID');
    t.end();
});
