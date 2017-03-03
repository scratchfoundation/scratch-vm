var toolboxes = require('../fixtures/toolboxes');
var test = require('tap').test;
var filterToolbox = require('../../src/util/filter-toolbox');

test('categories', function (t) {
    var filteredToolbox = filterToolbox(toolboxes.categories, ['motion_movesteps']);
    t.strictEqual(filteredToolbox.children.length, 3);
    t.strictEqual(filteredToolbox.firstElementChild.children.length, 1);
    t.end();
});

test('simple', function (t) {
    var filteredToolbox = filterToolbox(toolboxes.simple, ['motion_movesteps']);
    t.strictEqual(filteredToolbox.children.length, 1);
    t.end();
});

test('empty', function (t) {
    var filteredToolbox = filterToolbox(toolboxes.empty, ['motion_movesteps']);
    t.strictEqual(filteredToolbox.children.length, 0);
    t.end();
});
