/**
 * This test mocks render breaking on loading a sprite2 with a
 * corrupted bitmap costume.
 * The VM should handle this safely by displaying a Gray Question Mark,
 * but keeping track of the original costume data and serializing the
 * original costume data back out. The saved project.json should not
 * reflect that the costume is broken and should therefore re-attempt
 * to load the costume if the saved project is re-loaded.
 */
const path = require('path');
const tap = require('tap');
const md5 = require('js-md5');
const makeTestStorage = require('../fixtures/make-test-storage');
const FakeRenderer = require('../fixtures/fake-renderer');
const FakeBitmapAdapter = require('../fixtures/fake-bitmap-adapter');
const {extractAsset, readFileToBuffer} = require('../fixtures/readProjectFile');
const VirtualMachine = require('../../src/index');
const {serializeCostumes} = require('../../src/serialization/serialize-assets');

const projectUri = path.resolve(__dirname, '../fixtures/default.sb3');
const project = readFileToBuffer(projectUri);

const spriteUri = path.resolve(__dirname, '../fixtures/corrupt_png.sprite2');
const sprite = readFileToBuffer(spriteUri);

const costumeFileName = '0.png';
const originalCostume = extractAsset(spriteUri, costumeFileName);
// We need to get the actual md5 because we hand modified the png to corrupt it
// after we downloaded the project from Scratch
// Loading the project back into the VM will correct the assetId and md5
const brokenCostumeMd5 = md5(originalCostume);

global.Image = function () {
    const image = {
        width: 1,
        height: 1
    };
    setTimeout(() => {
        const base64Image = image.src.split(',')[1];
        const decodedText = Buffer.from(base64Image, 'base64').toString();
        if (decodedText.includes('Here is some')) {
            image.onerror();
        } else {
            image.onload();
        }
    }, 1000);
    return image;
};

global.document = {
    createElement: () => ({
        // Create mock canvas
        getContext: () => ({
            drawImage: () => ({})
        })
    })
};

let vm;
let defaultBitmapAssetId;

tap.beforeEach(() => {
    const storage = makeTestStorage();

    vm = new VirtualMachine();
    vm.attachStorage(storage);
    defaultBitmapAssetId = vm.runtime.storage.defaultAssetId.ImageBitmap;

    vm.attachRenderer(new FakeRenderer());
    vm.attachV2BitmapAdapter(new FakeBitmapAdapter());

    return vm.loadProject(project).then(() => vm.addSprite(sprite));
});

const test = tap.test;

test('load sprite2 with corrupted bitmap costume file', t => {
    t.equal(vm.runtime.targets.length, 3);
    
    const stage = vm.runtime.targets[0];
    t.ok(stage.isStage);

    const greenGuySprite = vm.runtime.targets[2];
    t.equal(greenGuySprite.getName(), 'GreenGuy');
    t.equal(greenGuySprite.getCostumes().length, 1);
    
    const corruptedCostume = greenGuySprite.getCostumes()[0];
    t.equal(corruptedCostume.name, 'GreenGuy');
    t.equal(corruptedCostume.assetId, defaultBitmapAssetId);
    t.equal(corruptedCostume.dataFormat, 'png');
    // Runtime should have info about broken asset
    t.ok(corruptedCostume.broken);
    t.equal(corruptedCostume.broken.assetId, brokenCostumeMd5);
    // Verify that we saved the original asset data
    t.equal(md5(corruptedCostume.broken.asset.data), brokenCostumeMd5);

    t.end();
});

test('load and then save sprite with corrupted costume file', t => {
    const resavedSprite = JSON.parse(vm.toJSON(vm.runtime.targets[2].id));

    t.equal(resavedSprite.name, 'GreenGuy');
    t.equal(resavedSprite.costumes.length, 1);
    
    const corruptedCostume = resavedSprite.costumes[0];
    t.equal(corruptedCostume.name, 'GreenGuy');
    // Resaved project costume should have the metadata that corresponds to the original broken costume
    t.equal(corruptedCostume.assetId, brokenCostumeMd5);
    t.equal(corruptedCostume.dataFormat, 'png');
    // Test that we didn't save any data about the costume being broken
    t.notOk(corruptedCostume.broken);

    t.end();
});

test('serializeCostume saves orignal broken costume', t => {
    const costumeDescs = serializeCostumes(vm.runtime, vm.runtime.targets[2].id);
    t.equal(costumeDescs.length, 1);
    const costume = costumeDescs[0];
    t.equal(costume.fileName, `${brokenCostumeMd5}.png`);
    t.equal(md5(costume.fileContent), brokenCostumeMd5);
    t.end();
    process.nextTick(process.exit);
});
