const test = require('tap').test;
const MockTimer = require('../fixtures/mock-timer');

test('spec', t => {
    const timer = new MockTimer();

    t.type(MockTimer, 'function');
    t.type(timer, 'object');

    // Most members of MockTimer mimic members of Timer.
    t.type(timer.startTime, 'number');
    t.type(timer.time, 'function');
    t.type(timer.start, 'function');
    t.type(timer.timeElapsed, 'function');
    t.type(timer.setTimeout, 'function');
    t.type(timer.clearTimeout, 'function');

    // A few members of MockTimer have no Timer equivalent and should only be used in tests.
    t.type(timer.advanceMockTime, 'function');
    t.type(timer.advanceMockTimeAsync, 'function');
    t.type(timer.hasTimeouts, 'function');

    t.end();
});

test('time', t => {
    const timer = new MockTimer();
    const delta = 1;

    const time1 = timer.time();
    const time2 = timer.time();
    timer.advanceMockTime(delta);
    const time3 = timer.time();

    t.equal(time1, time2);
    t.equal(time2 + delta, time3);
    t.end();
});

test('start / timeElapsed', t => new Promise(resolve => {
    const timer = new MockTimer();
    const halfDelay = 1;
    const fullDelay = halfDelay + halfDelay;

    timer.start();

    let timeoutCalled = 0;

    // Wait and measure timer
    timer.setTimeout(() => {
        t.equal(timeoutCalled, 0);
        ++timeoutCalled;

        const timeElapsed = timer.timeElapsed();
        t.equal(timeElapsed, fullDelay);
        t.end();

        resolve();
    }, fullDelay);

    // this should not trigger the callback
    timer.advanceMockTime(halfDelay);

    // give the mock timer a chance to run tasks
    global.setTimeout(() => {
        // we've only mock-waited for half the delay so it should not have run yet
        t.equal(timeoutCalled, 0);

        // this should trigger the callback
        timer.advanceMockTime(halfDelay);
    }, 0);
}));

test('clearTimeout / hasTimeouts', t => new Promise((resolve, reject) => {
    const timer = new MockTimer();

    const timeoutId = timer.setTimeout(() => {
        reject(new Error('Canceled task ran'));
    }, 1);

    timer.setTimeout(() => {
        resolve('Non-canceled task ran');
        t.end();
    }, 2);

    timer.clearTimeout(timeoutId);

    while (timer.hasTimeouts()) {
        timer.advanceMockTime(1);
    }
}));
