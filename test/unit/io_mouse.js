const test = require('tap').test;
const Mouse = require('../../src/io/mouse');
const Runtime = require('../../src/engine/runtime');

test('spec', t => {
    const rt = new Runtime();
    const m = new Mouse(rt);

    t.type(m, 'object');
    t.type(m.postData, 'function');
    t.type(m.getClientX, 'function');
    t.type(m.getClientY, 'function');
    t.type(m.getScratchX, 'function');
    t.type(m.getScratchY, 'function');
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
    t.strictEquals(m.getClientX(), -20);
    t.strictEquals(m.getClientY(), 10);
    t.strictEquals(m.getScratchX(), -240);
    t.strictEquals(m.getScratchY(), 170);
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
    t.strictEquals(m.getClientX(), 10);
    t.strictEquals(m.getClientY(), 400);
    t.strictEquals(m.getScratchX(), -230);
    t.strictEquals(m.getScratchY(), -180);
    t.strictEquals(m.getIsDown(), true);
    t.end();
});

test('at zoomed scale', t => {
    const rt = new Runtime();
    const m = new Mouse(rt);

    m.postData({
        x: 240,
        y: 540,
        canvasWidth: 960,
        canvasHeight: 720
    });
    t.strictEquals(m.getClientX(), 240);
    t.strictEquals(m.getClientY(), 540);
    t.strictEquals(m.getScratchX(), -120);
    t.strictEquals(m.getScratchY(), -90);
    t.end();
});
