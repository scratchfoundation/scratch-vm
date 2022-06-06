/**
 * This test ensures that the VM gracefully handles an sb3 project with
 * a missing sound. The project should load without error.
 * TODO: handle missing or corrupted sounds by replacing the missing sound data
 * with the empty sound file but keeping the info about the original missing / corrupted sound
 * so that user data does not get overwritten / lost.
 */
const path = require('path');
const tap = require('tap');
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');
const {serializeSounds} = require('../../src/serialization/serialize-assets');

const projectUri = path.resolve(__dirname, '../fixtures/missing_sound.sb3');
const project = readFileToBuffer(projectUri);

const missingSoundAssetId = '78618aadd225b1db7bf837fa17dc0568';

let vm;

tap.beforeEach(() => {
    const storage = makeTestStorage();

    vm = new VirtualMachine();
    vm.attachStorage(storage);

    return vm.loadProject(project);
});

const test = tap.test;

test('loading sb3 project with missing sound file', t => {
    t.equal(vm.runtime.targets.length, 2);

    const stage = vm.runtime.targets[0];
    t.ok(stage.isStage);

    const catSprite = vm.runtime.targets[1];
    t.equal(catSprite.getSounds().length, 1);

    const missingSound = catSprite.getSounds()[0];
    t.equal(missingSound.name, 'Boop Sound Recording');
    // Sound should have original data but no asset
    const defaultSoundAssetId = vm.runtime.storage.defaultAssetId.Sound;
    t.equal(missingSound.assetId, defaultSoundAssetId);
    t.equal(missingSound.dataFormat, 'wav');

    // Runtime should have info about broken asset
    t.ok(missingSound.broken);
    t.equal(missingSound.broken.assetId, missingSoundAssetId);

    t.end();
});

test('load and then save sb3 project with missing sound file', t => {
    const resavedProject = JSON.parse(vm.toJSON());

    t.equal(resavedProject.targets.length, 2);

    const stage = resavedProject.targets[0];
    t.ok(stage.isStage);

    const catSprite = resavedProject.targets[1];
    t.equal(catSprite.name, 'Sprite1');
    t.equal(catSprite.sounds.length, 1);

    const missingSound = catSprite.sounds[0];
    t.equal(missingSound.name, 'Boop Sound Recording');
    // Costume should have both default sound data (e.g. "Gray Question Sound" ^_^) and original data
    t.equal(missingSound.assetId, missingSoundAssetId);
    t.equal(missingSound.dataFormat, 'wav');
    // Test that we didn't save any data about the costume being broken
    t.notOk(missingSound.broken);

    t.end();
});

test('serializeCostume does not save data for missing costume', t => {
    const soundDescs = serializeSounds(vm.runtime);

    t.equal(soundDescs.length, 1); // Should only have one sound, the pop sound for the stage
    t.not(soundDescs[0].fileName, `${missingSoundAssetId}.wav`);

    t.end();
});
