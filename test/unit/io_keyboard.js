var test = require('tap').test;
var Keyboard = require('../../src/io/keyboard');
var Runtime = require('../../src/engine/runtime');

test('spec', function (t) {
    var rt = new Runtime();
    var k = new Keyboard(rt);

    t.type(k, 'object');
    t.type(k.postData, 'function');
    t.type(k.getKeyIsDown, 'function');
    t.end();
});

test('space', function (t) {
    var rt = new Runtime();
    var k = new Keyboard(rt);

    k.postData({
        keyCode: 32,
        isDown: true
    });
    t.strictDeepEquals(k._keysPressed, [32]);
    t.strictEquals(k.getKeyIsDown('space'), true);
    t.strictEquals(k.getKeyIsDown('any'), true);
    t.end();
});

test('letter', function (t) {
    var rt = new Runtime();
    var k = new Keyboard(rt);

    k.postData({
        keyCode: 65,
        isDown: true
    });
    t.strictDeepEquals(k._keysPressed, [65]);
    t.strictEquals(k.getKeyIsDown('a'), true);
    t.strictEquals(k.getKeyIsDown('any'), true);
    t.end();
});

test('number', function (t) {
    var rt = new Runtime();
    var k = new Keyboard(rt);

    k.postData({
        keyCode: 49,
        isDown: true
    });
    t.strictDeepEquals(k._keysPressed, [49]);
    t.strictEquals(k.getKeyIsDown(49), true);
    t.strictEquals(k.getKeyIsDown('any'), true);
    t.end();
});

test('keyup', function (t) {
    var rt = new Runtime();
    var k = new Keyboard(rt);

    k.postData({
        keyCode: 37,
        isDown: true
    });
    k.postData({
        keyCode: 37,
        isDown: false
    });
    t.strictDeepEquals(k._keysPressed, []);
    t.strictEquals(k.getKeyIsDown(37), false);
    t.strictEquals(k.getKeyIsDown('any'), false);
    t.end();
});
