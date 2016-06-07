var test = require('tap').test;
var adapter = require('../../src/engine/adapter');
var events = require('../fixtures/events.json');

test('spec', function (t) {
    t.type(adapter, 'function');
    t.end();
});

test('invalid inputs', function(t) {
    var nothing = adapter('not an object');
    t.type(nothing, 'undefined');
    nothing = adapter({noxmlproperty:true});
    t.type(nothing, 'undefined');
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

test('create with substack', function (t) {
    var result = adapter(events.createsubstack);
    // Outer block
    t.type(result[0].id, 'string');
    t.type(result[0].opcode, 'string');
    t.type(result[0].fields, 'object');
    t.type(result[0].inputs, 'object');
    t.type(result[0].inputs['SUBSTACK'], 'object');
    t.type(result[0].topLevel, 'boolean');
    t.equal(result[0].topLevel, true);
    // In substack
    var substackBlockId = result[0].inputs['SUBSTACK']['block'];
    t.type(substackBlockId, 'string');
    // Find actual substack block
    var substackBlock = null;
    for (var i = 0; i < result.length; i++) {
        if (result[i].id == substackBlockId) {
            substackBlock = result[i];
        }
    }
    t.type(substackBlock, 'object');
    t.end();
});

test('create with two substacks', function (t) {
    var result = adapter(events.createtwosubstacks);
    // Outer block
    t.type(result[0].id, 'string');
    t.type(result[0].opcode, 'string');
    t.type(result[0].fields, 'object');
    t.type(result[0].inputs, 'object');
    t.type(result[0].inputs['SUBSTACK'], 'object');
    t.type(result[0].inputs['SUBSTACK2'], 'object');
    t.type(result[0].topLevel, 'boolean');
    t.equal(result[0].topLevel, true);
    // In substacks
    var firstSubstackBlockId = result[0].inputs['SUBSTACK']['block'];
    var secondSubstackBlockId = result[0].inputs['SUBSTACK2']['block'];
    t.type(firstSubstackBlockId, 'string');
    t.type(secondSubstackBlockId, 'string');
    // Find actual substack blocks
    var firstSubstackBlock = null;
    var secondSubstackBlock = null;
    for (var i = 0; i < result.length; i++) {
        if (result[i].id == firstSubstackBlockId) {
            firstSubstackBlock = result[i];
        }
        if (result[i].id == secondSubstackBlockId) {
            secondSubstackBlock = result[i];
        }
    }
    t.type(firstSubstackBlock, 'object');
    t.type(secondSubstackBlock, 'object');
    t.end();
});

test('create with top-level shadow', function (t) {
    var result = adapter(events.createtoplevelshadow);
    t.ok(Array.isArray(result));
    t.equal(result.length, 1);

    // Outer block
    t.type(result[0].id, 'string');
    t.type(result[0].opcode, 'string');
    t.type(result[0].fields, 'object');
    t.type(result[0].inputs, 'object');
    t.type(result[0].topLevel, 'boolean');
    t.equal(result[0].topLevel, true);
    t.end();
});

test('create with next connection', function (t) {
    var result = adapter(events.createwithnext);

    t.ok(Array.isArray(result));
    t.equal(result.length, 2);

    // First block
    t.type(result[0].id, 'string');
    t.type(result[0].opcode, 'string');
    t.type(result[0].fields, 'object');
    t.type(result[0].inputs, 'object');
    t.type(result[0].topLevel, 'boolean');
    t.equal(result[0].topLevel, true);
    t.type(result[0].next, 'string');
    t.equal(result[0].next, result[1].id);

    // Second block
    t.type(result[1].id, 'string');
    t.type(result[1].opcode, 'string');
    t.type(result[1].fields, 'object');
    t.type(result[1].inputs, 'object');
    t.type(result[1].topLevel, 'boolean');
    t.equal(result[1].topLevel, false);
    t.equal(result[1].next, null);

    t.end();
});
