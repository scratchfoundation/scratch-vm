const test = require('tap').test;

const RenderedTarget = require('../../src/sprites/rendered-target');
const Sprite = require('../../src/sprites/sprite');
const VirtualMachine = require('../../src/virtual-machine');

test('collectAssets', t => {
    const vm = new VirtualMachine();
    const sprite = new Sprite(null, vm.runtime);
    const target = new RenderedTarget(sprite, vm.runtime);
    vm.runtime.targets = [target];
    const [
        soundAsset1,
        soundAsset2,
        costumeAsset1
    ] = [{assetId: 1}, {assetId: 2}, {assetId: 3}];
    sprite.sounds = [{id: 1, asset: soundAsset1}, {id: 2, asset: soundAsset2}];
    sprite.costumes = [{id: 1, asset: costumeAsset1}];
    const assets = vm.assets;
    t.type(assets.length, 'number');
    t.equal(assets.length, 3);
    t.deepEqual(assets, [soundAsset1, soundAsset2, costumeAsset1]);
    t.end();
});
