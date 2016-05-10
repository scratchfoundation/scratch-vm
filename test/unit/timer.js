var test = require('tap').test;
var Timer = require('../../src/util/timer');

test('spec', function (t) {
    var timer = new Timer();

    t.type(Timer, 'function');
    t.type(timer, 'object');

    t.type(timer.startTime, 'number');
    t.type(timer.time, 'function');
    t.type(timer.start, 'function');
    t.type(timer.timeElapsed, 'function');

    t.end();
});

test('time', function (t) {
    var timer = new Timer();
    var time = timer.time();

    t.ok(Date.now() >= time);
    t.end();
});

test('start / timeElapsed', function (t) {
    var timer = new Timer();
    var delay = 100;
    var threshold = 1000 / 60;  // 60 hz

    // Start timer
    timer.start();

    // Wait and measure timer
    setTimeout(function () {
        var timeElapsed = timer.timeElapsed();
        t.ok(timeElapsed >= 0);
        t.ok(timeElapsed >= (delay - threshold) &&
             timeElapsed <= (delay + threshold));
        t.end();
    }, delay);
});
