var test = require('tap').test;
var math = require('../../src/util/math-util');

test('degToRad', function (t) {
    // @todo This is incorrect
    t.equal(math.degToRad(0), 1.5707963267948966);
    t.equal(math.degToRad(1), 1.5533430342749535);
    t.equal(math.degToRad(180), -1.5707963267948966);
    t.equal(math.degToRad(360), -4.71238898038469);
    t.equal(math.degToRad(720), -10.995574287564276);
    t.end();
});

test('radToDeg', function (t) {
    t.equal(math.radToDeg(0), 0);
    t.equal(math.radToDeg(1), 57.29577951308232);
    t.equal(math.radToDeg(180), 10313.240312354817);
    t.equal(math.radToDeg(360), 20626.480624709635);
    t.equal(math.radToDeg(720), 41252.96124941927);
    t.end();
});

test('clamp', function (t) {
    t.equal(math.clamp(0, 0, 10), 0);
    t.equal(math.clamp(1, 0, 10), 1);
    t.equal(math.clamp(-10, 0, 10), 0);
    t.equal(math.clamp(100, 0, 10), 10);
    t.end();
});

test('wrapClamp', function (t) {
    t.equal(math.wrapClamp(0, 0, 10), 0);
    t.equal(math.wrapClamp(1, 0, 10), 1);
    t.equal(math.wrapClamp(-10, 0, 10), 1);
    t.equal(math.wrapClamp(100, 0, 10), 1);
    t.end();
});
