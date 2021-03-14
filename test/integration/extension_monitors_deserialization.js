const path = require('path');
const test = require('tap').test;
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

const uri = path.resolve(__dirname, '../fixtures/extension_monitors_deserialization.sb3');
const project = readFileToBuffer(uri);

test('hidden extension monitors should not be deserialized', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Evaluate playground data and exit
    vm.on('playgroundData', () => {
        const monitors = vm.runtime.getMonitorState();
        // Variable monitor should be deserialized, as it is not extension monitor
        t.ok(monitors.some(monitor => monitor.mode === 'large' && monitor.opcode === 'data_variable'));
        // Tempo monitor should be deserialized, as it is visible
        t.ok(monitors.some(monitor => monitor.opcode === 'music_getTempo'));
        // Language monitor should NOT be deserialized
        t.notOk(monitors.some(monitor => monitor.opcode === 'translate_getViewerLanguage'));
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
            setTimeout(() => {
                vm.getPlaygroundData();
                vm.stopAll();
            }, 100);
        });
    });
});
