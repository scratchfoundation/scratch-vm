const path = require('path');
const test = require('tap').test;
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;

const VirtualMachine = require('../../src/virtual-machine');
// const RenderedTarget = require('../../src/sprites/rendered-target');

const projectUri = path.resolve(__dirname, '../fixtures/default.sb2');
const project = readFileToBuffer(projectUri);

const vm = new VirtualMachine();

test('spec', t => {
    t.type(vm.deleteSprite, 'function');
    t.end();
});

test('default cat', t => {
    // Get default cat from .sprite2
    // const uri = path.resolve(__dirname, '../fixtures/example_sprite.sprite2');
    // const sprite = readFileToBuffer(uri);

    vm.attachStorage(makeTestStorage());

    // Evaluate playground data and exit
    vm.on('playgroundData', e => {
        const threads = JSON.parse(e.threads);
        t.ok(threads.length === 0);
        vm.quit();
        t.end();
    });

    vm.start();
    vm.clear();
    vm.setCompatibilityMode(false);
    vm.setTurboMode(false);
    t.doesNotThrow(() => {
        vm.loadProject(project).then(() => {

            t.equal(vm.runtime.targets.length, 2); // stage and default sprite

            const defaultSprite = vm.runtime.targets[1];

            // Delete the sprite
            const addSpriteBack = vm.deleteSprite(vm.runtime.targets[1].id);

            t.equal(vm.runtime.targets.length, 1);

            t.type(addSpriteBack, 'function');

            addSpriteBack().then(() => {
                t.equal(vm.runtime.targets.length, 2);
                t.equal(vm.runtime.targets[1].getName(), defaultSprite.getName());

                vm.greenFlag();

                setTimeout(() => {
                    vm.getPlaygroundData();
                    vm.stopAll();
                }, 1000);
            });
        });
    });
});
