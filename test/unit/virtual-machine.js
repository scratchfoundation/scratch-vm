const test = require('tap').test;
const VirtualMachine = require('../../src/virtual-machine.js');
const Sprite = require('../../src/sprites/sprite.js');
const Variable = require('../../src/engine/variable.js');
const events = require('../fixtures/events.json');

test('addSprite throws on invalid string', t => {
    const vm = new VirtualMachine();
    vm.addSprite('this is not a sprite')
        .catch(e => {
            t.equal(e.startsWith('Sprite Upload Error:'), true);
            t.end();
        });
});

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

    const spr1 = new Sprite(null, vm.runtime);
    const target1 = spr1.createClone();
    const spr2 = new Sprite(null, vm.runtime);
    const target2 = spr2.createClone();

    vm.runtime.targets = [target1, target2];
    vm.renameSprite(target1.id, 'foo');
    t.equal(vm.runtime.targets[0].sprite.name, 'foo');
    vm.renameSprite(target2.id, 'foo');
    t.equal(vm.runtime.targets[1].sprite.name, 'foo2');
    t.end();
});

test('renameSprite does not increment when renaming to the same name', t => {
    const vm = new VirtualMachine();
    vm.emitTargetsUpdate = () => {};

    const spr = new Sprite(null, vm.runtime);
    spr.name = 'foo';
    const target = spr.createClone();

    vm.runtime.targets = [target];

    t.equal(vm.runtime.targets[0].sprite.name, 'foo');
    vm.renameSprite(target.id, 'foo');
    t.equal(vm.runtime.targets[0].sprite.name, 'foo');

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

test('duplicateSprite assigns duplicated sprite a fresh name', t => {
    const vm = new VirtualMachine();
    const spr = new Sprite(null, vm.runtime);
    spr.name = 'sprite1';
    const currTarget = spr.createClone();
    vm.editingTarget = currTarget;

    vm.emitWorkspaceUpdate = () => null;

    vm.runtime.targets = [currTarget];
    t.equal(vm.runtime.targets.length, 1);
    vm.duplicateSprite(currTarget.id).then(() => {
        t.equal(vm.runtime.targets.length, 2);
        t.equal(vm.runtime.targets[0].sprite.name, 'sprite1');
        t.equal(vm.runtime.targets[1].sprite.name, 'sprite2');
        t.end();
    });

});

test('reorderCostume', t => {
    const vm = new VirtualMachine();
    vm.emitTargetsUpdate = () => {};

    const spr = new Sprite(null, vm.runtime);
    spr.name = 'foo';
    const target = spr.createClone();

    // Stub out reorder on target, tested in rendered-target tests.
    // Just want to know if it is called with the right params.
    let costumeIndex = null;
    let newIndex = null;
    target.reorderCostume = (_costumeIndex, _newIndex) => {
        costumeIndex = _costumeIndex;
        newIndex = _newIndex;
        return true; // Do not need all the logic about if a reorder occurred.
    };

    vm.runtime.targets = [target];

    t.equal(vm.reorderCostume('not-a-target', 0, 3), false);
    t.equal(costumeIndex, null);
    t.equal(newIndex, null);

    t.equal(vm.reorderCostume(target.id, 0, 3), true);
    t.equal(costumeIndex, 0);
    t.equal(newIndex, 3);

    t.end();
});

test('reorderSound', t => {
    const vm = new VirtualMachine();
    vm.emitTargetsUpdate = () => {};

    const spr = new Sprite(null, vm.runtime);
    spr.name = 'foo';
    const target = spr.createClone();

    // Stub out reorder on target, tested in rendered-target tests.
    // Just want to know if it is called with the right params.
    let soundIndex = null;
    let newIndex = null;
    target.reorderSound = (_soundIndex, _newIndex) => {
        soundIndex = _soundIndex;
        newIndex = _newIndex;
        return true; // Do not need all the logic about if a reorder occurred.
    };

    vm.runtime.targets = [target];

    t.equal(vm.reorderSound('not-a-target', 0, 3), false);
    t.equal(soundIndex, null); // Make sure reorder function was not called somehow.
    t.equal(newIndex, null);

    t.equal(vm.reorderSound(target.id, 0, 3), true);
    t.equal(soundIndex, 0); // Make sure reorder function was called correctly.
    t.equal(newIndex, 3);

    t.end();
});

test('shareCostumeToTarget', t => {
    const vm = new VirtualMachine();
    const spr1 = new Sprite(null, vm.runtime);
    spr1.name = 'foo';
    const target1 = spr1.createClone();
    const costume1 = {name: 'costume1'};
    target1.addCostume(costume1);

    const spr2 = new Sprite(null, vm.runtime);
    spr2.name = 'foo';
    const target2 = spr2.createClone();
    const costume2 = {name: 'another costume'};
    target2.addCostume(costume2);

    vm.runtime.targets = [target1, target2];
    vm.editingTarget = vm.runtime.targets[0];
    vm.emitWorkspaceUpdate = () => null;

    vm.shareCostumeToTarget(0, target2.id).then(() => {
        t.equal(target2.currentCostume, 1);
        t.equal(target2.getCostumes()[1].name, 'costume1');
        t.end();
    });
});

test('shareSoundToTarget', t => {
    const vm = new VirtualMachine();
    const spr1 = new Sprite(null, vm.runtime);
    spr1.name = 'foo';
    const target1 = spr1.createClone();
    const sound1 = {name: 'sound1'};
    target1.addSound(sound1);

    const spr2 = new Sprite(null, vm.runtime);
    spr2.name = 'foo';
    const target2 = spr2.createClone();
    const sound2 = {name: 'another sound'};
    target2.addSound(sound2);

    vm.runtime.targets = [target1, target2];
    vm.editingTarget = vm.runtime.targets[0];
    vm.emitWorkspaceUpdate = () => null;

    vm.shareSoundToTarget(0, target2.id).then(() => {
        t.equal(target2.getSounds()[1].name, 'sound1');
        t.end();
    });
});

test('reorderTarget', t => {
    const vm = new VirtualMachine();
    vm.emitTargetsUpdate = () => {};

    vm.runtime.targets = ['a', 'b', 'c', 'd'];

    t.equal(vm.reorderTarget(2, 2), false);
    t.deepEqual(vm.runtime.targets, ['a', 'b', 'c', 'd']);

    // Make sure clamping works
    t.equal(vm.reorderTarget(-100, -5), false);
    t.deepEqual(vm.runtime.targets, ['a', 'b', 'c', 'd']);

    // Reorder upwards
    t.equal(vm.reorderTarget(0, 2), true);
    t.deepEqual(vm.runtime.targets, ['b', 'c', 'a', 'd']);

    // Reorder downwards
    t.equal(vm.reorderTarget(3, 1), true);
    t.deepEqual(vm.runtime.targets, ['b', 'd', 'c', 'a']);

    t.end();
});

test('emitWorkspaceUpdate', t => {
    const vm = new VirtualMachine();
    const blocksToXML = comments => {
        let blockString = 'blocks\n';
        if (comments) {
            for (const commentId in comments) {
                const comment = comments[commentId];
                blockString += `A Block Comment: ${comment.toXML()}`;
            }

        }
        return blockString;
    };
    vm.runtime.targets = [
        {
            isStage: true,
            variables: {
                global: {
                    toXML: () => 'global'
                }
            },
            blocks: {
                toXML: blocksToXML
            },
            comments: {
                aStageComment: {
                    toXML: () => 'aStageComment',
                    blockId: null
                }
            }
        }, {
            variables: {
                unused: {
                    toXML: () => 'unused'
                }
            },
            blocks: {
                toXML: blocksToXML
            },
            comments: {
                someBlockComment: {
                    toXML: () => 'someBlockComment',
                    blockId: 'someBlockId'
                }
            }
        }, {
            variables: {
                local: {
                    toXML: () => 'local'
                }
            },
            blocks: {
                toXML: blocksToXML
            },
            comments: {
                someOtherComment: {
                    toXML: () => 'someOtherComment',
                    blockId: null
                },
                aBlockComment: {
                    toXML: () => 'aBlockComment',
                    blockId: 'a block'
                }
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
    t.equal(xml.indexOf('aStageComment'), -1);
    t.equal(xml.indexOf('someBlockComment'), -1);
    t.notEqual(xml.indexOf('someOtherComment'), -1);
    t.notEqual(xml.indexOf('A Block Comment: aBlockComment'), -1);
    t.end();
});

test('drag IO redirect', t => {
    const vm = new VirtualMachine();
    const sprite1Info = [];
    const sprite2Info = [];
    vm.runtime.targets = [
        {
            id: 'sprite1',
            postSpriteInfo: data => sprite1Info.push(data)
        }, {
            id: 'sprite2',
            postSpriteInfo: data => sprite2Info.push(data),
            startDrag: () => {},
            stopDrag: () => {}
        }
    ];
    vm.editingTarget = vm.runtime.targets[0];
    // Stub emitWorkspace/TargetsUpdate, it needs data we don't care about here
    vm.emitWorkspaceUpdate = () => null;
    vm.emitTargetsUpdate = () => null;

    // postSpriteInfo should go to the editing target by default``
    vm.postSpriteInfo('sprite1 info');
    t.equal(sprite1Info[0], 'sprite1 info');

    // postSprite info goes to the drag target if it exists
    vm.startDrag('sprite2');
    vm.postSpriteInfo('sprite2 info');
    t.equal(sprite2Info[0], 'sprite2 info');

    // stop drag should set the editing target
    vm.stopDrag('sprite2');
    t.equal(vm.editingTarget.id, 'sprite2');

    // Then postSpriteInfo should continue posting to the new editing target
    vm.postSpriteInfo('sprite2 info 2');
    t.equal(sprite2Info[1], 'sprite2 info 2');
    t.end();
});

test('select original after dragging clone', t => {
    const vm = new VirtualMachine();
    let newEditingTargetId = null;
    vm.setEditingTarget = id => {
        newEditingTargetId = id;
    };
    vm.runtime.targets = [
        {
            id: 'sprite1_clone',
            sprite: {clones: [{id: 'sprite1_original'}]},
            stopDrag: () => {}
        }, {
            id: 'sprite2',
            stopDrag: () => {}
        }
    ];

    // Stop drag on a bare target selects that target
    vm.stopDrag('sprite2');
    t.equal(newEditingTargetId, 'sprite2');

    // Stop drag on target with parent sprite selects the 0th clone of that sprite
    vm.stopDrag('sprite1_clone');
    t.equal(newEditingTargetId, 'sprite1_original');
    t.end();
});

test('setVariableValue', t => {
    const vm = new VirtualMachine();
    const spr = new Sprite(null, vm.runtime);
    const target = spr.createClone();
    target.createVariable('a-variable', 'a-name', Variable.SCALAR_TYPE);

    vm.runtime.targets = [target];

    // Returns false if there is no variable to set
    t.equal(vm.setVariableValue(target.id, 'not-a-variable', 100), false);

    // Returns false if there is no target with that id
    t.equal(vm.setVariableValue('not-a-target', 'a-variable', 100), false);

    // Returns true and updates the value if variable is present
    t.equal(vm.setVariableValue(target.id, 'a-variable', 100), true);
    t.equal(target.lookupVariableById('a-variable').value, 100);

    t.end();
});

test('getVariableValue', t => {
    const vm = new VirtualMachine();
    const spr = new Sprite(null, vm.runtime);
    const target = spr.createClone();
    target.createVariable('a-variable', 'a-name', Variable.SCALAR_TYPE);

    vm.runtime.targets = [target];

    // Returns null if there is no variable with that id
    t.equal(vm.getVariableValue(target.id, 'not-a-variable'), null);

    // Returns null if there is no variable with that id
    t.equal(vm.getVariableValue('not-a-target', 'a-variable'), null);

    // Returns true and updates the value if variable is present
    t.equal(vm.getVariableValue(target.id, 'a-variable'), 0);
    vm.setVariableValue(target.id, 'a-variable', 'string');
    t.equal(vm.getVariableValue(target.id, 'a-variable'), 'string');

    t.end();
});

// Block Listener tests for comment
test('comment_create event updates comment with null position', t => {
    const vm = new VirtualMachine();
    const spr = new Sprite(null, vm.runtime);
    const target = spr.createClone();

    target.createComment('a comment', null, 'some text',
        null, null, 200, 300, false);
    vm.runtime.targets = [target];
    vm.editingTarget = target;
    vm.runtime.setEditingTarget(target);

    const comment = target.comments['a comment'];
    t.equal(comment.x, null);
    t.equal(comment.y, null);

    vm.blockListener(events.createcommentUpdatePosition);

    t.equal(comment.x, 10);
    t.equal(comment.y, 20);

    t.end();
});
