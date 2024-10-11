const test = require('tap').test;

const Blocks = require('../../src/engine/blocks');
const BlockUtility = require('../../src/engine/block-utility');
const Event = require('../../src/blocks/scratch3_event');
const Runtime = require('../../src/engine/runtime');
const Target = require('../../src/engine/target');
const Thread = require('../../src/engine/thread');
const Variable = require('../../src/engine/variable');

test('#760 - broadcastAndWait', t => {
    const broadcastAndWaitBlock = {
        id: 'broadcastAndWaitBlock',
        fields: {
            BROADCAST_INPUT: {
                id: 'testBroadcastID',
                value: 'message'
            }
        },
        inputs: Object,
        block: 'fakeBlock',
        opcode: 'event_broadcastandwait',
        next: null,
        parent: null,
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0
    };
    const receiveMessageBlock = {
        id: 'receiveMessageBlock',
        fields: {
            BROADCAST_OPTION: {
                id: 'testBroadcastID',
                value: 'message'
            }
        },
        inputs: Object,
        block: 'fakeBlock',
        opcode: 'event_whenbroadcastreceived',
        next: null,
        parent: null,
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0
    };

    const rt = new Runtime();
    const e = new Event(rt);
    const b = new Blocks(rt);
    b.createBlock(broadcastAndWaitBlock);
    b.createBlock(receiveMessageBlock);
    const tgt = new Target(rt, b);
    tgt.isStage = true;
    tgt.createVariable('testBroadcastID', 'message', Variable.BROADCAST_MESSAGE_TYPE);

    rt.addTarget(tgt);

    let th = rt._pushThread('broadcastAndWaitBlock', tgt);
    const util = new BlockUtility();
    util.sequencer = rt.sequencer;
    util.thread = th;
    util.runtime = rt;

    // creates threads
    e.broadcastAndWait({BROADCAST_INPUT: {id: 'testBroadcastID', name: 'message'}}, util);
    t.strictEqual(rt.threads.length, 2);
    t.strictEqual(rt.threads[1].topBlock, 'receiveMessageBlock');
    // yields when some thread is active
    t.strictEqual(th.status, Thread.STATUS_YIELD);
    th.status = Thread.STATUS_RUNNING;
    e.broadcastAndWait({BROADCAST_INPUT: {id: 'testBroadcastID', name: 'message'}}, util);
    t.strictEqual(th.status, Thread.STATUS_YIELD);
    // does not yield once all threads are done
    th.status = Thread.STATUS_RUNNING;
    rt.threads[1].status = Thread.STATUS_DONE;
    rt.threads.splice(1, 1);
    e.broadcastAndWait({BROADCAST_INPUT: {id: 'testBroadcastID', name: 'message'}}, util);
    t.strictEqual(th.status, Thread.STATUS_RUNNING);

    // restarts done threads that are in runtime threads
    th = rt._pushThread('broadcastAndWaitBlock', tgt);
    util.thread = th;
    e.broadcastAndWait({BROADCAST_INPUT: {id: 'testBroadcastID', name: 'message'}}, util);
    t.strictEqual(rt.threads.length, 3);
    t.strictEqual(rt.threads[2].status, Thread.STATUS_RUNNING);
    t.strictEqual(th.status, Thread.STATUS_YIELD);
    // yields when some restarted thread is active
    th.status = Thread.STATUS_RUNNING;
    e.broadcastAndWait({BROADCAST_INPUT: {id: 'testBroadcastID', name: 'message'}}, util);
    t.strictEqual(th.status, Thread.STATUS_YIELD);
    // does not yield once all threads are done
    th.status = Thread.STATUS_RUNNING;
    rt.threads[2].status = Thread.STATUS_DONE;
    rt.threads.splice(2, 1);
    e.broadcastAndWait({BROADCAST_INPUT: {id: 'testBroadcastID', name: 'message'}}, util);
    t.strictEqual(th.status, Thread.STATUS_RUNNING);

    t.end();
});

test('When > hat - loudness', t => {
    const rt = new Runtime();
    rt.audioEngine = {getLoudness: () => 10};
    const e = new Event(rt);
    const args = {
        WHENGREATERTHANMENU: 'LOUDNESS',
        VALUE: '11'
    };
    t.equal(e.hatGreaterThanPredicate(args), false);
    args.VALUE = '5';
    t.equal(e.hatGreaterThanPredicate(args), true);
    t.end();
});
