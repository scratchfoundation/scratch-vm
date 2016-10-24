var test = require('tap').test;
var color = require('../../src/util/color');

test('decimalToHex', function (t) {
    t.strictEqual(color.decimalToHex(0), '#000000');
    t.strictEqual(color.decimalToHex(1), '#000001');
    t.strictEqual(color.decimalToHex(16777215), '#ffffff');
    t.strictEqual(color.decimalToHex(-16777215), '#000001');
    t.strictEqual(color.decimalToHex(99999999), '#5f5e0ff');
    t.end();
});

test('decimalToRgb', function (t) {
    t.deepEqual(color.decimalToRgb(0), {r: 0, g: 0, b: 0});
    t.deepEqual(color.decimalToRgb(1), {r: 0, g: 0, b: 1});
    t.deepEqual(color.decimalToRgb(16777215), {r: 255, g: 255, b: 255});
    t.deepEqual(color.decimalToRgb(-16777215), {r: 0, g: 0, b: 1});
    t.deepEqual(color.decimalToRgb(99999999), {r: 245, g: 224, b: 255});
    t.end();
});

test('hexToRgb', function (t) {
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

test('rgbToHex', function (t) {
    t.strictEqual(color.rgbToHex({r: 0, g: 0, b: 0}), '#000000');
    t.strictEqual(color.rgbToHex({r: 255, g: 255, b: 255}), '#ffffff');
    t.strictEqual(color.rgbToHex({r: 0, g: 255, b: 170}), '#00ffaa');
    t.end();
});

test('rgbToDecimal', function (t) {
    t.strictEqual(color.rgbToDecimal({r: 0, g: 0, b: 0}), 0);
    t.strictEqual(color.rgbToDecimal({r: 255, g: 255, b: 255}), 16777215);
    t.strictEqual(color.rgbToDecimal({r: 0, g: 255, b: 170}), 65450);
    t.end();
});

test('hexToDecimal', function (t) {
    t.strictEqual(color.hexToDecimal('#000'), 0);
    t.strictEqual(color.hexToDecimal('#000000'), 0);
    t.strictEqual(color.hexToDecimal('#fff'), 16777215);
    t.strictEqual(color.hexToDecimal('#ffffff'), 16777215);
    t.strictEqual(color.hexToDecimal('#0fa'), 65450);
    t.strictEqual(color.hexToDecimal('#00ffaa'), 65450);
    t.end();
});
