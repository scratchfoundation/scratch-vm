var path = require('path');
var test = require('tap').test;
var extract = require('../fixtures/extract');

var renderedTarget = require('../../src/sprites/rendered-target');
var runtime = require('../../src/engine/runtime');
var sb2 = require('../../src/import/sb2import');

test('spec', function (t) {
    t.type(sb2, 'function');
    t.end();
});

test('default', function (t) {
    // Get SB2 JSON (string)
    var uri = path.resolve(__dirname, '../fixtures/default.sb2');
    var file = extract(uri);

    // Create runtime instance & load SB2 into it
    var rt = new runtime();
    sb2(file, rt);

    // Test
    t.type(file, 'string');
    t.type(rt, 'object');
    t.type(rt.targets, 'object');

    t.ok(rt.targets[0] instanceof renderedTarget);
    t.type(rt.targets[0].id, 'string');
    t.type(rt.targets[0].blocks, 'object');
    t.type(rt.targets[0].variables, 'object');
    t.type(rt.targets[0].lists, 'object');

    t.equal(rt.targets[0].isOriginal, true);
    t.equal(rt.targets[0].currentCostume, 0);
    t.equal(rt.targets[0].isOriginal, true);
    t.equal(rt.targets[0].isStage, true);

    t.ok(rt.targets[1] instanceof renderedTarget);
    t.type(rt.targets[1].id, 'string');
    t.type(rt.targets[1].blocks, 'object');
    t.type(rt.targets[1].variables, 'object');
    t.type(rt.targets[1].lists, 'object');

    t.equal(rt.targets[1].isOriginal, true);
    t.equal(rt.targets[1].currentCostume, 0);
    t.equal(rt.targets[1].isOriginal, true);
    t.equal(rt.targets[1].isStage, false);
    t.end();
});
