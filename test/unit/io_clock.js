const test = require('tap').test;
const Clock = require('../../src/io/clock');
const Runtime = require('../../src/engine/runtime');

test('spec', t => {
    const rt = new Runtime();
    const c = new Clock(rt);

    t.type(Clock, 'function');
    t.type(c, 'object');
    t.type(c.projectTimer, 'function');
    t.type(c.pause, 'function');
    t.type(c.resume, 'function');
    t.type(c.resetProjectTimer, 'function');
    t.end();
});

test('cycle', t => {
    const rt = new Runtime();
    const c = new Clock(rt);

    t.ok(c.projectTimer() <= 0.1);
    setTimeout(() => {
        c.resetProjectTimer();
        setTimeout(() => {
            // The timer shouldn't advance until all threads have been stepped
            t.ok(c.projectTimer() === 0);
            c.pause();
            t.ok(c.projectTimer() === 0);
            c.resume();
            t.ok(c.projectTimer() === 0);
            t.end();
        }, 100);
    }, 100);
    rt._step();
    t.ok(c.projectTimer() > 0);
});
