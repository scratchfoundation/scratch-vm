/**
 * @fileoverview
 * This integration test ensures that a local upload of a sb2 project pulls
 * in assets correctly (from the provided .sb2 file) even if the assets
 * are not present on our servers.
 */
const path = require('path');
const fs = require('fs');
const test = require('tap').test;
const AdmZip = require('adm-zip');
const ScratchStorage = require('scratch-storage');
const VirtualMachine = require('../../src/index');

const projectUri = path.resolve(__dirname, '../fixtures/offline-custom-assets.sb2');
const projectZip = AdmZip(projectUri);
const project = Buffer.from(fs.readFileSync(projectUri));
// Custom costume from sb2 file (which was downloaded from offline editor)
// This sound should not be available on our servers
const costume = projectZip.readFile('1.svg');
const costumeData = new Uint8Array(costume);
// Custom sound recording from sb2 file (which was downloaded from offline editor)
// This sound should not be available on our servers
const sound = projectZip.readFile('0.wav');
const soundData = new Uint8Array(sound);

test('offline-custom-assets', t => {
    const vm = new VirtualMachine();
    // Use a test storage here that does not have any web sources added to it.
    const testStorage = new ScratchStorage();
    vm.attachStorage(testStorage);

    // Evaluate playground data and exit
    vm.on('playgroundData', e => {
        const threads = JSON.parse(e.threads);
        t.ok(threads.length === 0);
        t.end();
        process.nextTick(process.exit);
    });

    // Start VM, load project, and run
    t.doesNotThrow(() => {
        vm.start();
        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);
        vm.loadProject(project).then(() => {

            // Verify initial state
            t.equals(vm.runtime.targets.length, 2);
            const costumes = vm.runtime.targets[1].getCostumes();
            t.equals(costumes.length, 1);
            const customCostume = costumes[0];
            t.equals(customCostume.name, 'A_Test_Costume');

            const storedCostume = customCostume.asset;
            t.type(storedCostume, 'object');
            t.deepEquals(storedCostume.data, costumeData);

            const sounds = vm.runtime.targets[1].sprite.sounds;
            t.equals(sounds.length, 1);
            const customSound = sounds[0];
            t.equals(customSound.name, 'A_Test_Recording');
            const storedSound = customSound.asset;
            t.type(storedSound, 'object');
            t.deepEquals(storedSound.data, soundData);

            vm.greenFlag();

            // After two seconds, get playground data and stop
            setTimeout(() => {
                vm.getPlaygroundData();
                vm.stopAll();
            }, 2000);
        });
    });

});
