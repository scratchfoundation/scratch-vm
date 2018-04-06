const Worker = require('tiny-worker');
const path = require('path');
const test = require('tap').test;
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');
const dispatch = require('../../src/dispatch/central-dispatch');

const uri = path.resolve(__dirname, '../fixtures/saythink-and-wait.sb2');
const project = readFileToBuffer(uri);

// By default Central Dispatch works with the Worker class built into the browser. Tell it to use TinyWorker instead.
dispatch.workerClass = Worker;

test('say/think and wait', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    t.doesNotThrow(() => {
        vm.start();
        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);
        vm.loadProject(project).then(() => {
            vm.greenFlag();

            // After two seconds, stop the project.
            // The test will fail if the project throws.
            setTimeout(() => {
                vm.stopAll();
                t.end();
                process.nextTick(process.exit);
            }, 2000);
        });
    });
});
