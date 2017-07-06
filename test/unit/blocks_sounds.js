const test = require('tap').test;
const Sound = require('../../src/blocks/scratch3_sound');
const blocks = new Sound(null);
let playedSound = null;
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
            playSound: md5 => (playedSound = md5)
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
