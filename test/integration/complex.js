var fs = require('fs');
var path = require('path');
var test = require('tap').test;
var extract = require('../fixtures/extract');
var VirtualMachine = require('../../src/index');

var projectUri = path.resolve(__dirname, '../fixtures/complex.sb2');
var project = extract(projectUri);

var spriteUri = path.resolve(__dirname, '../fixtures/sprite.json');
var sprite = fs.readFileSync(spriteUri, 'utf8');

test('complex', function (t) {
    var vm = new VirtualMachine();

    // Evaluate playground data and exit
    vm.on('playgroundData', function (e) {
        var threads = JSON.parse(e.threads);
        t.ok(threads.length === 0);
        t.end();
        process.nextTick(process.exit);
    });

    // Manipulate each target
    vm.on('targetsUpdate', function (data) {
        var targets = data.targetList;
        for (var i in targets) {
            if (targets[i].isStage === true) continue;
            if (targets[i].name === 'test') continue;

            vm.setEditingTarget(targets[i].id);
            vm.renameSprite(targets[i].id, 'test');
            vm.postSpriteInfo({
                x: 0,
                y: 10,
                direction: 90,
                rotationStyle: 'all around',
                visible: true
            });
            vm.addCostume({
                costumeName: 'costume1',
                baseLayerID: 0,
                baseLayerMD5: 'f9a1c175dbe2e5dee472858dd30d16bb.svg',
                bitmapResolution: 1,
                rotationCenterX: 47,
                rotationCenterY: 55
            });
        }
    });

    // Start VM, load project, and run
    t.doesNotThrow(function () {
        vm.start();
        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);
        vm.loadProject(project);
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
        vm.addSprite2(sprite);

        // Add backdrop
        vm.addBackdrop({
            costumeName: 'baseball-field',
            baseLayerID: 26,
            baseLayerMD5: '6b3d87ba2a7f89be703163b6c1d4c964.png',
            bitmapResolution: 2,
            rotationCenterX: 480,
            rotationCenterY: 360
        });
    });

    // After two seconds, get playground data and stop
    setTimeout(function () {
        vm.getPlaygroundData();
        vm.stopAll();
    }, 2000);
});
