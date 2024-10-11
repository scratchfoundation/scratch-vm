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
    t.type(s.stepToBranch, 'function');
    t.type(s.stepToProcedure, 'function');

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
    const s = new Sprite(null, runtime);
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

test('stepToBranch', t => {
    const r = new Runtime();
    const s = new Sequencer(r);
    const th = generateThread(r);

    // Push substack 2 (null).
    s.stepToBranch(th, 2, false);
    t.strictEquals(th.peekStack(), null);
    th.popStack();
    t.strictEquals(th.peekStackFrame().isLoop, false);
    // Push substack 1 (null).
    s.stepToBranch(th, 1, false);
    t.strictEquals(th.peekStack(), null);
    th.popStack();
    t.strictEquals(th.peekStackFrame().isLoop, false);
    // Push loop substack (null).
    s.stepToBranch(th, 1, true);
    t.strictEquals(th.peekStack(), null);
    th.popStack();
    t.strictEquals(th.peekStackFrame().isLoop, true);
    // isLoop resets when thread goes to next block.
    th.goToNextBlock();
    t.strictEquals(th.peekStackFrame().isLoop, false);
    th.popStack();
    // Push substack (not null).
    s.stepToBranch(th, 'sub', false);
    t.notEquals(th.peekStack(), null);
    th.popStack();
    t.strictEquals(th.peekStackFrame().isLoop, false);
    // Push loop substack (not null).
    s.stepToBranch(th, 'sub', true);
    t.notEquals(th.peekStack(), null);
    th.popStack();
    t.strictEquals(th.peekStackFrame().isLoop, true);
    // isLoop resets when thread goes to next block.
    th.goToNextBlock();
    t.strictEquals(th.peekStackFrame().isLoop, false);

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
    // Threads should be marked DONE and removed in the same step they finish.
    t.strictEquals(s.stepThreads().length, 1);

    t.end();
});
