const test = require('tap').test;
const MouseWheel = require('../../src/io/mouseWheel');
const Runtime = require('../../src/engine/runtime');

test('spec', t => {
    const rt = new Runtime();
    const mw = new MouseWheel(rt);

    t.type(mw, 'object');
    t.type(mw.postData, 'function');
    t.end();
});

test('blocks activated by scrolling', t => {
    let _startHatsArgs;
    const rt = {
        startHats: (...args) => {
            _startHatsArgs = args;
        }
    };
    const mw = new MouseWheel(rt);

    _startHatsArgs = null;
    mw.postData({
        deltaY: -1
    });
    t.strictEquals(_startHatsArgs[0], 'event_whenkeypressed');
    t.strictEquals(_startHatsArgs[1].KEY_OPTION, 'up arrow');

    _startHatsArgs = null;
    mw.postData({
        deltaY: +1
    });
    t.strictEquals(_startHatsArgs[0], 'event_whenkeypressed');
    t.strictEquals(_startHatsArgs[1].KEY_OPTION, 'down arrow');

    _startHatsArgs = null;
    mw.postData({
        deltaY: 0
    });
    t.strictEquals(_startHatsArgs, null);

    t.end();
});
