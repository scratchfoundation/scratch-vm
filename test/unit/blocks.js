var test = require('tap').test;
var Blocks = require('../../src/engine/blocks');

test('spec', function (t) {
    var b = new Blocks();

    t.type(Blocks, 'function');
    t.type(b, 'object');
    t.ok(b instanceof Blocks);

    t.type(b._blocks, 'object');
    t.type(b._stacks, 'object');
    t.ok(Array.isArray(b._stacks));

    t.type(b.createBlock, 'function');
    t.type(b.moveBlock, 'function');
    t.type(b.changeBlock, 'function');
    t.type(b.deleteBlock, 'function');

    t.end();
});

test('create', function (t) {
    var b = new Blocks();
    b.createBlock({
        id: 'foo',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {},
        topLevel: true
    });

    t.type(b._blocks['foo'], 'object');
    t.equal(b._blocks['foo'].opcode, 'TEST_BLOCK');
    t.notEqual(b._stacks.indexOf('foo'), -1);
    t.end();
});

test('move', function (t) {
    var b = new Blocks();
    b.createBlock({
        id: 'foo',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {},
        topLevel: true
    });
    b.createBlock({
        id: 'bar',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {},
        topLevel: true
    });

    // Attach 'bar' to the end of 'foo'
    b.moveBlock({
        id: 'bar',
        newParent: 'foo'
    });
    t.equal(b._stacks.length, 1);
    t.equal(Object.keys(b._blocks).length, 2);
    t.equal(b._blocks['foo'].next, 'bar');

    // Detach 'bar' from 'foo'
    b.moveBlock({
        id: 'bar',
        oldParent: 'foo'
    });
    t.equal(b._stacks.length, 2);
    t.equal(Object.keys(b._blocks).length, 2);
    t.equal(b._blocks['foo'].next, null);

    t.end();
});

test('delete', function (t) {
    var b = new Blocks();
    b.createBlock({
        id: 'foo',
        opcode: 'TEST_BLOCK',
        next: null,
        fields: {},
        inputs: {},
        topLevel: true
    });
    b.deleteBlock({
        id: 'foo'
    });

    t.type(b._blocks['foo'], 'undefined');
    t.equal(b._stacks.indexOf('foo'), -1);
    t.end();
});
