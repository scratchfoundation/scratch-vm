const test = require('tap').test;
const Thread = require('../../src/engine/thread');
const RenderedTarget = require('../../src/sprites/rendered-target');
const Sprite = require('../../src/sprites/sprite');
const Runtime = require('../../src/engine/runtime');

test('spec', t => {
    t.type(Thread, 'function');

    const th = new Thread('arbitraryString');
    t.type(th, 'object');
    t.ok(th instanceof Thread);
    t.type(th.pushStack, 'function');
    t.type(th.popStack, 'function');
    t.type(th.stopThisScript, 'function');
    t.type(th.peekStack, 'function');
    t.type(th.peekStackFrame, 'function');
    t.type(th.pause, 'function');
    t.type(th.resume, 'function');
    t.type(th.finishResuming, 'function');
    t.type(th.initParams, 'function');
    t.type(th.pushParam, 'function');
    t.type(th.peekStack, 'function');
    t.type(th.getParam, 'function');
    t.type(th.atStackTop, 'function');
    t.type(th.goToNextBlock, 'function');
    t.type(th.isRecursiveCall, 'function');

    t.end();
});

test('pushStack', t => {
    const th = new Thread('arbitraryString');
    th.pushStack('arbitraryString');

    t.end();
});

test('popStack', t => {
    const th = new Thread('arbitraryString');
    t.strictEquals(th.popStack(), 'arbitraryString');
    t.strictEquals(th.popStack(), null);

    t.end();
});

test('atStackTop', t => {
    const th = new Thread('arbitraryString');
    th.pushStack('secondString');
    t.strictEquals(th.atStackTop(), false);
    th.popStack();
    t.strictEquals(th.atStackTop(), true);

    t.end();
});

test('peekStackFrame', t => {
    const th = new Thread('arbitraryString');
    t.strictEquals(th.peekStackFrame().warpMode, false);
    th.popStack();
    t.strictEquals(th.peekStackFrame(), null);

    t.end();
});

test('pause', t => {
    const th = new Thread('arbitraryString');
    th.pushStack('secondString');
    const reported = [];
    th.pause('reportingBlock', reported);
    t.equal(th.status, Thread.STATUS_PROMISE_WAIT);
    t.equal(th.reportingBlockId, 'reportingBlock');

    t.end();
});

test('resume', t => {
    const th = new Thread('arbitraryString');
    th.pushStack('secondString');
    const reported = [];
    th.pause('reportingBlock', reported);
    th.resume('reportedValue');
    t.equal(th.status, Thread.STATUS_RUNNING);
    t.equal(th.resolvedValue, 'reportedValue');

    t.end();
});

test('finishResuming', t => {
    const th = new Thread('arbitraryString');
    th.pushStack('secondString');
    const reported = [];
    th.pause('reportingBlock', reported);
    th.resume('reportedValue');
    th.finishResuming();
    t.equal(th.justResolved, false);
    t.equal(th.resolvedValue, null);
    t.equal(th.reportingBlockId, null);
    t.equal(th.reported, null);

    t.end();
});

test('retire', t => {
    const th = new Thread('arbitraryString');
    th.pushStack('secondString');
    t.equal(th.stack.length, 1);
    th.retire();
    t.equal(th.stack.length, 0);
    t.equal(th.status, Thread.STATUS_DONE);
    t.equal(th.peekStack(), null);

    t.end();
});

test('peekStack', t => {
    const th = new Thread('arbitraryString');
    t.strictEquals(th.peekStack(), 'arbitraryString');
    th.popStack();
    t.strictEquals(th.peekStack(), null);

    t.end();
});

test('PushGetParam', t => {
    const th = new Thread('arbitraryString');
    th.initParams();
    th.pushParam('testParam', 'testValue');
    t.strictEquals(th.peekStackFrame().params.testParam, 'testValue');
    t.strictEquals(th.getParam('testParam'), 'testValue');
    // Params outside of define stack always evaluate to null
    t.strictEquals(th.getParam('nonExistentParam'), null);

    t.end();
});

test('goToNextBlock', t => {
    const th = new Thread('arbitraryString');
    const r = new Runtime();
    const s = new Sprite(null, r);
    const rt = new RenderedTarget(s, r);
    const block1 = {fields: Object,
        id: 'arbitraryString',
        inputs: Object,
        STEPS: Object,
        block: 'fakeBlock',
        name: 'STEPS',
        next: 'secondString',
        opcode: 'motion_movesteps',
        parent: null,
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0
    };
    const block2 = {fields: Object,
        id: 'secondString',
        inputs: Object,
        STEPS: Object,
        block: 'fakeBlock',
        name: 'STEPS',
        next: null,
        opcode: 'procedures_call',
        mutation: {proccode: 'fakeCode'},
        parent: null,
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0
    };

    rt.blocks.createBlock(block1);
    rt.blocks.createBlock(block2);
    rt.blocks.createBlock(block2);
    th.target = rt;

    t.strictEquals(th.peekStack(), 'arbitraryString');
    th.pushStack('secondString');
    t.strictEquals(th.peekStack(), 'secondString');
    th.goToNextBlock();
    t.strictEquals(th.peekStack(), null);
    th.pushStack('secondString');
    th.pushStack('arbitraryString');
    t.strictEquals(th.peekStack(), 'arbitraryString');
    th.goToNextBlock();
    t.strictEquals(th.peekStack(), 'secondString');
    th.goToNextBlock();
    t.strictEquals(th.peekStack(), null);

    t.end();
});

test('stopThisScript', t => {
    const makeThread = () => {
        const th = new Thread('arbitraryString');
        const r = new Runtime();
        const s = new Sprite(null, r);
        const rt = new RenderedTarget(s, r);
        const block1 = {fields: Object,
            id: 'arbitraryString',
            inputs: Object,
            STEPS: Object,
            block: 'fakeBlock',
            name: 'STEPS',
            next: null,
            opcode: 'motion_movesteps',
            parent: null,
            shadow: false,
            topLevel: true,
            x: 0,
            y: 0
        };
        const block2 = {fields: Object,
            id: 'secondString',
            inputs: Object,
            STEPS: Object,
            block: 'fakeBlock',
            name: 'STEPS',
            next: null,
            opcode: 'procedures_call',
            mutation: {proccode: 'fakeCode'},
            parent: null,
            shadow: false,
            topLevel: true,
            x: 0,
            y: 0
        };
        const block3 = {fields: Object,
            id: 'thirdString',
            inputs: Object,
            STEPS: Object,
            block: 'fakeBlock',
            name: 'STEPS',
            next: null,
            opcode: 'procedures_definition',
            mutation: {proccode: 'fakeCode'},
            parent: null,
            shadow: false,
            topLevel: true,
            x: 0,
            y: 0
        };
    
        rt.blocks.createBlock(block1);
        rt.blocks.createBlock(block2);
        rt.blocks.createBlock(block3);
        th.target = rt;
        return th;
    };
    
    let th = makeThread();
    th.stopThisScript();
    t.strictEquals(th.peekStack(), null);
    t.strictEquals(th.peekStackFrame(), null);

    th = makeThread();
    t.strictEquals(th.peekStack(), 'arbitraryString');
    t.notEqual(th.peekStackFrame(), null);
    th.stopThisScript();
    t.strictEquals(th.peekStack(), null);
    t.strictEquals(th.peekStackFrame(), null);

    th = makeThread();
    th.pushStack('secondString');
    th.stopThisScript();
    t.strictEquals(th.peekStack(), null);
    t.same(th.stack, ['arbitraryString']);
    t.notEqual(th.peekStackFrame(), null);

    th = makeThread();
    th.pushStack('secondString');
    th.pushStack('thirdString');
    th.stopThisScript();
    t.strictEquals(th.peekStack(), null);
    t.same(th.stack, ['arbitraryString']);
    t.notEqual(th.peekStackFrame(), null);

    t.end();
});

test('isRecursiveCall', t => {
    const th = new Thread('arbitraryString');
    const r = new Runtime();
    const s = new Sprite(null, r);
    const rt = new RenderedTarget(s, r);
    const block1 = {fields: Object,
        id: 'arbitraryString',
        inputs: Object,
        STEPS: Object,
        block: 'fakeBlock',
        name: 'STEPS',
        next: null,
        opcode: 'motion_movesteps',
        parent: null,
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0
    };
    const block2 = {fields: Object,
        id: 'secondString',
        inputs: Object,
        STEPS: Object,
        block: 'fakeBlock',
        name: 'STEPS',
        next: null,
        opcode: 'procedures_call',
        mutation: {proccode: 'fakeCode'},
        parent: null,
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0
    };

    rt.blocks.createBlock(block1);
    rt.blocks.createBlock(block2);
    th.target = rt;

    t.strictEquals(th.isRecursiveCall('fakeCode'), false);
    th.pushStack('secondString');
    t.strictEquals(th.isRecursiveCall('fakeCode'), false);
    th.pushStack('arbitraryString');
    t.strictEquals(th.isRecursiveCall('fakeCode'), true);
    th.pushStack('arbitraryString');
    t.strictEquals(th.isRecursiveCall('fakeCode'), true);
    th.popStack();
    t.strictEquals(th.isRecursiveCall('fakeCode'), true);
    th.popStack();
    t.strictEquals(th.isRecursiveCall('fakeCode'), false);
    th.popStack();
    t.strictEquals(th.isRecursiveCall('fakeCode'), false);

    t.end();
});
