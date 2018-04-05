const path = require('path');
const test = require('tap').test;
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');
const Thread = require('../../src/engine/thread');
const Runtime = require('../../src/engine/runtime');

const projectUri = path.resolve(__dirname, '../fixtures/default.sb2');
const project = readFileToBuffer(projectUri);

const checkMonitorThreadPresent = (t, threads) => {
    t.equal(threads.length, 1);
    const monitorThread = threads[0];
    t.equal(monitorThread.stackClick, false);
    t.equal(monitorThread.updateMonitor, true);
    t.equal(monitorThread.topBlock.toString(), 'sensing_timer');
};

/**
 * Creates a monitor and then checks if it gets run every frame.
 */
/* TODO: when loadProject loads monitors, we can create a project with a monitor and will
 * not have to do the create monitor step manually.
 */
test('monitor thread runs every frame', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    t.doesNotThrow(() => {
        // Note: don't run vm.start(), we handle calling _step() manually in this test
        vm.runtime.currentStepTime = Runtime.THREAD_STEP_INTERVAL;

        // Manually populate the monitor block and set its isMonitored to true.
        vm.runtime.monitorBlocks.createBlock({
            id: 'sensing_timer',
            opcode: 'sensing_timer',
            inputs: {},
            fields: {},
            next: null,
            topLevel: true,
            parent: null,
            shadow: false,
            isMonitored: true,
            x: '0',
            y: '0'
        });

        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);

        vm.loadProject(project).then(() => {
            t.equal(vm.runtime.threads.length, 0);

            vm.runtime._step();
            checkMonitorThreadPresent(t, vm.runtime.threads);
            t.assert(vm.runtime.threads[0].status === Thread.STATUS_DONE);

            // Check that both are added again when another step is taken
            vm.runtime._step();
            checkMonitorThreadPresent(t, vm.runtime.threads);
            t.assert(vm.runtime.threads[0].status === Thread.STATUS_DONE);
            t.end();
        });
    });
});

/**
 * If the monitor doesn't finish evaluating within one frame, it shouldn't be added again
 * on the next frame. (We skip execution by setting the step time to 0)
 */
test('monitor thread not added twice', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    t.doesNotThrow(() => {
        // Note: don't run vm.start(), we handle calling _step() manually in this test
        vm.runtime.currentStepTime = 0;

        // Manually populate the monitor block and set its isMonitored to true.
        vm.runtime.monitorBlocks.createBlock({
            id: 'sensing_timer',
            opcode: 'sensing_timer',
            inputs: {},
            fields: {},
            next: null,
            topLevel: true,
            parent: null,
            shadow: false,
            isMonitored: true,
            x: '0',
            y: '0'
        });

        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);

        vm.loadProject(project).then(() => {
            t.equal(vm.runtime.threads.length, 0);

            vm.runtime._step();
            checkMonitorThreadPresent(t, vm.runtime.threads);
            t.assert(vm.runtime.threads[0].status === Thread.STATUS_RUNNING);
            const prevThread = vm.runtime.threads[0];

            // Check that both are added again when another step is taken
            vm.runtime._step();
            checkMonitorThreadPresent(t, vm.runtime.threads);
            t.equal(vm.runtime.threads[0], prevThread);
            t.end();
        });
    });
});
