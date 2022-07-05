const fs = require('fs');
const path = require('path');
const test = require('tap').test;
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

const projectUri = path.resolve(__dirname, '../fixtures/complex.sb2');
const project = readFileToBuffer(projectUri);

const spriteUri = path.resolve(__dirname, '../fixtures/sprite.json');
const sprite = fs.readFileSync(spriteUri, 'utf8');

test('complex', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Evaluate playground data and exit
    vm.on('playgroundData', e => {
        const threads = JSON.parse(e.threads);
        t.ok(threads.length === 0);
        vm.quit();
        t.end();
    });

    // Manipulate each target
    vm.on('targetsUpdate', data => {
        const targets = data.targetList;
        for (const i in targets) {
            if (targets[i].isStage === true) continue;
            if (targets[i].name.match(/test/)) continue;

            vm.setEditingTarget(targets[i].id);
            vm.renameSprite(targets[i].id, 'test');
            vm.postSpriteInfo({
                x: 0,
                y: 10,
                direction: 90,
                draggable: true,
                rotationStyle: 'all around',
                visible: true
            });
            vm.addCostume(
                'f9a1c175dbe2e5dee472858dd30d16bb.svg',
                {
                    name: 'costume1',
                    baseLayerID: 0,
                    baseLayerMD5: 'f9a1c175dbe2e5dee472858dd30d16bb.svg',
                    bitmapResolution: 1,
                    rotationCenterX: 47,
                    rotationCenterY: 55
                }
            );
        }
    });

    // Start VM, load project, and run
    t.doesNotThrow(() => {
        vm.start();
        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);
        vm.loadProject(project).then(() => {
            vm.greenFlag();

            // Post IO data
            vm.postIOData('mouse', {
                isDown: true,
                x: 0,
                y: 10,
                canvasWidth: 100,
                canvasHeight: 100
            });

            // Add sprite
            vm.addSprite(sprite);

            // Add backdrop
            vm.addBackdrop(
                '6b3d87ba2a7f89be703163b6c1d4c964.png',
                {
                    name: 'baseball-field',
                    baseLayerID: 26,
                    baseLayerMD5: '6b3d87ba2a7f89be703163b6c1d4c964.png',
                    bitmapResolution: 2,
                    rotationCenterX: 480,
                    rotationCenterY: 360
                }
            );

            // After two seconds, get playground data and stop
            setTimeout(() => {
                vm.getPlaygroundData();
                vm.stopAll();
            }, 2000);
        });
    });

});
