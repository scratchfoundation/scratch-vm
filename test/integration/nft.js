const Worker = require('tiny-worker');
const path = require('path');
const test = require('tap').test;

const VirtualMachine = require('../../src/index');
const dispatch = require('../../src/dispatch/central-dispatch');

const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;

const uri = path.resolve(__dirname, '../fixtures/nft.sb3');
const project = readFileToBuffer(uri);

// By default Central Dispatch works with the Worker class built into the browser. Tell it to use TinyWorker instead.
dispatch.workerClass = Worker;

test('nft', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Evaluate playground data and exit
    vm.on('playgroundData', () => {
        // @todo Additional tests
        vm.quit();
        t.end();
    });

    // Start VM, load project, and run
    t.doesNotThrow(() => {
        vm.start();
        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);
        vm.loadProject(project)
            .then(() => {
                vm.greenFlag();

                // After two seconds, get playground data and stop
                setTimeout(() => {
                    vm.getPlaygroundData();
                    vm.stopAll();
                }, 2000);
            });
    });
});
