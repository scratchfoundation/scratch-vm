var test = require('tap').test;
var adapter = require('../../src/engine/adapter');
var events = require('../fixtures/events.json');

test('spec', function (t) {
    t.type(adapter, 'function');
    t.end();
});

test('create event', function (t) {
    var result = adapter(events.create);

    t.type(result, 'object');
    t.type(result.id, 'string');
    t.type(result.opcode, 'string');
    t.type(result.fields, 'object');
    t.type(result.fields['DURATION'], 'object');

    t.end();
});
