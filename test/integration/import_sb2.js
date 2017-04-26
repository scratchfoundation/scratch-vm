const path = require('path');
const test = require('tap').test;
const attachTestStorage = require('../fixtures/attach-test-storage');
const extract = require('../fixtures/extract');

const renderedTarget = require('../../src/sprites/rendered-target');
const runtime = require('../../src/engine/runtime');
const sb2 = require('../../src/serialization/sb2');

test('spec', t => {
    t.type(sb2, 'function');
    t.end();
});

test('default', t => {
    // Get SB2 JSON (string)
    const uri = path.resolve(__dirname, '../fixtures/default.sb2');
    const file = extract(uri);

    // Create runtime instance & load SB2 into it
    const rt = new runtime();
    attachTestStorage(rt);
    sb2(file, rt).then(targets => {
        // Test
        t.type(file, 'string');
        t.type(rt, 'object');
        t.type(targets, 'object');

        t.ok(targets[0] instanceof renderedTarget);
        t.type(targets[0].id, 'string');
        t.type(targets[0].blocks, 'object');
        t.type(targets[0].variables, 'object');
        t.type(targets[0].lists, 'object');

        t.equal(targets[0].isOriginal, true);
        t.equal(targets[0].currentCostume, 0);
        t.equal(targets[0].isOriginal, true);
        t.equal(targets[0].isStage, true);

        t.ok(targets[1] instanceof renderedTarget);
        t.type(targets[1].id, 'string');
        t.type(targets[1].blocks, 'object');
        t.type(targets[1].variables, 'object');
        t.type(targets[1].lists, 'object');

        t.equal(targets[1].isOriginal, true);
        t.equal(targets[1].currentCostume, 0);
        t.equal(targets[1].isOriginal, true);
        t.equal(targets[1].isStage, false);
        t.end();
    });
});
