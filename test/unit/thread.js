var test = require('tap').test;
var Thread = require('../../src/engine/thread');

test('spec', function (t) {
    var thread = new Thread('foo');

    t.type(Thread, 'function');
    t.type(thread, 'object');
    t.end();
});
