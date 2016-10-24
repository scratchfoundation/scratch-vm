var test = require('tap').test;
var adapter = require('../../src/engine/adapter');
var events = require('../fixtures/events.json');

test('spec', function (t) {
    t.type(adapter, 'function');
    t.end();
});

test('invalid inputs', function (t) {
    var nothing = adapter('not an object');
    t.type(nothing, 'undefined');
    nothing = adapter({noxmlproperty: true});
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
    t.type(result[0].inputs.DURATION, 'object');
    t.type(result[0].topLevel, 'boolean');
    t.equal(result[0].topLevel, true);

    // Enclosed shadow block
    t.type(result[1].id, 'string');
    t.type(result[1].opcode, 'string');
    t.type(result[1].fields, 'object');
    t.type(result[1].inputs, 'object');
    t.type(result[1].fields.NUM, 'object');
    t.type(result[1].fields.NUM.value, '10');
    t.type(result[1].topLevel, 'boolean');
    t.equal(result[1].topLevel, false);

    t.end();
});

test('create with branch', function (t) {
    var result = adapter(events.createbranch);
    // Outer block
    t.type(result[0].id, 'string');
    t.type(result[0].opcode, 'string');
    t.type(result[0].fields, 'object');
    t.type(result[0].inputs, 'object');
    t.type(result[0].inputs.SUBSTACK, 'object');
    t.type(result[0].topLevel, 'boolean');
    t.equal(result[0].topLevel, true);
    // In branch
    var branchBlockId = result[0].inputs.SUBSTACK.block;
    var branchShadowId = result[0].inputs.SUBSTACK.shadow;
    t.type(branchBlockId, 'string');
    t.equal(branchShadowId, null);
    // Find actual branch block
    var branchBlock = null;
    for (var i = 0; i < result.length; i++) {
        if (result[i].id === branchBlockId) {
            branchBlock = result[i];
        }
    }
    t.type(branchBlock, 'object');
    t.end();
});

test('create with two branches', function (t) {
    var result = adapter(events.createtwobranches);
    // Outer block
    t.type(result[0].id, 'string');
    t.type(result[0].opcode, 'string');
    t.type(result[0].fields, 'object');
    t.type(result[0].inputs, 'object');
    t.type(result[0].inputs.SUBSTACK, 'object');
    t.type(result[0].inputs.SUBSTACK2, 'object');
    t.type(result[0].topLevel, 'boolean');
    t.equal(result[0].topLevel, true);
    // In branchs
    var firstBranchBlockId = result[0].inputs.SUBSTACK.block;
    var secondBranchBlockId = result[0].inputs.SUBSTACK2.block;
    t.type(firstBranchBlockId, 'string');
    t.type(secondBranchBlockId, 'string');
    var firstBranchShadowBlockId = result[0].inputs.SUBSTACK.shadow;
    var secondBranchShadowBlockId = result[0].inputs.SUBSTACK2.shadow;
    t.equal(firstBranchShadowBlockId, null);
    t.equal(secondBranchShadowBlockId, null);
    // Find actual branch blocks
    var firstBranchBlock = null;
    var secondBranchBlock = null;
    for (var i = 0; i < result.length; i++) {
        if (result[i].id === firstBranchBlockId) {
            firstBranchBlock = result[i];
        }
        if (result[i].id === secondBranchBlockId) {
            secondBranchBlock = result[i];
        }
    }
    t.type(firstBranchBlock, 'object');
    t.type(secondBranchBlock, 'object');
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

test('create with obscured shadow', function (t) {
    var result = adapter(events.createobscuredshadow);
    t.ok(Array.isArray(result));
    t.equal(result.length, 4);
    t.end();
});

test('create with invalid block xml', function (t) {
    // Entirely invalid block XML
    var result = adapter(events.createinvalid);
    t.ok(Array.isArray(result));
    t.equal(result.length, 0);

    // Invalid grandchild tag
    var result2 = adapter(events.createinvalidgrandchild);
    t.ok(Array.isArray(result2));
    t.equal(result2.length, 1);
    t.type(result2[0].id, 'string');
    t.equal(Object.keys(result2[0].inputs).length, 0);
    t.equal(Object.keys(result2[0].fields).length, 0);

    t.end();
});

test('create with invalid xml', function (t) {
    var result = adapter(events.createbadxml);
    t.ok(Array.isArray(result));
    t.equal(result.length, 0);
    t.end();
});

test('create with empty field', function (t) {
    var result = adapter(events.createemptyfield);
    t.ok(Array.isArray(result));
    t.equal(result.length, 3);
    t.end();
});
