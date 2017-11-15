const test = require('tap').test;
const Music = require('../../src/blocks/scratch3_music');
let playedDrum;
let playedInstrument;
const runtime = {
    audioEngine: {
        numDrums: 3,
        numInstruments: 3,
        instrumentPlayer: {
            loadInstrument: instrument => (playedInstrument = instrument)
        }
    }
};
const blocks = new Music(runtime);
const util = {
    target: {
        audioPlayer: {
            playDrumForBeats: drum => (playedDrum = drum)
        }
    },
    stackFrame: Object.create(null)
};

test('playDrum uses 1-indexing and wrap clamps', t => {
    let args = {DRUM: 1};
    blocks.playDrumForBeats(args, util);
    t.strictEqual(playedDrum, 0);

    args = {DRUM: runtime.audioEngine.numDrums + 1};
    blocks.playDrumForBeats(args, util);
    t.strictEqual(playedDrum, 0);

    t.end();
});

test('setInstrument uses 1-indexing and wrap clamps', t => {
    // Stub getMusicState
    blocks._getMusicState = () => ({});

    let args = {INSTRUMENT: 1};
    blocks.setInstrument(args, util);
    t.strictEqual(playedInstrument, 0);

    args = {INSTRUMENT: runtime.audioEngine.numInstruments + 1};
    blocks.setInstrument(args, util);
    t.strictEqual(playedInstrument, 0);

    t.end();
});
