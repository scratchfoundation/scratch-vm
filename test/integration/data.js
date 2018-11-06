const path = require('path');
const test = require('tap').test;
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

const uri = path.resolve(__dirname, '../fixtures/data.sb2');
const project = readFileToBuffer(uri);

test('data', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Evaluate playground data and exit
    vm.on('playgroundData', () => {
        // @todo Additional tests
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
            vm.greenFlag();

            // After two seconds, get playground data and stop
            setTimeout(() => {
                vm.getPlaygroundData();
                vm.stopAll();
            }, 2000);
        });
    });
});
