var test = require('tap').test;
var VirtualMachine = require('../../src/index');

test('spec', function (t) {
    var vm = new VirtualMachine();

    t.type(VirtualMachine, 'function');
    t.type(vm, 'object');
    t.type(vm.blockListener, 'function');
    t.end();
});
