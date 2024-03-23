const path = require('path');
const test = require('tap').test;
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');
const Runtime = require('../../src/engine/runtime');

const projectUri = path.resolve(__dirname, '../fixtures/warped-broadcasts.sb3');
const project = readFileToBuffer(projectUri);

test('broadcasts in warp procedures ', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    t.doesNotThrow(() => {
        // Note: don't run vm.start(), we handle calling _step() manually in this test
        vm.runtime.currentStepTime = Runtime.THREAD_STEP_INTERVAL;
        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);

        vm.loadProject(project).then(() => {
            t.equal(vm.runtime.threads.length, 0);
            
            vm.greenFlag();
            t.equal(vm.runtime.threads.length, 1);
            vm.runtime._step();
            t.equal(vm.runtime.threads.length, 0);
            t.equal(vm.runtime._lastStepDoneThreads.length, 2);

            t.end();
        });
    });
});
