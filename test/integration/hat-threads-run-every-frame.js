const path = require('path');
const test = require('tap').test;
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');
const Thread = require('../../src/engine/thread');
const Runtime = require('../../src/engine/runtime');

const projectUri = path.resolve(__dirname, '../fixtures/loudness-hat-block.sb2');
const project = readFileToBuffer(projectUri);

const checkIsHatThread = (t, vm, hatThread) => {
    t.equal(hatThread.stackClick, false);
    t.equal(hatThread.updateMonitor, false);
    const blockContainer = hatThread.target.blocks;
    const opcode = blockContainer.getOpcode(blockContainer.getBlock(hatThread.topBlock));
    t.assert(vm.runtime.getIsEdgeActivatedHat(opcode));
};

const checkIsStackClickThread = (t, vm, stackClickThread) => {
    t.equal(stackClickThread.stackClick, true);
    t.equal(stackClickThread.updateMonitor, false);
};

/**
 * loudness-hat-block.sb2 contains a single stack
 *     when loudness > 10
 *         change color effect by 25
 * The intention is to make sure that the hat block condition is evaluated
 * on each frame.
 */
test('edge activated hat thread runs once every frame', t => {
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

            vm.runtime._step();
            t.equal(vm.runtime.threads.length, 1);
            checkIsHatThread(t, vm, vm.runtime.threads[0]);
            t.assert(vm.runtime.threads[0].status === Thread.STATUS_DONE);

            // Check that the hat thread is added again when another step is taken
            vm.runtime._step();
            t.equal(vm.runtime.threads.length, 1);
            checkIsHatThread(t, vm, vm.runtime.threads[0]);
            t.assert(vm.runtime.threads[0].status === Thread.STATUS_DONE);
            t.end();
        });
    });
});

/**
 * If the hat doesn't finish evaluating within one frame, it shouldn't be added again
 * on the next frame. (We skip execution by setting the step time to 0)
 */
test('edge activated hat thread not added twice', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    t.doesNotThrow(() => {
        // Note: don't run vm.start(), we handle calling _step() manually in this test
        vm.runtime.currentStepTime = 0;
        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);

        vm.loadProject(project).then(() => {
            t.equal(vm.runtime.threads.length, 0);

            vm.runtime._step();
            t.equal(vm.runtime.threads.length, 1);
            const prevThread = vm.runtime.threads[0];
            checkIsHatThread(t, vm, vm.runtime.threads[0]);
            t.assert(vm.runtime.threads[0].status === Thread.STATUS_RUNNING);

            // Check that no new threads are added when another step is taken
            vm.runtime._step();
            // There should now be one done hat thread and one new hat thread to run
            t.equal(vm.runtime.threads.length, 1);
            checkIsHatThread(t, vm, vm.runtime.threads[0]);
            t.assert(vm.runtime.threads[0] === prevThread);
            t.end();
        });
    });
});

/**
 * When adding a stack click thread first, make sure that the edge activated hat thread and
 * the stack click thread are both pushed and run (despite having the same top block)
 */
test('edge activated hat thread does not interrupt stack click thread', t => {
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

            vm.runtime._step();
            t.equal(vm.runtime.threads.length, 1);
            checkIsHatThread(t, vm, vm.runtime.threads[0]);
            t.assert(vm.runtime.threads[0].status === Thread.STATUS_DONE);

            // Add stack click thread on this hat
            vm.runtime.toggleScript(vm.runtime.threads[0].topBlock, {stackClick: true});

            // Check that the hat thread is added again when another step is taken
            vm.runtime._step();
            t.equal(vm.runtime.threads.length, 2);
            let hatThread;
            let stackClickThread;
            if (vm.runtime.threads[0].stackClick) {
                stackClickThread = vm.runtime.threads[0];
                hatThread = vm.runtime.threads[1];
            } else {
                stackClickThread = vm.runtime.threads[1];
                hatThread = vm.runtime.threads[0];
            }
            checkIsHatThread(t, vm, hatThread);
            checkIsStackClickThread(t, vm, stackClickThread);
            t.assert(vm.runtime.threads[0].status === Thread.STATUS_DONE);
            t.assert(vm.runtime.threads[1].status === Thread.STATUS_DONE);
            t.end();
        });
    });
});

/**
 * When adding the hat thread first, make sure that the edge activated hat thread and
 * the stack click thread are both pushed and run (despite having the same top block)
 */
test('edge activated hat thread does not interrupt stack click thread', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    t.doesNotThrow(() => {
        // Note: don't run vm.start(), we handle calling _step() manually in this test
        vm.runtime.currentStepTime = 0;
        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);

        vm.loadProject(project).then(() => {
            t.equal(vm.runtime.threads.length, 0);

            vm.runtime._step();
            t.equal(vm.runtime.threads.length, 1);
            checkIsHatThread(t, vm, vm.runtime.threads[0]);
            t.assert(vm.runtime.threads[0].status === Thread.STATUS_RUNNING);

            vm.runtime.currentStepTime = Runtime.THREAD_STEP_INTERVAL;

            // Add stack click thread on this hat
            vm.runtime.toggleScript(vm.runtime.threads[0].topBlock, {stackClick: true});

            // Check that the hat thread is added again when another step is taken
            vm.runtime._step();
            t.equal(vm.runtime.threads.length, 2);
            let hatThread;
            let stackClickThread;
            if (vm.runtime.threads[0].stackClick) {
                stackClickThread = vm.runtime.threads[0];
                hatThread = vm.runtime.threads[1];
            } else {
                stackClickThread = vm.runtime.threads[1];
                hatThread = vm.runtime.threads[0];
            }
            checkIsHatThread(t, vm, hatThread);
            checkIsStackClickThread(t, vm, stackClickThread);
            t.assert(vm.runtime.threads[0].status === Thread.STATUS_DONE);
            t.assert(vm.runtime.threads[1].status === Thread.STATUS_DONE);
            t.end();
        });
    });
});
