var test = require('tap').test;
var Runtime = require('../../src/engine/runtime');

test('spec', function (t) {
    var r = new Runtime();

    t.type(Runtime, 'function');
    t.type(r, 'object');
    t.ok(r instanceof Runtime);

    t.end();
});
