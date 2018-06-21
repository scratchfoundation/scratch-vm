const test = require('tap').test;
const Sequencer = require('../../src/engine/sequencer');
const Runtime = require('../../src/engine/runtime');
const Thread = require('../../src/engine/thread');
const RenderedTarget = require('../../src/sprites/rendered-target');
const Sprite = require('../../src/sprites/sprite');

test('spec', t => {
    t.type(Sequencer, 'function');
    
    const r = new Runtime();
    const s = new Sequencer(r);

    t.type(s, 'object');
    t.ok(s instanceof Sequencer);
    
    t.type(s.stepThreads, 'function');
    t.type(s.stepThread, 'function');
    t.type(s.stepToBranch, 'function');
    t.type(s.stepToProcedure, 'function');
    t.type(s.retireThread, 'function');

    t.end();
});

const randomString = function () {
    const top = Math.random().toString(36);
    return top.substring(7);
};

const generateBlock = function (id) {
    const block = {fields: Object,
        id: id,
        inputs: {},
        STEPS: Object,
        block: 'fakeBlock',
        name: 'fakeName',
        next: null,
        opcode: 'procedures_definition',
        mutation: {proccode: 'fakeCode'},
        parent: null,
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0
    };
    return block;
};

const generateBlockInput = function (id, next, inp) {
    const block = {fields: Object,
        id: id,
        inputs: {SUBSTACK: {block: inp, name: 'SUBSTACK'}},
        STEPS: Object,
        block: 'fakeBlock',
        name: 'fakeName',
        next: next,
        opcode: 'procedures_definition',
        mutation: {proccode: 'fakeCode'},
        parent: null,
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0
    };
    return block;
};

const generateThread = function (runtime) {
    const s = new Sprite();
    const rt = new RenderedTarget(s, runtime);
    const th = new Thread(randomString());
    
    let next = randomString();
    let inp = randomString();
    let name = th.topBlock;
    
    rt.blocks.createBlock(generateBlockInput(name, next, inp));
    th.pushStack(name);
    rt.blocks.createBlock(generateBlock(inp));
    
    for (let i = 0; i < 10; i++) {
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
    th.blockContainer = rt.blocks;

    runtime.threads.push(th);

    return th;
};

test('stepThread', t => {
    const r = new Runtime();
    const s = new Sequencer(r);
    let th = generateThread(r);
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

test('stepToBranch', t => {
    const r = new Runtime();
    const s = new Sequencer(r);
    const th = generateThread(r);
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

test('retireThread', t => {
    const r = new Runtime();
    const s = new Sequencer(r);
    const th = generateThread(r);
    t.strictEquals(th.stack.length, 12);
    s.retireThread(th);
    t.strictEquals(th.stack.length, 0);
    t.strictEquals(th.status, Thread.STATUS_DONE);
    
    t.end();
});

test('stepToProcedure', t => {
    const r = new Runtime();
    const s = new Sequencer(r);
    const th = generateThread(r);
    let expectedBlock = th.peekStack();
    s.stepToProcedure(th, '');
    t.strictEquals(th.peekStack(), expectedBlock);
    s.stepToProcedure(th, 'faceCode');
    t.strictEquals(th.peekStack(), expectedBlock);

    th.target.blocks.createBlock({
        id: 'internalId',
        opcode: 'procedures_prototype',
        mutation: {
            proccode: 'othercode'
        }
    });
    expectedBlock = th.stack[th.stack.length - 4];
    th.target.blocks.getBlock(expectedBlock).inputs.custom_block = {
        type: 'custom_block',
        block: 'internalId'
    };
    s.stepToProcedure(th, 'othercode');
    t.strictEquals(th.peekStack(), expectedBlock);
    
    
    t.end();
});

test('stepThreads', t => {
    const r = new Runtime();
    r.currentStepTime = Infinity;
    const s = new Sequencer(r);
    t.strictEquals(s.stepThreads().length, 0);
    generateThread(r);
    t.strictEquals(r.threads.length, 1);
    t.strictEquals(s.stepThreads().length, 0);
    r.threads[0].status = Thread.STATUS_RUNNING;
    t.strictEquals(s.stepThreads().length, 1);
    
    t.end();
});
