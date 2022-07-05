const path = require('path');
const test = require('tap').test;
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

const projectUri = path.resolve(__dirname, '../fixtures/clone-cleanup.sb2');
const project = readFileToBuffer(projectUri);

test('clone-cleanup', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    /**
     * Track which step of the project is currently under test.
     * @type {number}
     */
    let testStep = -1;

    const verifyCounts = (expectedClones, extraThreads) => {
        // stage plus one sprite, plus clones
        t.strictEqual(vm.runtime.targets.length, 2 + expectedClones,
            `target count at step ${testStep}`);

        // the stage should never have any clones
        t.strictEqual(vm.runtime.targets[0].sprite.clones.length, 1,
            `stage clone count at step ${testStep}`);

        // check sprite clone count (+1 for original)
        t.strictEqual(vm.runtime.targets[1].sprite.clones.length, 1 + expectedClones,
            `sprite clone count at step ${testStep}`);

        // thread count isn't directly tied to clone count since threads can end
        t.strictEqual(vm.runtime.threads.length, extraThreads + (2 * expectedClones),
            `thread count at step ${testStep}`);
    };

    const testNextStep = () => {
        ++testStep;
        switch (testStep) {
        case 0:
            // Project has started, main thread running, no clones yet
            verifyCounts(0, 1);
            break;

        case 1:
            // 10 clones have been created, main thread still running
            verifyCounts(10, 1);
            break;

        case 2:
            // The first batch of clones has deleted themselves; main thread still running
            verifyCounts(0, 1);
            break;

        case 3:
            // The second batch of clones has been created and the main thread is about to end
            verifyCounts(10, 1);

            // After the main thread ends, do one last test step
            setTimeout(() => testNextStep(), 1000);
            break;

        case 4:
            // The second batch of clones has deleted themselves; everything is finished
            verifyCounts(0, 0);

            vm.quit();
            t.end();
            break;
        }
    };

    // Start VM, load project, and run
    t.doesNotThrow(() => {
        vm.start();
        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);
        vm.loadProject(project).then(() => {

            // Verify initial state: no clones, nothing running ("step -1")
            verifyCounts(0, 0);

            vm.greenFlag();

            // Let the project control the pace of the tests
            vm.runtime.on('SAY', () => testNextStep());
        });
    });

});
