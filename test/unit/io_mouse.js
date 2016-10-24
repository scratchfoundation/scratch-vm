var test = require('tap').test;
var Mouse = require('../../src/io/mouse');
var Runtime = require('../../src/engine/runtime');

test('spec', function (t) {
    var rt = new Runtime();
    var m = new Mouse(rt);

    t.type(m, 'object');
    t.type(m.postData, 'function');
    t.type(m.getX, 'function');
    t.type(m.getY, 'function');
    t.type(m.getIsDown, 'function');
    t.end();
});

test('mouseUp', function (t) {
    var rt = new Runtime();
    var m = new Mouse(rt);

    m.postData({
        x: 1,
        y: 10,
        isDown: false,
        canvasWidth: 480,
        canvasHeight: 360
    });
    t.strictEquals(m.getX(), -239);
    t.strictEquals(m.getY(), 170);
    t.strictEquals(m.getIsDown(), false);
    t.end();
});

test('mouseDown', function (t) {
    var rt = new Runtime();
    var m = new Mouse(rt);

    m.postData({
        x: 10,
        y: 100,
        isDown: true,
        canvasWidth: 480,
        canvasHeight: 360
    });
    t.strictEquals(m.getX(), -230);
    t.strictEquals(m.getY(), 80);
    t.strictEquals(m.getIsDown(), true);
    t.end();
});
