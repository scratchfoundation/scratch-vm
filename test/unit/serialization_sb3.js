const test = require('tap').test;
const VirtualMachine = require('../../src/index');
const sb3 = require('../../src/serialization/sb3');

test('serialize', t => {
    const vm = new VirtualMachine();
    vm.fromJSON(JSON.stringify(require('../fixtures/demo.json')));
    const result = sb3.serialize(vm.runtime);
    console.dir(JSON.stringify(result));
    // @todo Analyze
    t.end();
});

test('deserialize', t => {
    const vm = new VirtualMachine();
    const result = sb3.deserialize('', vm.runtime);
    // @todo Analyize
    t.end();
});
