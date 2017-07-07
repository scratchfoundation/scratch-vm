const test = require('tap').test;
const VirtualMachine = require('../../src/virtual-machine.js');

test('renameSprite throws when there is no sprite with that id', t => {
    const vm = new VirtualMachine();
    vm.runtime.getTargetById = () => null;
    t.throws(
        (() => vm.renameSprite('id', 'name')),
        new Error('No target with the provided id.')
    );
    t.end();
});

test('renameSprite throws when used on a non-sprite target', t => {
    const vm = new VirtualMachine();
    const fakeTarget = {
        isSprite: () => false
    };
    vm.runtime.getTargetById = () => (fakeTarget);
    t.throws(
        (() => vm.renameSprite('id', 'name')),
        new Error('Cannot rename non-sprite targets.')
    );
    t.end();
});

test('renameSprite throws when there is no sprite for given target', t => {
    const vm = new VirtualMachine();
    const fakeTarget = {
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

test('renameSprite sets the sprite name', t => {
    const vm = new VirtualMachine();
    const fakeTarget = {
        sprite: {name: 'original'},
        isSprite: () => true
    };
    vm.runtime.getTargetById = () => (fakeTarget);
    vm.renameSprite('id', 'not-original');
    t.equal(fakeTarget.sprite.name, 'not-original');
    t.end();
});

test('renameSprite does not set sprite names to an empty string', t => {
    const vm = new VirtualMachine();
    const fakeTarget = {
        sprite: {name: 'original'},
        isSprite: () => true
    };
    vm.runtime.getTargetById = () => (fakeTarget);
    vm.renameSprite('id', '');
    t.equal(fakeTarget.sprite.name, 'original');
    t.end();
});

test('renameSprite does not set sprite names to reserved names', t => {
    const vm = new VirtualMachine();
    const fakeTarget = {
        sprite: {name: 'original'},
        isSprite: () => true
    };
    vm.runtime.getTargetById = () => (fakeTarget);
    vm.renameSprite('id', '_mouse_');
    t.equal(fakeTarget.sprite.name, 'original');
    t.end();
});

test('renameSprite increments from existing sprite names', t => {
    const vm = new VirtualMachine();
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

test('renameSprite does not increment when renaming to the same name', t => {
    const vm = new VirtualMachine();
    vm.emitTargetsUpdate = () => {};
    vm.runtime.targets = [{
        id: 'id1',
        isSprite: () => true,
        sprite: {
            name: 'this name'
        }
    }];
    vm.renameSprite('id1', 'this name');
    t.equal(vm.runtime.targets[0].sprite.name, 'this name');
    t.end();
});

test('renameSound sets the sound name', t => {
    const vm = new VirtualMachine();
    vm.editingTarget = {
        sprite: {
            sounds: [{name: 'first'}, {name: 'second'}]
        }
    };
    vm.renameSound(0, 'hello');
    t.equal(vm.editingTarget.sprite.sounds[0].name, 'hello');
    t.equal(vm.editingTarget.sprite.sounds[1].name, 'second');
    // Make sure renaming to same name doesn't increment
    vm.renameSound(0, 'hello');
    t.equal(vm.editingTarget.sprite.sounds[0].name, 'hello');
    // But renaming to used name does increment
    vm.renameSound(1, 'hello');
    t.equal(vm.editingTarget.sprite.sounds[1].name, 'hello2');
    t.end();
});

test('renameCostume sets the costume name', t => {
    const vm = new VirtualMachine();
    vm.editingTarget = {
        sprite: {
            costumes: [{name: 'first'}, {name: 'second'}]
        }
    };
    vm.renameCostume(0, 'hello');
    t.equal(vm.editingTarget.sprite.costumes[0].name, 'hello');
    t.equal(vm.editingTarget.sprite.costumes[1].name, 'second');
    // Make sure renaming to same name doesn't increment
    vm.renameCostume(0, 'hello');
    t.equal(vm.editingTarget.sprite.costumes[0].name, 'hello');
    // But renaming to used name does increment
    vm.renameCostume(1, 'hello');
    t.equal(vm.editingTarget.sprite.costumes[1].name, 'hello2');
    t.end();
});
