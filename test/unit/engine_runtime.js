const test = require('tap').test;
const Runtime = require('../../src/engine/runtime');

test('spec', t => {
    const r = new Runtime();

    t.type(Runtime, 'function');
    t.type(r, 'object');
    t.ok(r instanceof Runtime);

    t.end();
});
