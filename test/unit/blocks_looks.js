const test = require('tap').test;
const Looks = require('../../src/blocks/scratch3_looks');
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
    const args = {MESSAGE: 3.14159};
    const sayString = blocks.say(args, util);
    // This breaks becuase it is not returned,
    // instead this calls this._updateBubble(util.target, 'say', String(args.MESSAGE));
    // I'm not familiar
    t.strictEqual(sayString, '3.14');
    t.end();
});
