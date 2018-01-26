const test = require('tap').test;
const adapter = require('../../src/engine/adapter');
const events = require('../fixtures/events.json');

test('spec', t => {
    t.type(adapter, 'function');
    t.end();
});

test('invalid inputs', t => {
    let nothing = adapter('not an object');
    t.type(nothing, 'undefined');
    nothing = adapter({noxmlproperty: true});
    t.type(nothing, 'undefined');
    t.end();
});

test('create event', t => {
    const result = adapter(events.create);

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

test('create with branch', t => {
    const result = adapter(events.createbranch);
    // Outer block
    t.type(result[0].id, 'string');
    t.type(result[0].opcode, 'string');
    t.type(result[0].fields, 'object');
    t.type(result[0].inputs, 'object');
    t.type(result[0].inputs.SUBSTACK, 'object');
    t.type(result[0].topLevel, 'boolean');
    t.equal(result[0].topLevel, true);
    // In branch
    const branchBlockId = result[0].inputs.SUBSTACK.block;
    const branchShadowId = result[0].inputs.SUBSTACK.shadow;
    t.type(branchBlockId, 'string');
    t.equal(branchShadowId, null);
    // Find actual branch block
    let branchBlock = null;
    for (let i = 0; i < result.length; i++) {
        if (result[i].id === branchBlockId) {
            branchBlock = result[i];
        }
    }
    t.type(branchBlock, 'object');
    t.end();
});

test('create with two branches', t => {
    const result = adapter(events.createtwobranches);
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
    const firstBranchBlockId = result[0].inputs.SUBSTACK.block;
    const secondBranchBlockId = result[0].inputs.SUBSTACK2.block;
    t.type(firstBranchBlockId, 'string');
    t.type(secondBranchBlockId, 'string');
    const firstBranchShadowBlockId = result[0].inputs.SUBSTACK.shadow;
    const secondBranchShadowBlockId = result[0].inputs.SUBSTACK2.shadow;
    t.equal(firstBranchShadowBlockId, null);
    t.equal(secondBranchShadowBlockId, null);
    // Find actual branch blocks
    let firstBranchBlock = null;
    let secondBranchBlock = null;
    for (let i = 0; i < result.length; i++) {
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

test('create with top-level shadow', t => {
    const result = adapter(events.createtoplevelshadow);
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

test('create with next connection', t => {
    const result = adapter(events.createwithnext);

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

test('create with obscured shadow', t => {
    const result = adapter(events.createobscuredshadow);
    t.ok(Array.isArray(result));
    t.equal(result.length, 4);
    t.end();
});

test('create variable with entity in name', t => {
    const result = adapter(events.createvariablewithentity);

    t.ok(Array.isArray(result));
    t.equal(result.length, 1);

    t.type(result[0].id, 'string');
    t.type(result[0].opcode, 'string');
    t.type(result[0].fields, 'object');
    t.type(result[0].fields.VARIABLE, 'object');
    t.type(result[0].fields.VARIABLE.value, 'string');
    t.equal(result[0].fields.VARIABLE.value, 'this & that');
    t.type(result[0].inputs, 'object');
    t.type(result[0].topLevel, 'boolean');
    t.equal(result[0].topLevel, true);
    t.end();
});

test('create with invalid block xml', t => {
    // Entirely invalid block XML
    const result = adapter(events.createinvalid);
    t.ok(Array.isArray(result));
    t.equal(result.length, 0);

    // Invalid grandchild tag
    const result2 = adapter(events.createinvalidgrandchild);
    t.ok(Array.isArray(result2));
    t.equal(result2.length, 1);
    t.type(result2[0].id, 'string');
    t.equal(Object.keys(result2[0].inputs).length, 0);
    t.equal(Object.keys(result2[0].fields).length, 0);

    t.end();
});

test('create with invalid xml', t => {
    const result = adapter(events.createbadxml);
    t.ok(Array.isArray(result));
    t.equal(result.length, 0);
    t.end();
});

test('create with empty field', t => {
    const result = adapter(events.createemptyfield);
    t.ok(Array.isArray(result));
    t.equal(result.length, 3);
    t.end();
});
