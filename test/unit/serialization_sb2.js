const path = require('path');
const test = require('tap').test;
const extract = require('../fixtures/extract');

const RenderedTarget = require('../../src/sprites/rendered-target');
const Runtime = require('../../src/engine/runtime');
const sb2 = require('../../src/serialization/sb2');

test('spec', t => {
    t.type(sb2, 'object');
    t.type(sb2.deserialize, 'function');
    t.end();
});

test('default', t => {
    // Get SB2 JSON (string)
    const uri = path.resolve(__dirname, '../fixtures/default.sb2');
    const file = extract(uri);
    const json = JSON.parse(file);

    // Create runtime instance & load SB2 into it
    const rt = new Runtime();
    sb2.deserialize(json, rt).then(({targets}) => {
        // Test
        t.type(file, 'string');
        t.type(json, 'object');
        t.type(rt, 'object');
        t.type(targets, 'object');

        t.ok(targets[0] instanceof RenderedTarget);
        t.type(targets[0].id, 'string');
        t.type(targets[0].blocks, 'object');
        t.type(targets[0].variables, 'object');
        t.type(targets[0].lists, 'object');

        t.equal(targets[0].isOriginal, true);
        t.equal(targets[0].currentCostume, 0);
        t.equal(targets[0].isOriginal, true);
        t.equal(targets[0].isStage, true);

        t.ok(targets[1] instanceof RenderedTarget);
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

test('data scoping', t => {
    // Get SB2 JSON (string)
    const uri = path.resolve(__dirname, '../fixtures/data.sb2');
    const file = extract(uri);
    const json = JSON.parse(file);

    // Create runtime instance & load SB2 into it
    const rt = new Runtime();
    sb2.deserialize(json, rt).then(({targets}) => {
        const globalVariableIds = Object.keys(targets[0].variables);
        const localVariableIds = Object.keys(targets[1].variables);
        t.equal(targets[0].variables[globalVariableIds[0]].name, 'foo');
        t.equal(targets[1].variables[localVariableIds[0]].name, 'local');
        t.end();
    });
});
