var test = require('tap').test;
var Clock = require('../../src/io/clock');
var Runtime = require('../../src/engine/runtime');

test('spec', function (t) {
    var rt = new Runtime();
    var c = new Clock(rt);

    t.type(Clock, 'function');
    t.type(c, 'object');
    t.type(c.projectTimer, 'function');
    t.type(c.pause, 'function');
    t.type(c.resume, 'function');
    t.type(c.resetProjectTimer, 'function');
    t.end();
});

test('cycle', function (t) {
    var rt = new Runtime();
    var c = new Clock(rt);

    t.ok(c.projectTimer() <= 0.1);
    setTimeout(function () {
        c.resetProjectTimer();
        setTimeout(function () {
            t.ok(c.projectTimer() > 0);
            c.pause();
            t.ok(c.projectTimer() > 0);
            c.resume();
            t.ok(c.projectTimer() > 0);
            t.end();
        }, 100);
    }, 100);
});
