var test = require('tap').test;
var VirtualMachine = require('../../src/index');

test('spec', function (t) {
    var vm = new VirtualMachine('foo');

    t.type(VirtualMachine, 'function');
    t.type(vm, 'object');

    t.type(vm.blockListener, 'function');
    // t.type(vm.uiListener, 'function');
    // t.type(vm.start, 'function');
    // t.type(vm.stop, 'function');
    // t.type(vm.save, 'function');
    // t.type(vm.load, 'function');

    t.end();
});
