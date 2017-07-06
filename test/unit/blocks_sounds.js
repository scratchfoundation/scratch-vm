const test = require('tap').test;
const Sound = require('../../src/blocks/scratch3_sound');
let playedSound;
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
const blocks = new Sound(runtime);
const util = {
    target: {
        sprite: {
            sounds: [
                {name: 'first name', md5: 'first md5'},
                {name: 'second name', md5: 'second md5'},
                {name: 'third name', md5: 'third md5'},
                {name: '6', md5: 'fourth md5'}
            ]
        },
        audioPlayer: {
            playSound: md5 => (playedSound = md5),
            playDrumForBeats: drum => (playedDrum = drum)
        }
    }
};

test('playSound with a name string works', t => {
    const args = {SOUND_MENU: 'second name'};
    blocks.playSound(args, util);
    t.strictEqual(playedSound, 'second md5');
    t.end();
});

test('playSound with a number string works 1-indexed', t => {
    let args = {SOUND_MENU: '5'};
    blocks.playSound(args, util);
    t.strictEqual(playedSound, 'first md5');

    args = {SOUND_MENU: '1'};
    blocks.playSound(args, util);
    t.strictEqual(playedSound, 'first md5');

    args = {SOUND_MENU: '0'};
    blocks.playSound(args, util);
    t.strictEqual(playedSound, 'fourth md5');
    t.end();
});

test('playSound with a number works 1-indexed', t => {
    let args = {SOUND_MENU: 5};
    blocks.playSound(args, util);
    t.strictEqual(playedSound, 'first md5');

    args = {SOUND_MENU: 1};
    blocks.playSound(args, util);
    t.strictEqual(playedSound, 'first md5');

    args = {SOUND_MENU: 0};
    blocks.playSound(args, util);
    t.strictEqual(playedSound, 'fourth md5');
    t.end();
});

test('playSound prioritizes sound index if given a number', t => {
    const args = {SOUND_MENU: 6};
    blocks.playSound(args, util);
    // Ignore the sound named '6', wrapClamp to the second instead
    t.strictEqual(playedSound, 'second md5');
    t.end();
});

test('playSound prioritizes sound name if given a string', t => {
    const args = {SOUND_MENU: '6'};
    blocks.playSound(args, util);
    // Use the sound named '6', which is the fourth
    t.strictEqual(playedSound, 'fourth md5');
    t.end();
});

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
    // Stub getSoundState
    blocks._getSoundState = () => ({});

    let args = {INSTRUMENT: 1};
    blocks.setInstrument(args, util);
    t.strictEqual(playedInstrument, 0);

    args = {INSTRUMENT: runtime.audioEngine.numInstruments + 1};
    blocks.setInstrument(args, util);
    t.strictEqual(playedInstrument, 0);

    t.end();
});
