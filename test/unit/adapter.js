var test = require('tap').test;
var adapter = require('../../src/engine/adapter');
var events = require('../fixtures/events.json');

test('spec', function (t) {
    t.type(adapter, 'function');
    t.end();
});

test('create event', function (t) {
    var result = adapter(events.create);

    t.ok(Array.isArray(result));
    t.equal(result.length, 2);

    // Outer block
    t.type(result[0].id, 'string');
    t.type(result[0].opcode, 'string');
    t.type(result[0].fields, 'object');
    t.type(result[0].inputs, 'object');
    t.type(result[0].inputs['DURATION'], 'object');
    t.type(result[0].topLevel, 'boolean');
    t.equal(result[0].topLevel, true);

    // Enclosed shadow block
    t.type(result[1].id, 'string');
    t.type(result[1].opcode, 'string');
    t.type(result[1].fields, 'object');
    t.type(result[1].inputs, 'object');
    t.type(result[1].fields['NUM'], 'object');
    t.type(result[1].fields['NUM'].value, '10');
    t.type(result[1].topLevel, 'boolean');
    t.equal(result[1].topLevel, false);

    t.end();
});
