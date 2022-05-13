/**
 * This test ensures that the VM gracefully handles an sb3 project with
 * a missing vector costume. The VM should handle this safely by displaying
 * a Gray Question Mark, but keeping track of the original costume data
 * and serializing the original costume data back out. The saved project.json
 * should not reflect that the costume is broken and should therefore re-attempt
 * to load the costume if the saved project is re-loaded.
 */
const path = require('path');
const tap = require('tap');
const makeTestStorage = require('../fixtures/make-test-storage');
const FakeRenderer = require('../fixtures/fake-renderer');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

const projectUri = path.resolve(__dirname, '../fixtures/missing_svg.sb3');
const project = readFileToBuffer(projectUri);

const missingCostumeAssetId = 'a267f8b97ee9cf8aa9832aa0b4cfd9eb';

let vm;

tap.beforeEach(() => {
    const storage = makeTestStorage();
    
    // This line removes the webhelper from the list of available helpers.
    // W/o the following line, this fails because storage doesn't handle the case
    // where none of the tools have isGetSupported: true
    // TODO: Remove this line when the related storage bug is resolved so that
    // storage gracefully handles non-browser situations where assets are missing.
    storage._helpers = [storage._helpers[0]];

    vm = new VirtualMachine();
    vm.attachStorage(storage);
    vm.attachRenderer(new FakeRenderer());

    return vm.loadProject(project);
});

const test = tap.test;

test('loading sb3 project with missing vector costume file', t => {
    t.equal(vm.runtime.targets.length, 2);
    
    const stage = vm.runtime.targets[0];
    t.ok(stage.isStage);

    const blueGuySprite = vm.runtime.targets[1];
    t.equal(blueGuySprite.getName(), 'Blue Square Guy');
    t.equal(blueGuySprite.getCostumes().length, 1);
    
    const missingCostume = blueGuySprite.getCostumes()[0];
    t.equal(missingCostume.name, 'costume1');
    // Costume should have both default cosutme (e.g. Gray Question Mark) data and original data
    const defaultVectorAssetId = vm.runtime.storage.defaultAssetId.ImageVector;
    t.equal(missingCostume.assetId, defaultVectorAssetId);
    t.equal(missingCostume.dataFormat, 'svg');
    // Runtime should have info about broken asset
    t.ok(missingCostume.broken);
    t.equal(missingCostume.broken.assetId, missingCostumeAssetId);

    t.end();
});

test('load and then save sb3 project with missing costume file', t => {
    const resavedProject = JSON.parse(vm.toJSON());

    t.equal(resavedProject.targets.length, 2);
    
    const stage = resavedProject.targets[0];
    t.ok(stage.isStage);

    const blueGuySprite = resavedProject.targets[1];
    t.equal(blueGuySprite.name, 'Blue Square Guy');
    t.equal(blueGuySprite.costumes.length, 1);
    
    const missingCostume = blueGuySprite.costumes[0];
    t.equal(missingCostume.name, 'costume1');
    // Costume should have both default cosutme (e.g. Gray Question Mark) data and original data
    t.equal(missingCostume.assetId, missingCostumeAssetId);
    t.equal(missingCostume.dataFormat, 'svg');
    // Test that we didn't save any data about the costume being broken
    t.notOk(missingCostume.broken);

    t.end();
    process.nextTick(process.exit);
});
