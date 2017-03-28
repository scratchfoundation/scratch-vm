var test = require('tap').test;
var Sequencer = require('../../src/engine/sequencer');
var Runtime = require('../../src/engine/runtime');
var Thread = require('../../src/engine/thread');
var RenderedTarget = require('../../src/sprites/rendered-target');
var Sprite = require('../../src/sprites/sprite');

test('spec', function (t) {
    t.type(Sequencer, 'function');
    
    var r = new Runtime();
    var s = new Sequencer(r);

    t.type(s, 'object');
    t.ok(s instanceof Sequencer);
    
    t.type(s.stepThreads, 'function');
    t.type(s.stepThread, 'function');
    t.type(s.stepToBranch, 'function');
    t.type(s.stepToProcedure, 'function');
    t.type(s.retireThread, 'function');

    t.end();
});

var randomString = function () {
    var top = Math.random().toString(36);
    return top.substring(7);
};

var generateBlock = function (id) {
    var block = {fields: Object,
        id: id,
        inputs: {},
        STEPS: Object,
        block: 'fakeBlock',
        name: 'fakeName',
        next: null,
        opcode: 'procedures_defnoreturn',
        mutation: {proccode: 'fakeCode'},
        parent: null,
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0
    };
    return block;
};

var generateBlockInput = function (id, next, inp) {
    var block = {fields: Object,
        id: id,
        inputs: {SUBSTACK: {block: inp, name: 'SUBSTACK'}},
        STEPS: Object,
        block: 'fakeBlock',
        name: 'fakeName',
        next: next,
        opcode: 'procedures_defnoreturn',
        mutation: {proccode: 'fakeCode'},
        parent: null,
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0
    };
    return block;
};

var generateThread = function (runtime) {
    var s = new Sprite();
    var rt = new RenderedTarget(s, runtime);
    var th = new Thread(randomString());
    
    var next = randomString();
    var inp = randomString();
    var name = th.topBlock;
    
    rt.blocks.createBlock(generateBlockInput(name, next, inp));
    th.pushStack(name);
    rt.blocks.createBlock(generateBlock(inp));
    
    for (var i = 0; i < 10; i++) {
        name = next;
        next = randomString();
        inp = randomString();
        
        rt.blocks.createBlock(generateBlockInput(name, next, inp));
        th.pushStack(name);
        rt.blocks.createBlock(generateBlock(inp));
    }
    rt.blocks.createBlock(generateBlock(next));
    th.pushStack(next);
    th.target = rt;
    
    runtime.threads.push(th);

    return th;
};

test('stepThread', function (t) {
    var r = new Runtime();
    var s = new Sequencer(r);
    var th = generateThread(r);
    t.notEquals(th.status, Thread.STATUS_DONE);
    s.stepThread(th);
    t.strictEquals(th.status, Thread.STATUS_DONE);
    th = generateThread(r);
    th.status = Thread.STATUS_YIELD;
    s.stepThread(th);
    t.notEquals(th.status, Thread.STATUS_DONE);
    th.status = Thread.STATUS_PROMISE_WAIT;
    s.stepThread(th);
    t.notEquals(th.status, Thread.STATUS_DONE);
    
    t.end();
});

test('stepToBranch', function (t) {
    var r = new Runtime();
    var s = new Sequencer(r);
    var th = generateThread(r);
    s.stepToBranch(th, 2, false);
    t.strictEquals(th.peekStack(), null);
    th.popStack();
    s.stepToBranch(th, 1, false);
    t.strictEquals(th.peekStack(), null);
    th.popStack();
    th.popStack();
    s.stepToBranch(th, 1, false);
    t.notEquals(th.peekStack(), null);
    
    t.end();
});

test('retireThread', function (t) {
    var r = new Runtime();
    var s = new Sequencer(r);
    var th = generateThread(r);
    t.strictEquals(th.stack.length, 12);
    s.retireThread(th);
    t.strictEquals(th.stack.length, 0);
    t.strictEquals(th.status, Thread.STATUS_DONE);
    
    t.end();
});

test('stepToProcedure', function (t) {
    var r = new Runtime();
    var s = new Sequencer(r);
    var th = generateThread(r);
    var expectedBlock = th.peekStack();
    s.stepToProcedure(th, '');
    t.strictEquals(th.peekStack(), expectedBlock);
    s.stepToProcedure(th, 'faceCode');
    t.strictEquals(th.peekStack(), expectedBlock);
    s.stepToProcedure(th, 'faceCode');
    th.target.blocks.getBlock(th.stack[th.stack.length - 4]).mutation.proccode = 'othercode';
    expectedBlock = th.stack[th.stack.length - 4];
    s.stepToProcedure(th, 'othercode');
    t.strictEquals(th.peekStack(), expectedBlock);
    
    
    t.end();
});

test('stepThreads', function (t) {
    var r = new Runtime();
    r.currentStepTime = Infinity;
    var s = new Sequencer(r);
    t.strictEquals(s.stepThreads().length, 0);
    generateThread(r);
    t.strictEquals(r.threads.length, 1);
    t.strictEquals(s.stepThreads().length, 0);
    r.threads[0].status = Thread.STATUS_RUNNING;
    t.strictEquals(s.stepThreads().length, 1);
    
    t.end();
});
