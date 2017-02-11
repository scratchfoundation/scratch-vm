var test = require('tap').test;
var Thread = require('../../src/engine/thread');
var RenderedTarget = require('../../src/sprites/rendered-target');
var Sprite = require('../../src/sprites/sprite');

test('spec', function (t) {
    t.type(Thread, 'function');
    
    var th = new Thread('arbitraryString');
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

test('pushStack', function (t) {
    var th = new Thread('arbitraryString');
    th.pushStack('arbitraryString');
    
    t.end();
});

test('popStack', function (t) {
    var th = new Thread('arbitraryString');
    th.pushStack('arbitraryString');
    t.strictEquals(th.popStack(), 'arbitraryString');
    t.strictEquals(th.popStack(), undefined);
    
    t.end();
});

test('atStackTop', function (t) {
    var th = new Thread('arbitraryString');
    th.pushStack('arbitraryString');
    th.pushStack('secondString');
    t.strictEquals(th.atStackTop(), false);
    th.popStack();
    t.strictEquals(th.atStackTop(), true);
    
    t.end();
});

test('reuseStackForNextBlock', function (t) {
    var th = new Thread('arbitraryString');
    th.pushStack('arbitraryString');
    th.reuseStackForNextBlock('secondString');
    t.strictEquals(th.popStack(), 'secondString');
    
    t.end();
});

test('peekStackFrame', function (t) {
    var th = new Thread('arbitraryString');
    th.pushStack('arbitraryString');
    t.strictEquals(th.peekStackFrame().warpMode, false);
    th.popStack();
    t.strictEquals(th.peekStackFrame(), null);
    
    t.end();
});

test('peekParentStackFrame', function (t) {
    var th = new Thread('arbitraryString');
    th.pushStack('arbitraryString');
    th.peekStackFrame().warpMode = true;
    t.strictEquals(th.peekParentStackFrame(), null);
    th.pushStack('secondString');
    t.strictEquals(th.peekParentStackFrame().warpMode, true);
    
    t.end();
});

test('pushReportedValue', function (t) {
    var th = new Thread('arbitraryString');
    th.pushStack('arbitraryString');
    th.pushStack('secondString');
    th.pushReportedValue('value');
    t.strictEquals(th.peekParentStackFrame().reported.null, 'value');
    
    t.end();
});

test('peekStack', function (t) {
    var th = new Thread('arbitraryString');
    th.pushStack('arbitraryString');
    t.strictEquals(th.peekStack(), 'arbitraryString');
    th.popStack();
    t.strictEquals(th.peekStack(), null);
    
    t.end();
});

test('PushGetParam', function (t) {
    var th = new Thread('arbitraryString');
    th.pushStack('arbitraryString');
    th.pushParam('testParam', 'testValue');
    t.strictEquals(th.peekStackFrame().params.testParam, 'testValue');
    t.strictEquals(th.getParam('testParam'), 'testValue');
    
    t.end();
});

test('goToNextBlock', function (t) {
    var th = new Thread('arbitraryString');
    var s = new Sprite();
    var rt = new RenderedTarget(s, null);
    var block1 = {fields: Object,
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
    var block2 = {fields: Object,
        id: 'secondString',
        inputs: Object,
        STEPS: Object,
        block: 'fakeBlock',
        name: 'STEPS',
        next: null,
        opcode: 'procedures_callnoreturn',
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

test('stopThisScript', function (t) {
    var th = new Thread('arbitraryString');
    var s = new Sprite();
    var rt = new RenderedTarget(s, null);
    var block1 = {fields: Object,
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
    var block2 = {fields: Object,
        id: 'secondString',
        inputs: Object,
        STEPS: Object,
        block: 'fakeBlock',
        name: 'STEPS',
        next: null,
        opcode: 'procedures_callnoreturn',
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

test('isRecursiveCall', function (t) {
    var th = new Thread('arbitraryString');
    var s = new Sprite();
    var rt = new RenderedTarget(s, null);
    var block1 = {fields: Object,
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
    var block2 = {fields: Object,
        id: 'secondString',
        inputs: Object,
        STEPS: Object,
        block: 'fakeBlock',
        name: 'STEPS',
        next: null,
        opcode: 'procedures_callnoreturn',
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
