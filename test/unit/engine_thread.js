const test = require('tap').test;
const Thread = require('../../src/engine/thread');
const RenderedTarget = require('../../src/sprites/rendered-target');
const Sprite = require('../../src/sprites/sprite');

test('spec', t => {
    t.type(Thread, 'function');
    
    const th = new Thread('arbitraryString');
    t.type(th, 'object');
    t.ok(th instanceof Thread);
    t.type(th.pushStack, 'function');
    t.type(th.reuseStackForNextBlock, 'function');
    t.type(th.popStack, 'function');
    t.type(th.stopThisScript, 'function');
    t.type(th.peekStack, 'function');
    t.type(th.peekStackFrame, 'function');
    t.type(th.peekParentStackFrame, 'function');
    t.type(th.pushReportedValue, 'function');
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
    th.pushStack('arbitraryString');
    t.strictEquals(th.popStack(), 'arbitraryString');
    t.strictEquals(th.popStack(), undefined);
    
    t.end();
});

test('atStackTop', t => {
    const th = new Thread('arbitraryString');
    th.pushStack('arbitraryString');
    th.pushStack('secondString');
    t.strictEquals(th.atStackTop(), false);
    th.popStack();
    t.strictEquals(th.atStackTop(), true);
    
    t.end();
});

test('reuseStackForNextBlock', t => {
    const th = new Thread('arbitraryString');
    th.pushStack('arbitraryString');
    th.reuseStackForNextBlock('secondString');
    t.strictEquals(th.popStack(), 'secondString');
    
    t.end();
});

test('peekStackFrame', t => {
    const th = new Thread('arbitraryString');
    th.pushStack('arbitraryString');
    t.strictEquals(th.peekStackFrame().warpMode, false);
    th.popStack();
    t.strictEquals(th.peekStackFrame(), null);
    
    t.end();
});

test('peekParentStackFrame', t => {
    const th = new Thread('arbitraryString');
    th.pushStack('arbitraryString');
    th.peekStackFrame().warpMode = true;
    t.strictEquals(th.peekParentStackFrame(), null);
    th.pushStack('secondString');
    t.strictEquals(th.peekParentStackFrame().warpMode, true);
    
    t.end();
});

test('pushReportedValue', t => {
    const th = new Thread('arbitraryString');
    th.pushStack('arbitraryString');
    th.pushStack('secondString');
    th.pushReportedValue('value');
    t.strictEquals(th.peekParentStackFrame().reported.null, 'value');
    
    t.end();
});

test('peekStack', t => {
    const th = new Thread('arbitraryString');
    th.pushStack('arbitraryString');
    t.strictEquals(th.peekStack(), 'arbitraryString');
    th.popStack();
    t.strictEquals(th.peekStack(), null);
    
    t.end();
});

test('PushGetParam', t => {
    const th = new Thread('arbitraryString');
    th.pushStack('arbitraryString');
    th.pushParam('testParam', 'testValue');
    t.strictEquals(th.peekStackFrame().params.testParam, 'testValue');
    t.strictEquals(th.getParam('testParam'), 'testValue');
    // Params outside of define stack always evaluate to null
    t.strictEquals(th.getParam('nonExistentParam'), null);

    t.end();
});

test('goToNextBlock', t => {
    const th = new Thread('arbitraryString');
    const s = new Sprite();
    const rt = new RenderedTarget(s, null);
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
    
    t.strictEquals(th.peekStack(), null);
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
    const th = new Thread('arbitraryString');
    const s = new Sprite();
    const rt = new RenderedTarget(s, null);
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
    
    th.stopThisScript();
    t.strictEquals(th.peekStack(), null);
    th.pushStack('arbitraryString');
    t.strictEquals(th.peekStack(), 'arbitraryString');
    th.stopThisScript();
    t.strictEquals(th.peekStack(), null);
    th.pushStack('arbitraryString');
    th.pushStack('secondString');
    th.stopThisScript();
    t.strictEquals(th.peekStack(), 'secondString');
    
    t.end();
});

test('isRecursiveCall', t => {
    const th = new Thread('arbitraryString');
    const s = new Sprite();
    const rt = new RenderedTarget(s, null);
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
