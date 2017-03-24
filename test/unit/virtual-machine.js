var test = require('tap').test;
var VirtualMachine = require('../../src/virtual-machine.js');

test('renameSprite throws when there is no sprite with that id', function (t) {
    var vm = new VirtualMachine();
    vm.runtime.getTargetById = () => null;
    t.throws(
        (() => vm.renameSprite('id', 'name')),
        new Error('No target with the provided id.')
    );
    t.end();
});

test('renameSprite throws when used on a non-sprite target', function (t) {
    var vm = new VirtualMachine();
    var fakeTarget = {
        isSprite: () => false
    };
    vm.runtime.getTargetById = () => (fakeTarget);
    t.throws(
        (() => vm.renameSprite('id', 'name')),
        new Error('Cannot rename non-sprite targets.')
    );
    t.end();
});

test('renameSprite throws when there is no sprite for given target', function (t) {
    var vm = new VirtualMachine();
    var fakeTarget = {
        sprite: null,
        isSprite: () => true
    };
    vm.runtime.getTargetById = () => (fakeTarget);
    t.throws(
        (() => vm.renameSprite('id', 'name')),
        new Error('No sprite associated with this target.')
    );
    t.end();
});

test('renameSprite sets the sprite name', function (t) {
    var vm = new VirtualMachine();
    var fakeTarget = {
        sprite: {name: 'original'},
        isSprite: () => true
    };
    vm.runtime.getTargetById = () => (fakeTarget);
    vm.renameSprite('id', 'not-original');
    t.equal(fakeTarget.sprite.name, 'not-original');
    t.end();
});

test('renameSprite does not set sprite names to an empty string', function (t) {
    var vm = new VirtualMachine();
    var fakeTarget = {
        sprite: {name: 'original'},
        isSprite: () => true
    };
    vm.runtime.getTargetById = () => (fakeTarget);
    vm.renameSprite('id', '');
    t.equal(fakeTarget.sprite.name, 'original');
    t.end();
});

test('renameSprite does not set sprite names to reserved names', function (t) {
    var vm = new VirtualMachine();
    var fakeTarget = {
        sprite: {name: 'original'},
        isSprite: () => true
    };
    vm.runtime.getTargetById = () => (fakeTarget);
    vm.renameSprite('id', '_mouse_');
    t.equal(fakeTarget.sprite.name, 'original');
    t.end();
});

test('renameSprite increments from existing sprite names', function (t) {
    var vm = new VirtualMachine();
    vm.emitTargetsUpdate = () => {};
    vm.runtime.targets = [{
        id: 'id1',
        isSprite: () => true,
        sprite: {
            name: 'this name'
        }
    }, {
        id: 'id2',
        isSprite: () => true,
        sprite: {
            name: 'that name'
        }
    }];
    vm.renameSprite('id1', 'that name');
    t.equal(vm.runtime.targets[0].sprite.name, 'that name2');
    t.end();
});
