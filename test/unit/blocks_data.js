const test = require('tap').test;
const Data = require('../../src/blocks/scratch3_data');

const blocks = new Data();

const lists = {};
const util = {
    target: {
        lookupOrCreateList (id, name) {
            if (!(name in lists)) {
                lists[name] = {value: []};
            }
            return lists[name];
        }
    }
};

test('getItemNumOfList returns the index of an item (basic)', t => {
    lists.list = {value: ['apple', 'taco', 'burrito', 'extravaganza']};
    const args = {ITEM: 'burrito', LIST: {name: 'list'}};
    const index = blocks.getItemNumOfList(args, util);
    t.strictEqual(index, 3);
    t.end();
});

test('getItemNumOfList returns 0 when an item is not found', t => {
    lists.list = {value: ['aaaaapple', 'burrito']};
    const args = {ITEM: 'jump', LIST: {name: 'list'}};
    const index = blocks.getItemNumOfList(args, util);
    t.strictEqual(index, 0);
    t.end();
});

test('getItemNumOfList uses Scratch comparison', t => {
    lists.list = {value: ['jump', 'Jump', '123', 123, 800]};
    const args = {LIST: {name: 'list'}};

    // Be case-insensitive:
    args.ITEM = 'Jump';
    t.strictEqual(blocks.getItemNumOfList(args, util), 1);

    // Be type-insensitive:
    args.ITEM = 123;
    t.strictEqual(blocks.getItemNumOfList(args, util), 3);
    args.ITEM = '800';
    t.strictEqual(blocks.getItemNumOfList(args, util), 5);

    t.end();
});
