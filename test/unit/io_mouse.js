const test = require('tap').test;
const Mouse = require('../../src/io/mouse');
const Runtime = require('../../src/engine/runtime');

test('spec', t => {
    const rt = new Runtime();
    const m = new Mouse(rt);

    t.type(m, 'object');
    t.type(m.postData, 'function');
    t.type(m.getX, 'function');
    t.type(m.getY, 'function');
    t.type(m.getClampedX, 'function');
    t.type(m.getClampedY, 'function');
    t.type(m.getIsDown, 'function');
    t.end();
});

test('mouseUp', t => {
    const rt = new Runtime();
    const m = new Mouse(rt);

    m.postData({
        x: -20,
        y: 10,
        isDown: false,
        canvasWidth: 480,
        canvasHeight: 360
    });
    t.strictEquals(m.getX(), -260);
    t.strictEquals(m.getY(), 170);
    t.strictEquals(m.getClampedX(), -240);
    t.strictEquals(m.getClampedY(), 170);
    t.strictEquals(m.getIsDown(), false);
    t.end();
});

test('mouseDown', t => {
    const rt = new Runtime();
    const m = new Mouse(rt);

    m.postData({
        x: 10,
        y: 400,
        isDown: true,
        canvasWidth: 480,
        canvasHeight: 360
    });
    t.strictEquals(m.getX(), -230);
    t.strictEquals(m.getY(), -220);
    t.strictEquals(m.getClampedX(), -230);
    t.strictEquals(m.getClampedY(), -180);
    t.strictEquals(m.getIsDown(), true);
    t.end();
});
