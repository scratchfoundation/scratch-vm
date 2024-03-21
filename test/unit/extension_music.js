const test = require('tap').test;
const Music = require('../../src/extensions/scratch3_music/index.js');
const Blocks = require('../../src/engine/blocks');
const BlockUtility = require('../../src/engine/block-utility');
const Runtime = require('../../src/engine/runtime');
const Target = require('../../src/engine/target');
const Thread = require('../../src/engine/thread');

const rt = new Runtime();
const util = new BlockUtility();
util.sequencer = rt.sequencer;
util.runtime = rt;
util.thread = new Thread(null);
util.thread.pushStack();

const b = new Blocks(rt);
const tgt = new Target(rt, b);
tgt.isStage = true;

const blocks = new Music(rt);

test('playDrum uses 1-indexing and wrap clamps', t => {
    // Stub playDrumNum
    let playedDrum;
    blocks._playDrumNum = (_util, drum) => (playedDrum = drum);

    let args = {DRUM: 1};
    blocks.playDrumForBeats(args, util);
    t.strictEqual(playedDrum, 0);

    args = {DRUM: blocks.DRUM_INFO.length + 1};
    blocks.playDrumForBeats(args, util);
    t.strictEqual(playedDrum, 0);

    t.end();
});

test('setInstrument uses 1-indexing and wrap clamps', t => {
    // Stub getMusicState
    const state = {currentInstrument: 0};
    blocks._getMusicState = () => state;

    let args = {INSTRUMENT: 1};
    blocks.setInstrument(args, util);
    t.strictEqual(state.currentInstrument, 0);

    args = {INSTRUMENT: blocks.INSTRUMENT_INFO.length + 1};
    blocks.setInstrument(args, util);
    t.strictEqual(state.currentInstrument, 0);

    t.end();
});
