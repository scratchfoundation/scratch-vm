const tap = require('tap');
const path = require('path');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const makeTestStorage = require('../fixtures/make-test-storage');
const VirtualMachine = require('../../src/virtual-machine');

tap.tearDown(() => process.nextTick(process.exit));

const test = tap.test;

// Test that loading a project does not emit a project change
// This is in its own file so that it does not affect the test setup
// and results of the other project changed state tests
test('Loading a project should not emit a project changed event', t => {
    const projectUri = path.resolve(__dirname, '../fixtures/default.sb2');
    const project = readFileToBuffer(projectUri);

    const vm = new VirtualMachine();

    let projectChanged = false;
    vm.runtime.addListener('PROJECT_CHANGED', () => {
        projectChanged = true;
    });

    vm.attachStorage(makeTestStorage());
    return vm.loadProject(project).then(() => {
        t.equal(projectChanged, false);
        t.end();
    });
});
