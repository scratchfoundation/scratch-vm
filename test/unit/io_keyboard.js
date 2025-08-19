const test = require('tap').test;
const Keyboard = require('../../src/io/keyboard');
const Runtime = require('../../src/engine/runtime');

/**
 * Return a "live" object which tracks events that have been emitted. When an
 * event is emitted, the event object is pushed onto the corresponding array.
 * Use t.same() to match these (it strictly compares the array against the
 * expected value, including the length, i.e. number of tims emitted).
 *
 * Note that KEY_ANY_PRESSED doesn't emit any event details and so its array
 * should only contain `undefined`.
 *
 * @param {Runtime} rt - the runtime to listen for events on
 * @returns {object} live mapping of event name to emitted event values
 */
const listenForKeyboardEvents = function (rt) {
    const eventsEmitted = {
        KEY_PRESSED: [],
        KEY_ANY_PRESSED: []
    };

    rt.on('KEY_PRESSED', event => {
        eventsEmitted.KEY_PRESSED.push(event);
    });

    // Note that KEY_ANY_PRESSED doesn't emit any event details and so
    // the event value should be `undefined`.
    rt.on('KEY_ANY_PRESSED', event => {
        eventsEmitted.KEY_ANY_PRESSED.push(event);
    });

    return eventsEmitted;
};

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
    const eventsEmitted = listenForKeyboardEvents(rt);

    k.postData({
        key: ' ',
        isDown: true
    });

    t.strictDeepEquals(k._keysPressed, ['space']);

    t.strictEquals(k.getKeyIsDown('space'), true);
    t.strictEquals(k.getKeyIsDown('any'), true);

    t.same(eventsEmitted.KEY_PRESSED, ['space']);
    t.same(eventsEmitted.KEY_ANY_PRESSED, [undefined]);

    t.end();
});

test('letter key', t => {
    const rt = new Runtime();
    const k = new Keyboard(rt);
    const eventsEmitted = listenForKeyboardEvents(rt);

    k.postData({
        key: 'a',
        isDown: true
    });

    t.strictDeepEquals(k._keysPressed, ['A']);

    t.strictEquals(k.getKeyIsDown(65), true);
    t.strictEquals(k.getKeyIsDown('a'), true);
    t.strictEquals(k.getKeyIsDown('A'), true);
    t.strictEquals(k.getKeyIsDown('any'), true);

    t.same(eventsEmitted.KEY_PRESSED, ['A']);
    t.same(eventsEmitted.KEY_ANY_PRESSED, [undefined]);

    t.end();
});

test('number key', t => {
    const rt = new Runtime();
    const k = new Keyboard(rt);
    const eventsEmitted = listenForKeyboardEvents(rt);

    k.postData({
        key: '1',
        isDown: true
    });

    t.strictDeepEquals(k._keysPressed, ['1']);

    t.strictEquals(k.getKeyIsDown(49), true);
    t.strictEquals(k.getKeyIsDown('1'), true);
    t.strictEquals(k.getKeyIsDown('any'), true);

    t.same(eventsEmitted.KEY_PRESSED, ['1']);
    t.same(eventsEmitted.KEY_ANY_PRESSED, [undefined]);

    t.end();
});

test('non-english key', t => {
    const rt = new Runtime();
    const k = new Keyboard(rt);
    const eventsEmitted = listenForKeyboardEvents(rt);

    k.postData({
        key: '日',
        isDown: true
    });

    t.strictDeepEquals(k._keysPressed, ['日']);

    t.strictEquals(k.getKeyIsDown('日'), true);
    t.strictEquals(k.getKeyIsDown('any'), true);

    t.same(eventsEmitted.KEY_PRESSED, ['日']);
    t.same(eventsEmitted.KEY_ANY_PRESSED, [undefined]);

    t.end();
});

test('shift key', t => {
    const rt = new Runtime();
    const k = new Keyboard(rt);
    const eventsEmitted = listenForKeyboardEvents(rt);

    k.postData({
        key: 'Shift',
        isDown: true
    });

    t.strictDeepEquals(k._keysPressed, ['shift']);

    t.strictEquals(k.getKeyIsDown('shift'), true);
    t.strictEquals(k.getKeyIsDown('any'), false);

    t.same(eventsEmitted.KEY_PRESSED, ['shift']);
    t.same(eventsEmitted.KEY_ANY_PRESSED, []);

    t.end();
});

test('ignore control key', t => {
    const rt = new Runtime();
    const k = new Keyboard(rt);
    const eventsEmitted = listenForKeyboardEvents(rt);

    k.postData({
        key: 'Control',
        isDown: true
    });

    t.strictDeepEquals(k._keysPressed, []);

    t.strictEquals(k.getKeyIsDown('control'), false);
    t.strictEquals(k.getKeyIsDown('any'), false);

    t.same(eventsEmitted.KEY_PRESSED, []);
    t.same(eventsEmitted.KEY_ANY_PRESSED, []);

    t.end();
});

test('keyup', t => {
    const rt = new Runtime();
    const k = new Keyboard(rt);
    const eventsEmitted = listenForKeyboardEvents(rt);

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

    t.same(eventsEmitted.KEY_PRESSED, ['left arrow']);
    t.same(eventsEmitted.KEY_ANY_PRESSED, [undefined]);

    t.end();
});
