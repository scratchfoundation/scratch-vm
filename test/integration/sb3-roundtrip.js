const test = require('tap').test;

const Blocks = require('../../src/engine/blocks');
const Clone = require('../../src/util/clone');
const {loadCostume} = require('../../src/import/load-costume');
const {loadSound} = require('../../src/import/load-sound');
const makeTestStorage = require('../fixtures/make-test-storage');
const Runtime = require('../../src/engine/runtime');
const sb3 = require('../../src/serialization/sb3');
const Sprite = require('../../src/sprites/sprite');

const defaultCostumeInfo = {
    bitmapResolution: 1,
    rotationCenterX: 0,
    rotationCenterY: 0
};

const defaultSoundInfo = {
};

test('sb3-roundtrip', t => {
    const runtime1 = new Runtime();
    runtime1.attachStorage(makeTestStorage());

    const runtime2 = new Runtime();
    runtime2.attachStorage(makeTestStorage());

    const testRuntimeState = (label, runtime) => {
        t.strictEqual(runtime.targets.length, 2, `${label}: target count`);
        const [stageClone, spriteClone] = runtime.targets;

        t.strictEqual(stageClone.isOriginal, true);
        t.strictEqual(stageClone.isStage, true);

        const stage = stageClone.sprite;
        t.strictEqual(stage.name, 'Stage');
        t.strictEqual(stage.clones.length, 1);
        t.strictEqual(stage.clones[0], stageClone);

        t.strictEqual(stage.costumes.length, 1);
        const [building] = stage.costumes;
        t.strictEqual(building.assetId, 'fe5e3566965f9de793beeffce377d054');
        t.strictEqual(building.dataFormat, 'jpg');

        t.strictEqual(stage.sounds.length, 0);

        t.strictEqual(spriteClone.isOriginal, true);
        t.strictEqual(spriteClone.isStage, false);

        const sprite = spriteClone.sprite;
        t.strictEqual(sprite.name, 'Sprite');
        t.strictEqual(sprite.clones.length, 1);
        t.strictEqual(sprite.clones[0], spriteClone);

        t.strictEqual(sprite.costumes.length, 2);
        const [cat, squirrel] = sprite.costumes;
        t.strictEqual(cat.assetId, 'f88bf1935daea28f8ca098462a31dbb0');
        t.strictEqual(cat.dataFormat, 'svg');
        t.strictEqual(squirrel.assetId, '7e24c99c1b853e52f8e7f9004416fa34');
        t.strictEqual(squirrel.dataFormat, 'png');

        t.strictEqual(sprite.sounds.length, 1);
        const [meow] = sprite.sounds;
        t.strictEqual(meow.md5, '83c36d806dc92327b9e7049a565c6bff.wav');
    };

    const loadThings = Promise.all([
        loadCostume('fe5e3566965f9de793beeffce377d054.jpg', Clone.simple(defaultCostumeInfo), runtime1),
        loadCostume('f88bf1935daea28f8ca098462a31dbb0.svg', Clone.simple(defaultCostumeInfo), runtime1),
        loadCostume('7e24c99c1b853e52f8e7f9004416fa34.png', Clone.simple(defaultCostumeInfo), runtime1),
        loadSound(Object.assign({md5: '83c36d806dc92327b9e7049a565c6bff.wav'}, defaultSoundInfo), runtime1)
    ]);

    const installThings = loadThings.then(results => {
        const [building, cat, squirrel, meow] = results;

        const stageBlocks = new Blocks();
        const stage = new Sprite(stageBlocks, runtime1);
        stage.name = 'Stage';
        stage.costumes = [building];
        stage.sounds = [];
        const stageClone = stage.createClone();
        stageClone.isStage = true;

        const spriteBlocks = new Blocks();
        const sprite = new Sprite(spriteBlocks, runtime1);
        sprite.name = 'Sprite';
        sprite.costumes = [cat, squirrel];
        sprite.sounds = [meow];
        const spriteClone = sprite.createClone();

        runtime1.targets = [stageClone, spriteClone];

        testRuntimeState('original', runtime1);
    });

    const serializeAndDeserialize = installThings.then(() => {
        // Doing a JSON `stringify` and `parse` here more accurately simulate a save/load cycle. In particular:
        // 1. it ensures that any non-serializable data is thrown away, and
        // 2. `sb3.deserialize` and its helpers do some `hasOwnProperty` checks which fail on the object returned by
        //    `sb3.serialize` but succeed if that object is "flattened" in this way.
        const serializedState = JSON.parse(JSON.stringify(sb3.serialize(runtime1)));
        return sb3.deserialize(serializedState, runtime2);
    });

    return serializeAndDeserialize.then(({targets}) => {
        runtime2.targets = targets;
        testRuntimeState('copy', runtime2);
    });
});
