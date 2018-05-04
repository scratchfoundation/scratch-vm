const path = require('path');
const test = require('tap').test;
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;

const VirtualMachine = require('../../src/virtual-machine');
const RenderedTarget = require('../../src/sprites/rendered-target');

const projectUri = path.resolve(__dirname, '../fixtures/default.sb2');
const project = readFileToBuffer(projectUri);

const vm = new VirtualMachine();

test('spec', t => {
    t.type(vm.addSprite, 'function');
    t.end();
});

test('default cat', t => {
    // Get default cat from .sprite2
    const uri = path.resolve(__dirname, '../fixtures/example_sprite.sprite2');
    const sprite = readFileToBuffer(uri);

    vm.attachStorage(makeTestStorage());

    // Evaluate playground data and exit
    vm.on('playgroundData', e => {
        const threads = JSON.parse(e.threads);
        t.ok(threads.length === 0);
        t.end();
        process.nextTick(process.exit);
    });

    vm.start();
    vm.clear();
    vm.setCompatibilityMode(false);
    vm.setTurboMode(false);
    t.doesNotThrow(() => {
        vm.loadProject(project).then(() => {

            t.equal(vm.runtime.targets.length, 2); // stage and default sprite

            // Add another sprite
            vm.addSprite(sprite).then(() => {
                const targets = vm.runtime.targets;

                // Test
                t.type(targets, 'object');
                t.equal(targets.length, 3);

                const newTarget = targets[2];

                t.ok(newTarget instanceof RenderedTarget);
                t.type(newTarget.id, 'string');
                t.type(newTarget.blocks, 'object');
                t.type(newTarget.variables, 'object');
                const varIds = Object.keys(newTarget.variables);
                t.type(varIds.length, 1);
                const variable = newTarget.variables[varIds[0]];
                t.equal(variable.name, 'foo');
                t.equal(variable.value, 0);

                t.equal(newTarget.isOriginal, true);
                t.equal(newTarget.currentCostume, 0);
                t.equal(newTarget.isOriginal, true);
                t.equal(newTarget.isStage, false);
                t.equal(newTarget.sprite.name, 'Apple');

                vm.greenFlag();

                setTimeout(() => {
                    t.equal(variable.value, 10);
                    vm.getPlaygroundData();
                    vm.stopAll();
                }, 1000);
            });
        });
    });
});
