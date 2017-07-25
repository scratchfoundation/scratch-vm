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

test('emitWorkspaceUpdate', t => {
    const vm = new VirtualMachine();
    vm.runtime.targets = [
        {
            isStage: true,
            variables: {
                global: {
                    toXML: () => 'global'
                }
            }
        }, {
            variables: {
                unused: {
                    toXML: () => 'unused'
                }
            }
        }, {
            variables: {
                local: {
                    toXML: () => 'local'
                }
            },
            blocks: {
                toXML: () => 'blocks'
            }
        }
    ];
    vm.editingTarget = vm.runtime.targets[2];

    let xml = null;
    vm.emit = (event, data) => (xml = data.xml);
    vm.emitWorkspaceUpdate();
    t.notEqual(xml.indexOf('global'), -1);
    t.notEqual(xml.indexOf('local'), -1);
    t.equal(xml.indexOf('unused'), -1);
    t.notEqual(xml.indexOf('blocks'), -1);
    t.end();
});
