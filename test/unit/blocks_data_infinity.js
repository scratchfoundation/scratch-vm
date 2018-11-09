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

test('List with postive infinity primitive contains postive infinity', t => {
    lists.list = {value: [Infinity]};
    let args = {ITEM: Infinity, LIST: {name: 'list'}};
    let contains = blocks.listContainsItem(args, util);
    t.strictEqual(contains, true, '[Infinity] contains Infinity');

    lists.list = {value: [Infinity]};
    args = {ITEM: 'Infinity', LIST: {name: 'list'}};
    contains = blocks.listContainsItem(args, util);
    t.strictEqual(contains, true, '[Infinity] contains "Infinity"');

    lists.list = {value: [Infinity]};
    args = {ITEM: 'INFINITY', LIST: {name: 'list'}};
    contains = blocks.listContainsItem(args, util);
    t.strictEqual(contains, true, '[Infinity] contains "INFINITY"');

    lists.list = {value: ['Infinity']};
    args = {ITEM: Infinity, LIST: {name: 'list'}};
    contains = blocks.listContainsItem(args, util);
    t.strictEqual(contains, true, '["Infinity"] contains Infinity');

    lists.list = {value: ['Infinity']};
    args = {ITEM: 'Infinity', LIST: {name: 'list'}};
    contains = blocks.listContainsItem(args, util);
    t.strictEqual(contains, true, '["Infinity"] contains "Infinity"');

    lists.list = {value: ['Infinity']};
    args = {ITEM: 'INFINITY', LIST: {name: 'list'}};
    contains = blocks.listContainsItem(args, util);
    t.strictEqual(contains, true, '["Infinity"] contains "INFINITY"');

    lists.list = {value: ['INFINITY']};
    args = {ITEM: Infinity, LIST: {name: 'list'}};
    contains = blocks.listContainsItem(args, util);
    t.strictEqual(contains, true, '["INFINITY"] contains Infinity');

    lists.list = {value: ['INFINITY']};
    args = {ITEM: 'Infinity', LIST: {name: 'list'}};
    contains = blocks.listContainsItem(args, util);
    t.strictEqual(contains, true, '["INFINITY"] contains "Infinity"');

    lists.list = {value: ['INFINITY']};
    args = {ITEM: 'INFINITY', LIST: {name: 'list'}};
    contains = blocks.listContainsItem(args, util);
    t.strictEqual(contains, true, '["INFINITY"] contains "INFINITY"');

    t.end();
});

test('List with negative infinity primitive contains negative infinity', t => {
    lists.list = {value: [-Infinity]};
    let args = {ITEM: -Infinity, LIST: {name: 'list'}};
    let contains = blocks.listContainsItem(args, util);
    t.strictEqual(contains, true, '[-Infinity] contains -Infinity');

    lists.list = {value: [-Infinity]};
    args = {ITEM: '-Infinity', LIST: {name: 'list'}};
    contains = blocks.listContainsItem(args, util);
    t.strictEqual(contains, true, '[-Infinity] contains "-Infinity"');

    lists.list = {value: [-Infinity]};
    args = {ITEM: '-INFINITY', LIST: {name: 'list'}};
    contains = blocks.listContainsItem(args, util);
    t.strictEqual(contains, true, '[-Infinity] contains "-INFINITY"');

    lists.list = {value: ['-Infinity']};
    args = {ITEM: -Infinity, LIST: {name: 'list'}};
    contains = blocks.listContainsItem(args, util);
    t.strictEqual(contains, true, '["-Infinity"] contains -Infinity');

    lists.list = {value: ['-Infinity']};
    args = {ITEM: '-Infinity', LIST: {name: 'list'}};
    contains = blocks.listContainsItem(args, util);
    t.strictEqual(contains, true, '["-Infinity"] contains "-Infinity"');

    lists.list = {value: ['-Infinity']};
    args = {ITEM: '-INFINITY', LIST: {name: 'list'}};
    contains = blocks.listContainsItem(args, util);
    t.strictEqual(contains, true, '["-Infinity"] contains "-INFINITY"');

    lists.list = {value: ['-INFINITY']};
    args = {ITEM: -Infinity, LIST: {name: 'list'}};
    contains = blocks.listContainsItem(args, util);
    t.strictEqual(contains, true, '["-INFINITY"] contains -Infinity');

    lists.list = {value: ['-INFINITY']};
    args = {ITEM: '-Infinity', LIST: {name: 'list'}};
    contains = blocks.listContainsItem(args, util);
    t.strictEqual(contains, true, '["-INFINITY"] contains "-Infinity"');

    lists.list = {value: ['-INFINITY']};
    args = {ITEM: '-INFINITY', LIST: {name: 'list'}};
    contains = blocks.listContainsItem(args, util);
    t.strictEqual(contains, true, '["-INFINITY"] contains "-INFINITY"');

    t.end();
});
