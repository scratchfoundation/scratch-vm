const test = require('tap').test;
const color = require('../../src/util/color');

/**
 * Assert that two HSV colors are similar to each other, within a tolerance.
 * @param {Test} t - the Tap test object.
 * @param {HSVObject} actual - the first HSV color to compare.
 * @param {HSVObject} expected - the other HSV color to compare.
 */
const hsvSimilar = function (t, actual, expected) {
    if ((Math.abs(actual.h - expected.h) >= 1) ||
        (Math.abs(actual.s - expected.s) >= 0.01) ||
        (Math.abs(actual.v - expected.v) >= 0.01)
    ) {
        t.fail('HSV colors not similar enough', {
            actual: actual,
            expected: expected
        });
    }
};

/**
 * Assert that two RGB colors are similar to each other, within a tolerance.
 * @param {Test} t - the Tap test object.
 * @param {RGBObject} actual - the first RGB color to compare.
 * @param {RGBObject} expected - the other RGB color to compare.
 */
const rgbSimilar = function (t, actual, expected) {
    if ((Math.abs(actual.r - expected.r) >= 1) ||
        (Math.abs(actual.g - expected.g) >= 1) ||
        (Math.abs(actual.b - expected.b) >= 1)
    ) {
        t.fail('RGB colors not similar enough', {
            actual: actual,
            expected: expected
        });
    }
};

test('decimalToHex', t => {
    t.strictEqual(color.decimalToHex(0), '#000000');
    t.strictEqual(color.decimalToHex(1), '#000001');
    t.strictEqual(color.decimalToHex(16777215), '#ffffff');
    t.strictEqual(color.decimalToHex(-16777215), '#000001');
    t.strictEqual(color.decimalToHex(99999999), '#5f5e0ff');
    t.end();
});

test('decimalToRgb', t => {
    t.deepEqual(color.decimalToRgb(0), {a: 255, r: 0, g: 0, b: 0});
    t.deepEqual(color.decimalToRgb(1), {a: 255, r: 0, g: 0, b: 1});
    t.deepEqual(color.decimalToRgb(16777215), {a: 255, r: 255, g: 255, b: 255});
    t.deepEqual(color.decimalToRgb(-16777215), {a: 255, r: 0, g: 0, b: 1});
    t.deepEqual(color.decimalToRgb(99999999), {a: 5, r: 245, g: 224, b: 255});
    t.end();
});

test('hexToRgb', t => {
    t.deepEqual(color.hexToRgb('#000'), {r: 0, g: 0, b: 0});
    t.deepEqual(color.hexToRgb('#000000'), {r: 0, g: 0, b: 0});
    t.deepEqual(color.hexToRgb('#fff'), {r: 255, g: 255, b: 255});
    t.deepEqual(color.hexToRgb('#ffffff'), {r: 255, g: 255, b: 255});
    t.deepEqual(color.hexToRgb('#0fa'), {r: 0, g: 255, b: 170});
    t.deepEqual(color.hexToRgb('#00ffaa'), {r: 0, g: 255, b: 170});

    t.deepEqual(color.hexToRgb('000'), {r: 0, g: 0, b: 0});
    t.deepEqual(color.hexToRgb('fff'), {r: 255, g: 255, b: 255});
    t.deepEqual(color.hexToRgb('00ffaa'), {r: 0, g: 255, b: 170});

    t.deepEqual(color.hexToRgb('0'), null);
    t.deepEqual(color.hexToRgb('hello world'), null);

    t.end();
});

test('rgbToHex', t => {
    t.strictEqual(color.rgbToHex({r: 0, g: 0, b: 0}), '#000000');
    t.strictEqual(color.rgbToHex({r: 255, g: 255, b: 255}), '#ffffff');
    t.strictEqual(color.rgbToHex({r: 0, g: 255, b: 170}), '#00ffaa');
    t.end();
});

test('rgbToDecimal', t => {
    t.strictEqual(color.rgbToDecimal({r: 0, g: 0, b: 0}), 0);
    t.strictEqual(color.rgbToDecimal({r: 255, g: 255, b: 255}), 16777215);
    t.strictEqual(color.rgbToDecimal({r: 0, g: 255, b: 170}), 65450);
    t.end();
});

test('hexToDecimal', t => {
    t.strictEqual(color.hexToDecimal('#000'), 0);
    t.strictEqual(color.hexToDecimal('#000000'), 0);
    t.strictEqual(color.hexToDecimal('#fff'), 16777215);
    t.strictEqual(color.hexToDecimal('#ffffff'), 16777215);
    t.strictEqual(color.hexToDecimal('#0fa'), 65450);
    t.strictEqual(color.hexToDecimal('#00ffaa'), 65450);
    t.end();
});

test('hsvToRgb', t => {
    rgbSimilar(t, color.hsvToRgb({h: 0, s: 0, v: 0}), {r: 0, g: 0, b: 0});
    rgbSimilar(t, color.hsvToRgb({h: 123, s: 0.1234, v: 0}), {r: 0, g: 0, b: 0});
    rgbSimilar(t, color.hsvToRgb({h: 0, s: 0, v: 1}), {r: 255, g: 255, b: 255});
    rgbSimilar(t, color.hsvToRgb({h: 321, s: 0, v: 1}), {r: 255, g: 255, b: 255});
    rgbSimilar(t, color.hsvToRgb({h: 0, s: 1, v: 1}), {r: 255, g: 0, b: 0});
    rgbSimilar(t, color.hsvToRgb({h: 120, s: 1, v: 1}), {r: 0, g: 255, b: 0});
    rgbSimilar(t, color.hsvToRgb({h: 240, s: 1, v: 1}), {r: 0, g: 0, b: 255});
    t.end();
});

test('rgbToHsv', t => {
    hsvSimilar(t, color.rgbToHsv({r: 0, g: 0, b: 0}), {h: 0, s: 0, v: 0});
    hsvSimilar(t, color.rgbToHsv({r: 64, g: 64, b: 64}), {h: 0, s: 0, v: 0.25});
    hsvSimilar(t, color.rgbToHsv({r: 128, g: 128, b: 128}), {h: 0, s: 0, v: 0.5});
    hsvSimilar(t, color.rgbToHsv({r: 192, g: 192, b: 192}), {h: 0, s: 0, v: 0.75});
    hsvSimilar(t, color.rgbToHsv({r: 255, g: 255, b: 255}), {h: 0, s: 0, v: 1});
    hsvSimilar(t, color.rgbToHsv({r: 255, g: 0, b: 0}), {h: 0, s: 1, v: 1});
    hsvSimilar(t, color.rgbToHsv({r: 0, g: 255, b: 0}), {h: 120, s: 1, v: 1});
    hsvSimilar(t, color.rgbToHsv({r: 0, g: 0, b: 255}), {h: 240, s: 1, v: 1});
    t.end();
});

test('mixRgb', t => {
    rgbSimilar(t, color.mixRgb({r: 10, g: 20, b: 30}, {r: 30, g: 40, b: 50}, -1), {r: 10, g: 20, b: 30});
    rgbSimilar(t, color.mixRgb({r: 10, g: 20, b: 30}, {r: 30, g: 40, b: 50}, 0), {r: 10, g: 20, b: 30});
    rgbSimilar(t, color.mixRgb({r: 10, g: 20, b: 30}, {r: 30, g: 40, b: 50}, 0.25), {r: 15, g: 25, b: 35});
    rgbSimilar(t, color.mixRgb({r: 10, g: 20, b: 30}, {r: 30, g: 40, b: 50}, 0.5), {r: 20, g: 30, b: 40});
    rgbSimilar(t, color.mixRgb({r: 10, g: 20, b: 30}, {r: 30, g: 40, b: 50}, 0.75), {r: 25, g: 35, b: 45});
    rgbSimilar(t, color.mixRgb({r: 10, g: 20, b: 30}, {r: 30, g: 40, b: 50}, 1), {r: 30, g: 40, b: 50});
    rgbSimilar(t, color.mixRgb({r: 10, g: 20, b: 30}, {r: 30, g: 40, b: 50}, 2), {r: 30, g: 40, b: 50});
    t.end();
});
