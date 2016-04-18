var test = require('tap').test;
var Runtime = require('../../src/engine/runtime');

test('spec', function (t) {
    var r = new Runtime();

    t.type(Runtime, 'function');
    t.type(r, 'object');
    t.ok(r instanceof Runtime);

    t.type(r.blocks, 'object');
    t.type(r.stacks, 'object');
    t.ok(Array.isArray(r.stacks));

    t.type(r.createBlock, 'function');
    t.type(r.moveBlock, 'function');
    t.type(r.changeBlock, 'function');
    t.type(r.deleteBlock, 'function');

    t.end();
});

test('create', function (t) {
    var r = new Runtime();
    r.createBlock({
        id: 'foo',
        opcode: 'TEST_BLOCK'
    });

    t.type(r.blocks['foo'], 'object');
    t.equal(r.blocks['foo'].opcode, 'TEST_BLOCK');
    t.notEqual(r.stacks.indexOf('foo'), -1);
    t.end();
});

test('move', function (t) {
    var r = new Runtime();
    r.createBlock({
        id: 'foo',
        opcode: 'TEST_BLOCK'
    });
    r.createBlock({
        id: 'bar',
        opcode: 'TEST_BLOCK'
    });

    // Attach 'bar' to the end of 'foo'
    r.moveBlock({
        id: 'bar',
        newParent: 'foo'
    });
    t.equal(r.stacks.length, 1);
    t.equal(Object.keys(r.blocks).length, 2);
    t.equal(r.blocks['foo'].next, 'bar');

    // Detach 'bar' from 'foo'
    r.moveBlock({
        id: 'bar',
        oldParent: 'foo'
    });
    t.equal(r.stacks.length, 2);
    t.equal(Object.keys(r.blocks).length, 2);
    t.equal(r.blocks['foo'].next, null);

    t.end();
});

test('delete', function (t) {
    var r = new Runtime();
    r.createBlock({
        id: 'foo',
        opcode: 'TEST_BLOCK'
    });
    r.deleteBlock({
        id: 'foo'
    });

    t.type(r.blocks['foo'], 'undefined');
    t.equal(r.stacks.indexOf('foo'), -1);
    t.end();
});
