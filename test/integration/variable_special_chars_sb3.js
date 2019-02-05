const path = require('path');
const test = require('tap').test;
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');
const Variable = require('../../src/engine/variable');
const StringUtil = require('../../src/util/string-util');
const VariableUtil = require('../../src/util/variable-util');

const projectUri = path.resolve(__dirname, '../fixtures/variable_characters.sb3');
const project = readFileToBuffer(projectUri);

test('importing sb2 project with special chars in variable names', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Evaluate playground data and exit
    vm.on('playgroundData', e => {
        const threads = JSON.parse(e.threads);
        // All monitors should create threads that finish during the step and
        // are revoved from runtime.threads.
        t.equal(threads.length, 0);

        // we care that the last step updated the right number of monitors
        // we don't care whether the last step ran other threads or not
        const lastStepUpdatedMonitorThreads = vm.runtime._lastStepDoneThreads.filter(thread => thread.updateMonitor);
        t.equal(lastStepUpdatedMonitorThreads.length, 3);

        t.equal(vm.runtime.targets.length, 3);

        const stage = vm.runtime.targets[0];
        const cat = vm.runtime.targets[1];
        const bananas = vm.runtime.targets[2];

        const allVarListFields = VariableUtil.getAllVarRefsForTargets(vm.runtime.targets);

        const abVarId = Object.keys(stage.variables).filter(k => stage.variables[k].name === 'a&b')[0];
        const abVar = stage.variables[abVarId];
        const abMonitor = vm.runtime._monitorState.get(abVarId);
        // Check for unsafe characters, replaceUnsafeChars should just result in the original string
        // (e.g. there was nothing to replace)
        // Check that the variable ID does not have any unsafe characters
        t.equal(StringUtil.replaceUnsafeChars(abVarId), abVarId);
        // Check that the monitor record ID does not have any unsafe characters
        t.equal(StringUtil.replaceUnsafeChars(abMonitor.id), abMonitor.id);

        // Check that the variable still has the correct info
        t.equal(StringUtil.replaceUnsafeChars(abVar.id), abVar.id);
        t.equal(abVar.id, abVarId);
        t.equal(abVar.type, Variable.LIST_TYPE);
        t.equal(abVar.value[0], 'thing');
        t.equal(abVar.value[1], 'thing\'1');

        // Find all the references for this list, and verify they have the correct ID
        // There should be 3 fields, 2 on the stage, and one on the cat
        t.equal(allVarListFields[abVarId].length, 3);
        const stageBlocks = Object.keys(stage.blocks._blocks).map(blockId => stage.blocks._blocks[blockId]);
        const stageListBlocks = stageBlocks.filter(block => block.fields.hasOwnProperty('LIST'));
        t.equal(stageListBlocks.length, 2);
        t.equal(stageListBlocks[0].fields.LIST.id, abVarId);
        t.equal(stageListBlocks[1].fields.LIST.id, abVarId);
        const catBlocks = Object.keys(cat.blocks._blocks).map(blockId => cat.blocks._blocks[blockId]);
        const catListBlocks = catBlocks.filter(block => block.fields.hasOwnProperty('LIST'));
        t.equal(catListBlocks.length, 1);
        t.equal(catListBlocks[0].fields.LIST.id, abVarId);

        const fooVarId = Object.keys(stage.variables).filter(k => stage.variables[k].name === '"foo')[0];
        const fooVar = stage.variables[fooVarId];
        const fooMonitor = vm.runtime._monitorState.get(fooVarId);
        // Check for unsafe characters, replaceUnsafeChars should just result in the original string
        // (e.g. there was nothing to replace)
        // Check that the variable ID does not have any unsafe characters
        t.equal(StringUtil.replaceUnsafeChars(fooVarId), fooVarId);
        // Check that the monitor record ID does not have any unsafe characters
        t.equal(StringUtil.replaceUnsafeChars(fooMonitor.id), fooMonitor.id);

        // Check that the variable still has the correct info
        t.equal(StringUtil.replaceUnsafeChars(fooVar.id), fooVar.id);
        t.equal(fooVar.id, fooVarId);
        t.equal(fooVar.type, Variable.SCALAR_TYPE);
        t.equal(fooVar.value, 'foo');

        // Find all the references for this variable, and verify they have the correct ID
        // There should be only two, one on the stage and one on bananas
        t.equal(allVarListFields[fooVarId].length, 2);
        const stageVarBlocks = stageBlocks.filter(block => block.fields.hasOwnProperty('VARIABLE'));
        t.equal(stageVarBlocks.length, 1);
        t.equal(stageVarBlocks[0].fields.VARIABLE.id, fooVarId);
        const catVarBlocks = catBlocks.filter(block => block.fields.hasOwnProperty('VARIABLE'));
        t.equal(catVarBlocks.length, 1);
        t.equal(catVarBlocks[0].fields.VARIABLE.id, fooVarId);

        const ltPerfectVarId = Object.keys(bananas.variables).filter(k => bananas.variables[k].name === '< Perfect')[0];
        const ltPerfectVar = bananas.variables[ltPerfectVarId];
        const ltPerfectMonitor = vm.runtime._monitorState.get(ltPerfectVarId);
        // Check for unsafe characters, replaceUnsafeChars should just result in the original string
        // (e.g. there was nothing to replace)
        // Check that the variable ID does not have any unsafe characters
        t.equal(StringUtil.replaceUnsafeChars(ltPerfectVarId), ltPerfectVarId);
        // Check that the monitor record ID does not have any unsafe characters
        t.equal(StringUtil.replaceUnsafeChars(ltPerfectMonitor.id), ltPerfectMonitor.id);

        // Check that the variable still has the correct info
        t.equal(StringUtil.replaceUnsafeChars(ltPerfectVar.id), ltPerfectVar.id);
        t.equal(ltPerfectVar.id, ltPerfectVarId);
        t.equal(ltPerfectVar.type, Variable.SCALAR_TYPE);
        t.equal(ltPerfectVar.value, '> perfect');

        // Find all the references for this variable, and verify they have the correct ID
        // There should be one
        t.equal(allVarListFields[ltPerfectVarId].length, 1);
        const bananasBlocks = Object.keys(bananas.blocks._blocks).map(blockId => bananas.blocks._blocks[blockId]);
        const bananasVarBlocks = bananasBlocks.filter(block => block.fields.hasOwnProperty('VARIABLE'));
        t.equal(bananasVarBlocks.length, 1);
        t.equal(bananasVarBlocks[0].fields.VARIABLE.id, ltPerfectVarId);

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
