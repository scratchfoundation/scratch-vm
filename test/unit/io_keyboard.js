const test = require('tap').test;
const Keyboard = require('../../src/io/keyboard');
const Runtime = require('../../src/engine/runtime');

test('spec', t => {
    const rt = new Runtime();
    const k = new Keyboard(rt);

    t.type(k, 'object');
    t.type(k.postData, 'function');
    t.type(k.getKeyIsDown, 'function');
    t.end();
});

test('space key', t => {
    const rt = new Runtime();
    const k = new Keyboard(rt);

    k.postData({
        key: ' ',
        isDown: true
    });
    t.strictDeepEquals(k._keysPressed, ['space']);
    t.strictEquals(k.getKeyIsDown('space'), true);
    t.strictEquals(k.getKeyIsDown('any'), true);
    t.end();
});

test('letter key', t => {
    const rt = new Runtime();
    const k = new Keyboard(rt);

    k.postData({
        key: 'a',
        isDown: true
    });
    t.strictDeepEquals(k._keysPressed, ['A']);
    t.strictEquals(k.getKeyIsDown(65), true);
    t.strictEquals(k.getKeyIsDown('a'), true);
    t.strictEquals(k.getKeyIsDown('A'), true);
    t.strictEquals(k.getKeyIsDown('any'), true);
    t.end();
});

test('number key', t => {
    const rt = new Runtime();
    const k = new Keyboard(rt);

    k.postData({
        key: '1',
        isDown: true
    });
    t.strictDeepEquals(k._keysPressed, ['1']);
    t.strictEquals(k.getKeyIsDown(49), true);
    t.strictEquals(k.getKeyIsDown('1'), true);
    t.strictEquals(k.getKeyIsDown('any'), true);
    t.end();
});

test('non-english key', t => {
    const rt = new Runtime();
    const k = new Keyboard(rt);

    k.postData({
        key: '日',
        isDown: true
    });
    t.strictDeepEquals(k._keysPressed, ['日']);
    t.strictEquals(k.getKeyIsDown('日'), true);
    t.strictEquals(k.getKeyIsDown('any'), true);
    t.end();
});

test('ignore modifier key', t => {
    const rt = new Runtime();
    const k = new Keyboard(rt);

    k.postData({
        key: 'Shift',
        isDown: true
    });
    t.strictDeepEquals(k._keysPressed, []);
    t.strictEquals(k.getKeyIsDown('any'), false);
    t.end();
});

test('keyup', t => {
    const rt = new Runtime();
    const k = new Keyboard(rt);

    k.postData({
        key: 'ArrowLeft',
        isDown: true
    });
    k.postData({
        key: 'ArrowLeft',
        isDown: false
    });
    t.strictDeepEquals(k._keysPressed, []);
    t.strictEquals(k.getKeyIsDown('left arrow'), false);
    t.strictEquals(k.getKeyIsDown('any'), false);
    t.end();
});
