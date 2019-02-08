const test = require('tap').test;
const MockTimer = require('../fixtures/mock-timer');

test('spec', t => {
    const timer = new MockTimer();

    t.type(MockTimer, 'function');
    t.type(timer, 'object');

    t.type(timer.startTime, 'number');
    t.type(timer.time, 'function');
    t.type(timer.start, 'function');
    t.type(timer.timeElapsed, 'function');

    t.end();
});

test('time', t => {
    const timer = new MockTimer();

    const time1 = timer.time();
    const time2 = timer.time();
    timer.advanceMockTime(1);
    const time3 = timer.time();

    t.ok(time1 === time2);
    t.ok(time2 < time3);
    t.end();
});

test('start / timeElapsed', t => {
    const timer = new MockTimer();
    const halfDelay = 50;
    const fullDelay = halfDelay + halfDelay;

    timer.start();

    let timeoutCalled = 0;

    // Wait and measure timer
    timer.setTimeout(() => {
        t.ok(timeoutCalled === 0);
        ++timeoutCalled;

        const timeElapsed = timer.timeElapsed();
        t.ok(timeElapsed === fullDelay);

        t.end();
    }, fullDelay);

    // this should not call the callback
    timer.advanceMockTime(halfDelay);

    t.ok(timeoutCalled === 0);

    // this should call the callback
    timer.advanceMockTime(halfDelay);
});
