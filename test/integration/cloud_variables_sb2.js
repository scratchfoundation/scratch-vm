const path = require('path');
const test = require('tap').test;
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

const cloudVarSimpleUri = path.resolve(__dirname, '../fixtures/cloud_variables_simple.sb2');
const cloudVarLimitUri = path.resolve(__dirname, '../fixtures/cloud_variables_limit.sb2');
const cloudVarExceededLimitUri = path.resolve(__dirname, '../fixtures/cloud_variables_exceeded_limit.sb2');
const cloudVarLocalUri = path.resolve(__dirname, '../fixtures/cloud_variables_local.sb2');

const cloudVarSimple = readFileToBuffer(cloudVarSimpleUri);
const cloudVarLimit = readFileToBuffer(cloudVarLimitUri);
const cloudVarExceededLimit = readFileToBuffer(cloudVarExceededLimitUri);
const cloudVarLocal = readFileToBuffer(cloudVarLocalUri);

test('importing an sb2 project with cloud variables', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    vm.start();
    vm.clear();
    vm.setCompatibilityMode(false);
    vm.setTurboMode(false);
    vm.loadProject(cloudVarSimple).then(() => {
        t.equal(vm.runtime.hasCloudData(), true);

        const stage = vm.runtime.targets[0];
        const stageVars = Object.values(stage.variables);
        t.equal(stageVars.length, 1);

        const variable = stageVars[0];
        t.equal(variable.name, '☁ firstCloud');
        t.equal(Number(variable.value), 100); // Though scratch 2 requires
        // cloud variables to be numbers, this is something that happens
        // when the message is being sent to the server rather than on the client
        t.equal(variable.isCloud, true);

        t.end();
    });
});

test('importing an sb2 project with cloud variables at the limit for a project', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    vm.start();
    vm.clear();
    vm.setCompatibilityMode(false);
    vm.setTurboMode(false);
    vm.loadProject(cloudVarLimit).then(() => {
        t.equal(vm.runtime.hasCloudData(), true);

        const stage = vm.runtime.targets[0];
        const stageVars = Object.values(stage.variables);

        t.equal(stageVars.length, 10);
        // All of the 8 stage variables should be cloud variables
        t.equal(stageVars.filter(v => v.isCloud).length, 10);

        t.end();
    });
});

test('importing an sb2 project with cloud variables exceeding the limit for a project', t => {
    // This tests a hacked project where additional cloud variables exceeding
    // the project limit have been added.
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    vm.start();
    vm.clear();
    vm.setCompatibilityMode(false);
    vm.setTurboMode(false);
    vm.loadProject(cloudVarExceededLimit).then(() => {
        t.equal(vm.runtime.hasCloudData(), true);

        const stage = vm.runtime.targets[0];
        const stageVars = Object.values(stage.variables);

        t.equal(stageVars.length, 15);
        // Only 8 of the variables should have the isCloud flag set to true
        t.equal(stageVars.filter(v => v.isCloud).length, 10);

        t.end();
    });
});

test('importing one project after the other resets cloud variable limit', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    vm.start();
    vm.clear();
    vm.setCompatibilityMode(false);
    vm.setTurboMode(false);
    vm.loadProject(cloudVarExceededLimit).then(() => {
        t.equal(vm.runtime.canAddCloudVariable(), false);

        vm.loadProject(cloudVarSimple).then(() => {
            const stage = vm.runtime.targets[0];
            const stageVars = Object.values(stage.variables);
            t.equal(stageVars.length, 1);

            const variable = stageVars[0];
            t.equal(variable.name, '☁ firstCloud');
            t.equal(Number(variable.value), 100); // Though scratch 2 requires
            // cloud variables to be numbers, this is something that happens
            // when the message is being sent to the server rather than on the client
            t.equal(variable.isCloud, true);

            t.equal(vm.runtime.canAddCloudVariable(), true);

            t.end();
        });
    });
});

test('local cloud variables get imported as regular variables', t => {
    // This tests a hacked project where a sprite-local variable is
    // has the cloud variable flag set.
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    vm.start();
    vm.clear();
    vm.setCompatibilityMode(false);
    vm.setTurboMode(false);
    vm.loadProject(cloudVarLocal).then(() => {
        t.equal(vm.runtime.hasCloudData(), false);

        const stage = vm.runtime.targets[0];
        const stageVars = Object.values(stage.variables);

        t.equal(stageVars.length, 0);

        const sprite = vm.runtime.targets[1];
        const spriteVars = Object.values(sprite.variables);

        t.equal(spriteVars.length, 1);
        t.equal(spriteVars[0].isCloud, false);

        t.end();

        process.nextTick(process.exit); // This is needed because this is the end of the last test in this file!!!
    });
});
