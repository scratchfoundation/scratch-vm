const test = require('tap').test;
const Looks = require('../../src/blocks/scratch3_looks');
const Runtime = require('../../src/engine/runtime');
const Sprite = require('../../src/sprites/sprite.js');
const RenderedTarget = require('../../src/sprites/rendered-target.js');
const util = {
    target: {
        currentCostume: 0, // Internally, current costume is 0 indexed
        getCostumes: function () {
            return this.sprite.costumes;
        },
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

/**
 * Test which costume index the `switch costume`
 * block will jump to given an argument and array
 * of costume names. Works for backdrops if isStage is set.
 *
 * @param {string[]} costumes List of costume names as strings
 * @param {string|number|boolean} arg The argument to provide to the block.
 * @param {number} [currentCostume=1] The 1-indexed default costume for the sprite to start at.
 * @param {boolean} [isStage=false] Whether the sprite is the stage
 * @return {number} The 1-indexed costume index on which the sprite lands.
 */
const testCostume = (costumes, arg, currentCostume = 1, isStage = false) => {
    const rt = new Runtime();
    const looks = new Looks(rt);

    const sprite = new Sprite(null, rt);
    const target = new RenderedTarget(sprite, rt);

    sprite.costumes = costumes.map(name => ({name: name}));
    target.currentCostume = currentCostume - 1; // Convert to 0-indexed.

    if (isStage) {
        target.isStage = true;
        rt.targets.push(target);
        looks.switchBackdrop({BACKDROP: arg}, {target});
    } else {
        looks.switchCostume({COSTUME: arg}, {target});
    }

    return target.currentCostume + 1; // Convert to 1-indexed.
};


/**
 * Test which backdrop index the `switch backdrop`
 * block will jump to given an argument and array
 * of backdrop names.
 *
 * @param {string[]} backdrops List of backdrop names as strings
 * @param {string|number|boolean} arg The argument to provide to the block.
 * @param {number} [currentCostume=1] The 1-indexed default backdrop for the stage to start at.
 * @return {number} The 1-indexed backdrop index on which the stage lands.
 */
const testBackdrop = (backdrops, arg, currentCostume = 1) => testCostume(backdrops, arg, currentCostume, true);

test('switch costume block runs correctly', t => {
    // Non-existant costumes do nothing
    t.strictEqual(testCostume(['a', 'b', 'c', 'd'], 'e', 3), 3);

    // Numeric arguments are always the costume index
    // String arguments are treated as costume names, and coerced to
    // a costume index as a fallback
    t.strictEqual(testCostume(['a', 'b', 'c', '2'], 2), 2);
    t.strictEqual(testCostume(['a', 'b', 'c', '2'], '2'), 4);
    t.strictEqual(testCostume(['a', 'b', 'c'], '2'), 2);

    // 'previous costume' and 'next costume' increment/decrement
    t.strictEqual(testCostume(['a', 'b', 'c', 'd'], 'previous costume', 3), 2);
    t.strictEqual(testCostume(['a', 'b', 'c', 'd'], 'next costume', 2), 3);

    // 'previous costume' and 'next costume' can be overriden
    t.strictEqual(testCostume(['a', 'previous costume', 'c', 'd'], 'previous costume'), 2);
    t.strictEqual(testCostume(['next costume', 'b', 'c', 'd'], 'next costume'), 1);

    // NaN, Infinity, and true are the first costume
    t.strictEqual(testCostume(['a', 'b', 'c', 'd'], NaN, 2), 1);
    t.strictEqual(testCostume(['a', 'b', 'c', 'd'], true, 2), 1);
    t.strictEqual(testCostume(['a', 'b', 'c', 'd'], Infinity, 2), 1);
    t.strictEqual(testCostume(['a', 'b', 'c', 'd'], -Infinity, 2), 1);

    // 'previous backdrop' and 'next backdrop' have no effect
    t.strictEqual(testCostume(['a', 'b', 'c', 'd'], 'previous backdrop', 3), 3);
    t.strictEqual(testCostume(['a', 'b', 'c', 'd'], 'next backdrop', 3), 3);

    // Strings with no digits are not numeric
    t.strictEqual(testCostume(['a', 'b', 'c', 'd'], '    ', 2), 2);

    // False is 0 (the last costume)
    t.strictEqual(testCostume(['a', 'b', 'c', 'd'], false), 4);

    // Booleans are costume names where possible.
    t.strictEqual(testCostume(['a', 'true', 'false', 'd'], false), 3);
    t.strictEqual(testCostume(['a', 'true', 'false', 'd'], true), 2);

    // Costume indices should wrap around.
    t.strictEqual(testCostume(['a', 'b', 'c', 'd'], -1), 3);
    t.strictEqual(testCostume(['a', 'b', 'c', 'd'], -4), 4);
    t.strictEqual(testCostume(['a', 'b', 'c', 'd'], 10), 2);

    t.end();
});

test('switch backdrop block runs correctly', t => {
    // Non-existant backdrops do nothing
    t.strictEqual(testBackdrop(['a', 'b', 'c', 'd'], 'e', 3), 3);

    // Difference between string and numeric arguments
    t.strictEqual(testBackdrop(['a', 'b', 'c', '2'], 2), 2);
    t.strictEqual(testBackdrop(['a', 'b', 'c', '2'], '2'), 4);

    // 'previous backdrop' and 'next backdrop' increment/decrement
    t.strictEqual(testBackdrop(['a', 'b', 'c', 'd'], 'previous backdrop', 3), 2);
    t.strictEqual(testBackdrop(['a', 'b', 'c', 'd'], 'next backdrop', 2), 3);

    // 'previous backdrop', 'previous backdrop', 'random backdrop' can be overriden
    // Test is deterministic since 'random backdrop' will not pick the same backdrop as currently selected
    t.strictEqual(testBackdrop(['a', 'previous backdrop', 'c', 'd'], 'previous backdrop', 4), 2);
    t.strictEqual(testBackdrop(['next backdrop', 'b', 'c', 'd'], 'next backdrop', 3), 1);
    t.strictEqual(testBackdrop(['random backdrop', 'b', 'c', 'd'], 'random backdrop'), 1);

    // NaN, Infinity, and true are the first costume
    t.strictEqual(testBackdrop(['a', 'b', 'c', 'd'], NaN, 2), 1);
    t.strictEqual(testBackdrop(['a', 'b', 'c', 'd'], true, 2), 1);
    t.strictEqual(testBackdrop(['a', 'b', 'c', 'd'], Infinity, 2), 1);
    t.strictEqual(testBackdrop(['a', 'b', 'c', 'd'], -Infinity, 2), 1);

    // 'previous costume' and 'next costume' have no effect
    t.strictEqual(testBackdrop(['a', 'b', 'c', 'd'], 'previous costume', 3), 3);
    t.strictEqual(testBackdrop(['a', 'b', 'c', 'd'], 'next costume', 3), 3);

    // Strings with no digits are not numeric
    t.strictEqual(testBackdrop(['a', 'b', 'c', 'd'], '    ', 2), 2);

    // False is 0 (the last costume)
    t.strictEqual(testBackdrop(['a', 'b', 'c', 'd'], false), 4);

    // Booleans are backdrop names where possible.
    t.strictEqual(testBackdrop(['a', 'true', 'false', 'd'], false), 3);
    t.strictEqual(testBackdrop(['a', 'true', 'false', 'd'], true), 2);

    // Backdrop indices should wrap around.
    t.strictEqual(testBackdrop(['a', 'b', 'c', 'd'], -1), 3);
    t.strictEqual(testBackdrop(['a', 'b', 'c', 'd'], -4), 4);
    t.strictEqual(testBackdrop(['a', 'b', 'c', 'd'], 10), 2);
    
    t.end();
});

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
    const name = blocks.getCostumeNumberName(args, util);
    t.strictEqual(name, 'first name');
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
