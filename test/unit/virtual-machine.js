const test = require('tap').test;
const VirtualMachine = require('../../src/virtual-machine.js');
const Sprite = require('../../src/sprites/sprite.js');

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

test('deleteSprite throws when used on a non-sprite target', t => {
    const vm = new VirtualMachine();
    vm.runtime.targets = [{
        id: 'id',
        isSprite: () => false
    }];
    t.throws(
        (() => vm.deleteSprite('id')),
        new Error('Cannot delete non-sprite targets.')
    );
    t.end();
});

test('deleteSprite throws when there is no sprite for the given target', t => {
    const vm = new VirtualMachine();
    vm.runtime.targets = [{
        id: 'id',
        isSprite: () => true,
        sprite: null
    }];
    t.throws(
        (() => vm.deleteSprite('id')),
        new Error('No sprite associated with this target.')
    );
    t.end();
});

test('deleteSprite throws when there is no target with given id', t => {
    const vm = new VirtualMachine();
    vm.runtime.targets = [{
        id: 'id',
        isSprite: () => true,
        sprite: {
            name: 'this name'
        }
    }];
    t.throws(
        (() => vm.deleteSprite('id1')),
        new Error('No target with the provided id.')
    );
    t.end();
});

test('deleteSprite deletes a sprite when given id is associated with a known sprite', t => {
    const vm = new VirtualMachine();
    const spr = new Sprite(null, vm.runtime);
    const currTarget = spr.createClone();

    vm.runtime.targets = [currTarget];

    t.equal(currTarget.sprite.clones.length, 1);
    vm.deleteSprite(currTarget.id);
    t.equal(currTarget.sprite.clones.length, 0);
    t.end();
});

// eslint-disable-next-line max-len
test('deleteSprite sets editing target as null when given sprite is current editing target, and the only target in the runtime', t => {
    const vm = new VirtualMachine();
    const spr = new Sprite(null, vm.runtime);
    const currTarget = spr.createClone();

    vm.editingTarget = currTarget;
    vm.runtime.targets = [currTarget];

    vm.deleteSprite(currTarget.id);

    t.equal(vm.runtime.targets.length, 0);
    t.equal(vm.editingTarget, null);
    t.end();
});

// eslint-disable-next-line max-len
test('deleteSprite updates editingTarget when sprite being deleted is current editing target, and there is another target in the runtime', t => {
    const vm = new VirtualMachine();
    const spr1 = new Sprite(null, vm.runtime);
    const spr2 = new Sprite(null, vm.runtime);
    const currTarget = spr1.createClone();
    const otherTarget = spr2.createClone();

    vm.emitWorkspaceUpdate = () => null;

    vm.runtime.targets = [currTarget, otherTarget];
    vm.editingTarget = currTarget;

    t.equal(vm.runtime.targets.length, 2);
    vm.deleteSprite(currTarget.id);
    t.equal(vm.runtime.targets.length, 1);
    t.equal(vm.editingTarget.id, otherTarget.id);

    // now let's try them in the other order in the runtime.targets list

    // can't reuse deleted targets
    const currTarget2 = spr1.createClone();
    const otherTarget2 = spr2.createClone();

    vm.runtime.targets = [otherTarget2, currTarget2];
    vm.editingTarget = currTarget2;

    t.equal(vm.runtime.targets.length, 2);
    vm.deleteSprite(currTarget2.id);
    t.equal(vm.editingTarget.id, otherTarget2.id);
    t.equal(vm.runtime.targets.length, 1);

    t.end();
});

test('duplicateSprite throws when there is no target with given id', t => {
    const vm = new VirtualMachine();
    vm.runtime.targets = [{
        id: 'id',
        isSprite: () => true,
        sprite: {
            name: 'this name'
        }
    }];
    t.throws(
        (() => vm.duplicateSprite('id1')),
        new Error('No target with the provided id')
    );
    t.end();
});

test('duplicateSprite throws when used on a non-sprite target', t => {
    const vm = new VirtualMachine();
    vm.runtime.targets = [{
        id: 'id',
        isSprite: () => false
    }];
    t.throws(
        (() => vm.duplicateSprite('id')),
        new Error('Cannot duplicate non-sprite targets.')
    );
    t.end();
});

test('duplicateSprite throws when there is no sprite for the given target', t => {
    const vm = new VirtualMachine();
    vm.runtime.targets = [{
        id: 'id',
        isSprite: () => true,
        sprite: null
    }];
    t.throws(
        (() => vm.duplicateSprite('id')),
        new Error('No sprite associated with this target.')
    );
    t.end();
});

test('duplicateSprite duplicates a sprite when given id is associated with known sprite', t => {
    const vm = new VirtualMachine();
    const spr = new Sprite(null, vm.runtime);
    const currTarget = spr.createClone();
    vm.editingTarget = currTarget;

    vm.emitWorkspaceUpdate = () => null;

    vm.runtime.targets = [currTarget];
    t.equal(vm.runtime.targets.length, 1);
    vm.duplicateSprite(currTarget.id).then(() => {
        t.equal(vm.runtime.targets.length, 2);
        t.end();
    });

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
