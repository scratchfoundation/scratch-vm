const tap = require('tap');
const path = require('path');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const makeTestStorage = require('../fixtures/make-test-storage');
const VirtualMachine = require('../../src/virtual-machine');

let vm;
let projectChanged;

tap.beforeEach(() => {
    const projectUri = path.resolve(__dirname, '../fixtures/default.sb2');
    const project = readFileToBuffer(projectUri);

    vm = new VirtualMachine();

    vm.runtime.addListener('PROJECT_CHANGED', () => {
        projectChanged = true;
    });

    vm.attachStorage(makeTestStorage());
    return vm.loadProject(project).then(() => {
        // The test in project_load_changed_state.js tests
        // that loading a project does not emit a project changed
        // event. This setup tries to be agnostic of whether that
        // test is passing or failing.
        projectChanged = false;
    });
});

tap.tearDown(() => process.nextTick(process.exit));

const test = tap.test;

test('Adding a sprite (from sprite2) should emit a project changed event', t => {
    const sprite2Uri = path.resolve(__dirname, '../fixtures/cat.sprite2');
    const sprite2 = readFileToBuffer(sprite2Uri);

    vm.addSprite(sprite2).then(() => {
        t.equal(projectChanged, true);
        t.end();
    });
});

test('Adding a sprite (from sprite3) should emit a project changed event', t => {
    const sprite3Uri = path.resolve(__dirname, '../fixtures/cat.sprite3');
    const sprite3 = readFileToBuffer(sprite3Uri);

    vm.addSprite(sprite3).then(() => {
        t.equal(projectChanged, true);
        t.end();
    });
});

test('Adding a costume should emit a project changed event', t => {
    const newCostume = {
        name: 'costume1',
        baseLayerID: 0,
        baseLayerMD5: 'f9a1c175dbe2e5dee472858dd30d16bb.svg',
        bitmapResolution: 1,
        rotationCenterX: 47,
        rotationCenterY: 55
    };

    vm.addCostume('f9a1c175dbe2e5dee472858dd30d16bb.svg', newCostume).then(() => {
        t.equal(projectChanged, true);
        t.end();
    });
});

test('Adding a costume from library should emit a project changed event', t => {
    const newCostume = {
        name: 'costume1',
        baseLayerID: 0,
        baseLayerMD5: 'f9a1c175dbe2e5dee472858dd30d16bb.svg',
        bitmapResolution: 1,
        rotationCenterX: 47,
        rotationCenterY: 55
    };

    vm.addCostumeFromLibrary('f9a1c175dbe2e5dee472858dd30d16bb.svg', newCostume).then(() => {
        t.equal(projectChanged, true);
        t.end();
    });
});

test('Adding a backdrop should emit a project changed event', t => {
    const newCostume = {
        name: 'costume1',
        baseLayerID: 0,
        baseLayerMD5: 'f9a1c175dbe2e5dee472858dd30d16bb.svg',
        bitmapResolution: 1,
        rotationCenterX: 47,
        rotationCenterY: 55
    };

    vm.addBackdrop('f9a1c175dbe2e5dee472858dd30d16bb.svg', newCostume).then(() => {
        t.equal(projectChanged, true);
        t.end();
    });
});

test('Adding a sound should emit a project changed event', t => {
    const newSound = {
        soundName: 'meow',
        soundID: 0,
        md5: '83c36d806dc92327b9e7049a565c6bff.wav',
        sampleCount: 18688,
        rate: 22050
    };

    vm.addSound(newSound).then(() => {
        t.equal(projectChanged, true);
        t.end();
    });
});

test('Deleting a sprite should emit a project changed event', t => {
    const spriteId = vm.editingTarget.id;

    vm.deleteSprite(spriteId);
    t.equal(projectChanged, true);
    t.end();
});

test('Deleting a costume should emit a project changed event', t => {
    vm.deleteCostume(0);

    t.equal(projectChanged, true);
    t.end();
});

test('Deleting a sound should emit a project changed event', t => {
    vm.deleteSound(0);

    t.equal(projectChanged, true);
    t.end();
});

test('Reordering a sprite should emit a project changed event', t => {
    const sprite3Uri = path.resolve(__dirname, '../fixtures/cat.sprite3');
    const sprite3 = readFileToBuffer(sprite3Uri);

    // Add a new sprite so we have 2 to reorder
    vm.addSprite(sprite3).then(() => {
        // Reset the project changed flag to ignore change from adding new sprite
        projectChanged = false;
        t.equal(vm.runtime.targets.filter(target => !target.isStage).length, 2);
        vm.reorderTarget(2, 1);
        t.equal(projectChanged, true);
        t.end();
    });
});

test('Reordering a costume should emit a project changed event', t => {
    t.equal(vm.editingTarget.sprite.costumes.length, 2);
    const spriteId = vm.editingTarget.id;
    const reordered = vm.reorderCostume(spriteId, 1, 0);
    t.equal(reordered, true);
    t.equal(projectChanged, true);
    t.end();
});

test('Reordering a sound should emit a project changed event', t => {
    const spriteId = vm.editingTarget.id;
    const newSound = {
        soundName: 'meow',
        soundID: 0,
        md5: '83c36d806dc92327b9e7049a565c6bff.wav',
        sampleCount: 18688,
        rate: 22050
    };
    vm.addSound(newSound).then(() => {
        // Reset the project changed flag to ignore change from adding new sound
        projectChanged = false;
        t.equal(vm.editingTarget.sprite.sounds.length, 2);
        const reordered = vm.reorderSound(spriteId, 1, 0);
        t.equal(reordered, true);
        t.equal(projectChanged, true);
        t.end();
    });
});

test('Renaming a sprite should emit a project changed event', t => {
    const spriteId = vm.editingTarget.id;
    vm.renameSprite(spriteId, 'My Sprite');
    t.equal(projectChanged, true);
    t.end();
});

test('Renaming a costume should emit a project changed event', t => {
    vm.renameCostume(0, 'My Costume');
    t.equal(projectChanged, true);
    t.end();
});

test('Renaming a sound should emit a project changed event', t => {
    vm.renameSound(0, 'My Sound');

    t.equal(projectChanged, true);
    t.end();
});

test('Changing sprite info should emit a project changed event', t => {
    const newSpritePosition = {
        x: 10,
        y: 100
    };

    vm.postSpriteInfo(newSpritePosition);
    t.equal(projectChanged, true);
    projectChanged = false;

    const newSpriteDirection = {
        direction: -30
    };

    vm.postSpriteInfo(newSpriteDirection);
    t.equal(projectChanged, true);
    projectChanged = false;

    t.end();

});

test('Editing a vector costume should emit a project changed event', t => {
    const mockSvg = 'svg';
    const mockRotationX = -13;
    const mockRotationY = 25;

    vm.updateSvg(0, mockSvg, mockRotationX, mockRotationY);
    t.equal(projectChanged, true);
    t.end();
});

test('Editing a sound should emit a project changed event', t => {
    const mockSoundBuffer = [];
    const mockSoundEncoding = [];

    vm.updateSoundBuffer(0, mockSoundBuffer, mockSoundEncoding);
    t.equal(projectChanged, true);
    t.end();
});
