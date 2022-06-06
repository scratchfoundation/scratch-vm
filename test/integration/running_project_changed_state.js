const path = require('path');
const test = require('tap').test;
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

const uri = path.resolve(__dirname, '../fixtures/looks.sb2');
const project = readFileToBuffer(uri);

test('Running project should not emit project changed event', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    let projectChanged = false;
    vm.on('PROJECT_CHANGED', () => {
        projectChanged = true;
    });

    // Evaluate playground data and exit
    vm.on('playgroundData', () => {
        t.equal(projectChanged, false);
        vm.quit();
        t.end();
    });

    // Start VM, load project, and run
    t.doesNotThrow(() => {
        vm.start();
        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);
        vm.loadProject(project).then(() => {
            // The test in unit/project_load_changed_state.js tests
            // that loading a project does not emit a project changed
            // event. This setup tries to be agnostic of whether that
            // test is passing or failing.
            projectChanged = false;

            vm.greenFlag();

            // After two seconds, get playground data and stop
            setTimeout(() => {
                vm.getPlaygroundData();
                vm.stopAll();
            }, 2000);
        });
    });
});
