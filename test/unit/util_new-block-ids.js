const newBlockIds = require('../../src/util/new-block-ids');
const simpleStack = require('../fixtures/simple-stack');
const tap = require('tap');
const test = tap.test;

let originals;
let newBlocks;

tap.beforeEach(done => {
    originals = simpleStack;
    // Will be mutated so make a copy first
    newBlocks = JSON.parse(JSON.stringify(simpleStack));
    newBlockIds(newBlocks);
    done();
});


/**
 * The structure of the simple stack is:
 *      moveTo (looks_size) -> stopAllSounds
 * The list of blocks is
 *      0: moveTo (TO input block: 1, shadow: 2)
 *      1: looks_size (parent: 0)
 *      2: obscured shadow for moveTo input (parent: 0)
 *      3: stopAllSounds (parent: 0)
 * Inspect fixtures/simple-stack for the full object.
 */

test('top-level block IDs have all changed', t => {
    newBlocks.forEach((block, i) => {
        t.notEqual(block.id, originals[i].id);
    });
    t.end();
});

test('input reference is maintained on parent for attached block', t => {
    t.equal(newBlocks[0].inputs.TO.block, newBlocks[1].id);
    t.end();
});

test('input reference is maintained on parent for obscured shadow', t => {
    t.equal(newBlocks[0].inputs.TO.shadow, newBlocks[2].id);
    t.end();
});

test('parent reference is maintained for attached input', t => {
    t.equal(newBlocks[1].parent, newBlocks[0].id);
    t.end();
});

test('parent reference is maintained for obscured shadow', t => {
    t.equal(newBlocks[2].parent, newBlocks[0].id);
    t.end();
});

test('parent reference is maintained for next block', t => {
    t.equal(newBlocks[3].parent, newBlocks[0].id);
    t.end();
});

test('next reference is maintained for previous block', t => {
    t.equal(newBlocks[0].next, newBlocks[3].id);
    t.end();
});
