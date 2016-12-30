var test = require('tap').test;
var VirtualMachine = require('../../src/index');
var sb3 = require('../../src/serialization/sb3');

test('serialize', function (t) {
    var vm = new VirtualMachine();
    vm.fromJSON(JSON.stringify(require('../fixtures/demo.json')));
    var result = sb3.serialize(vm.runtime);
    console.dir(JSON.stringify(result));
    // @todo Analyize
    t.end();
});

test('deserialize', function (t) {
    var vm = new VirtualMachine();
    var result = sb3.deserialize('', vm.runtime);
    // @todo Analyize
    t.end();
});
