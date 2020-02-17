const path = require('path');
const test = require('tap').test;
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

const projectUri = path.resolve(__dirname, '../fixtures/list-monitor-rename.sb3');
const project = readFileToBuffer(projectUri);

test('importing sb3 project with incorrect list monitor name', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Evaluate playground data and exit
    vm.on('playgroundData', () => {
        const stage = vm.runtime.targets[0];

        // Global list named "renamed" exists
        const variableId = Object.keys(stage.variables).find(k => stage.variables[k].name === 'renamed');
        const monitorRecord = vm.runtime._monitorState.get(variableId);
        const monitorBlock = vm.runtime.monitorBlocks.getBlock(variableId);
        t.equal(monitorRecord.opcode, 'data_listcontents');

        // The list name should be properly set to "renamed"
        t.equal(monitorRecord.params.LIST, 'renamed');
        t.equal(monitorBlock.fields.LIST.value, 'renamed');

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
