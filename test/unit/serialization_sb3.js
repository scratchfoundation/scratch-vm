const test = require('tap').test;
const VirtualMachine = require('../../src/index');
const sb3 = require('../../src/serialization/sb3');
const demoSb3 = require('../fixtures/demo.json');

test('serialize', t => {
    const vm = new VirtualMachine();
    vm.fromJSON(JSON.stringify(demoSb3));
    const result = sb3.serialize(vm.runtime);
    // @todo Analyze
    t.type(JSON.stringify(result), 'string');
    t.end();
});

test('deserialize', t => {
    const vm = new VirtualMachine();
    sb3.deserialize('', vm.runtime).then(({targets}) => {
        // @todo Analyze
        t.type(targets, 'object');
        t.end();
    });
});
