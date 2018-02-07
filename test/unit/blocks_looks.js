const test = require('tap').test;
const Looks = require('../../src/blocks/scratch3_looks');
const Runtime = require('../../src/engine/runtime');
const util = {
    target: {
        currentCostume: 0, // Internally, current costume is 0 indexed
        sprite: {
            costumes: [
                {name: 'first name'},
                {name: 'second name'},
                {name: 'third name'}
            ]
        }
    }
};

const fakeRuntime = {
    getTargetForStage: () => util.target, // Just return the dummy target above.
    on: () => {} // Stub out listener methods used in constructor.
};
const blocks = new Looks(fakeRuntime);

test('getCostumeNumberName returns 1-indexed costume number', t => {
    util.target.currentCostume = 0; // This is 0-indexed.
    const args = {NUMBER_NAME: 'number'};
    const number = blocks.getCostumeNumberName(args, util);
    t.strictEqual(number, 1);
    t.end();
});

test('getCostumeNumberName can return costume name', t => {
    util.target.currentCostume = 0; // This is 0-indexed.
    const args = {NUMBER_NAME: 'name'};
    const number = blocks.getCostumeNumberName(args, util);
    t.strictEqual(number, 'first name');
    t.end();
});

test('getBackdropNumberName returns 1-indexed costume number', t => {
    util.target.currentCostume = 2; // This is 0-indexed.
    const args = {NUMBER_NAME: 'number'};
    const number = blocks.getBackdropNumberName(args, util);
    t.strictEqual(number, 3);
    t.end();
});

test('getBackdropNumberName can return costume name', t => {
    util.target.currentCostume = 2; // This is 0-indexed.
    const args = {NUMBER_NAME: 'name'};
    const number = blocks.getBackdropNumberName(args, util);
    t.strictEqual(number, 'third name');
    t.end();
});

test('numbers should be rounded to two decimals in say', t => {
    const rt = new Runtime();
    const looks = new Looks(rt);

    const args = {MESSAGE: 3.14159};
    const expectedSayString = '3.14';

    rt.removeAllListeners('SAY'); // Prevent say blocks from executing

    rt.addListener('SAY', (target, type, sayString) => {
        t.strictEqual(sayString, expectedSayString);
        t.end();
    });

    looks.say(args, util);
});
