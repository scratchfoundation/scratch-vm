var test = require('tap').test;
var VirtualMachine = require('../../src/index');

test('spec', function (t) {
    var vm = new VirtualMachine();

    t.type(VirtualMachine, 'function');
    t.type(vm, 'object');
    t.end();
});

test('create', function (t) {
    t.end();
});

test('move', function (t) {
    t.end();
});

test('change', function (t) {
    t.end();
});

test('delete', function (t) {
    t.end();
});
