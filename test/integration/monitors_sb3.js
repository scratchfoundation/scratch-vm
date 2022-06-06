const path = require('path');
const test = require('tap').test;
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');
const Variable = require('../../src/engine/variable');

const projectUri = path.resolve(__dirname, '../fixtures/monitors.sb3');
const project = readFileToBuffer(projectUri);

test('importing sb3 project with monitors', t => {
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
        t.equal(lastStepUpdatedMonitorThreads.length, 17);

        // There should be one additional hidden monitor that is in the monitorState but
        // does not start a thread.
        t.equal(vm.runtime._monitorState.size, 18);

        const stage = vm.runtime.targets[0];
        const shirtSprite = vm.runtime.targets[1];
        const heartSprite = vm.runtime.targets[2];

        // Global variable named "my variable" exists
        let variableId = Object.keys(stage.variables).filter(k => stage.variables[k].name === 'my variable')[0];
        let monitorRecord = vm.runtime._monitorState.get(variableId);
        let monitorBlock = vm.runtime.monitorBlocks.getBlock(variableId);
        t.equal(monitorRecord.opcode, 'data_variable');
        t.equal(monitorRecord.mode, 'default');
        // The following few properties are imported for all monitors, just check once.
        t.equal(monitorRecord.sliderMin, 0);
        t.equal(monitorRecord.sliderMax, 100);
        t.equal(monitorRecord.isDiscrete, true); // The default if not present
        t.equal(monitorRecord.x, 10);
        t.equal(monitorRecord.y, 62);
        // Height and width are only used for list monitors and should default to 0
        // for all other monitors
        t.equal(monitorRecord.width, 0);
        t.equal(monitorRecord.height, 0);
        t.equal(monitorRecord.visible, true);
        t.type(monitorRecord.params, 'object');
        // The variable name should be stored in the monitor params
        t.equal(monitorRecord.params.VARIABLE, 'my variable');
        // Test that the monitor block and its fields were constructed correctly
        t.equal(monitorBlock.fields.VARIABLE.value, 'my variable');
        t.equal(monitorBlock.fields.VARIABLE.name, 'VARIABLE');
        t.equal(monitorBlock.fields.VARIABLE.id, variableId);
        t.equal(monitorBlock.fields.VARIABLE.variableType, Variable.SCALAR_TYPE);

        // There is a global variable named 'secret_slide' which has a hidden monitor
        variableId = Object.keys(stage.variables).filter(k => stage.variables[k].name === 'secret_slide')[0];
        monitorRecord = vm.runtime._monitorState.get(variableId);
        monitorBlock = vm.runtime.monitorBlocks.getBlock(variableId);
        t.equal(monitorRecord.opcode, 'data_variable');
        t.equal(monitorRecord.mode, 'slider');
        t.equal(monitorRecord.visible, false);
        t.equal(monitorRecord.sliderMin, 0);
        t.equal(monitorRecord.sliderMax, 100);
        t.type(monitorRecord.params, 'object');
        t.equal(monitorRecord.params.VARIABLE, 'secret_slide');
        // Test that the monitor block and its fields were constructed correctly
        t.equal(monitorBlock.fields.VARIABLE.value, 'secret_slide');
        t.equal(monitorBlock.fields.VARIABLE.name, 'VARIABLE');
        t.equal(monitorBlock.fields.VARIABLE.id, variableId);
        t.equal(monitorBlock.fields.VARIABLE.variableType, Variable.SCALAR_TYPE);


        // Shirt sprite has a local list named "fashion"
        variableId = Object.keys(shirtSprite.variables).filter(k => shirtSprite.variables[k].name === 'fashion')[0];
        monitorRecord = vm.runtime._monitorState.get(variableId);
        monitorBlock = vm.runtime.monitorBlocks.getBlock(variableId);
        t.equal(monitorRecord.opcode, 'data_listcontents');
        t.equal(monitorRecord.mode, 'list');
        t.equal(monitorRecord.visible, true);
        t.equal(monitorRecord.height, 122);
        t.equal(monitorRecord.width, 104);
        t.type(monitorRecord.params, 'object');
        t.equal(monitorRecord.params.LIST, 'fashion'); // The list name should be stored in the monitor params
        // Test that the monitor block and its fields were constructed correctly
        t.equal(monitorBlock.fields.LIST.value, 'fashion');
        t.equal(monitorBlock.fields.LIST.name, 'LIST');
        t.equal(monitorBlock.fields.LIST.id, variableId);
        t.equal(monitorBlock.fields.LIST.variableType, Variable.LIST_TYPE);

        // Shirt sprite has a local variable named "tee"
        variableId = Object.keys(shirtSprite.variables).filter(k => shirtSprite.variables[k].name === 'tee')[0];
        monitorRecord = vm.runtime._monitorState.get(variableId);
        monitorBlock = vm.runtime.monitorBlocks.getBlock(variableId);
        t.equal(monitorRecord.opcode, 'data_variable');
        t.equal(monitorRecord.mode, 'slider');
        t.equal(monitorRecord.visible, true);
        t.equal(monitorRecord.sliderMin, 0);
        t.equal(monitorRecord.sliderMax, 100);
        t.type(monitorRecord.params, 'object');
        t.equal(monitorRecord.params.VARIABLE, 'tee');
        // Test that the monitor block and its fields were constructed correctly
        t.equal(monitorBlock.fields.VARIABLE.value, 'tee');
        t.equal(monitorBlock.fields.VARIABLE.name, 'VARIABLE');
        t.equal(monitorBlock.fields.VARIABLE.id, variableId);
        t.equal(monitorBlock.fields.VARIABLE.variableType, Variable.SCALAR_TYPE);

        // Heart sprite has a local list named "hearty"
        variableId = Object.keys(heartSprite.variables).filter(k => heartSprite.variables[k].name === 'hearty')[0];
        monitorRecord = vm.runtime._monitorState.get(variableId);
        monitorBlock = vm.runtime.monitorBlocks.getBlock(variableId);
        t.equal(monitorRecord.opcode, 'data_variable');
        t.equal(monitorRecord.mode, 'default');
        t.equal(monitorRecord.visible, true);
        t.type(monitorRecord.params, 'object');
        t.equal(monitorRecord.params.VARIABLE, 'hearty'); // The variable name should be stored in the monitor params
        // Test that the monitor block and its fields were constructed correctly
        t.equal(monitorBlock.fields.VARIABLE.value, 'hearty');
        t.equal(monitorBlock.fields.VARIABLE.name, 'VARIABLE');
        t.equal(monitorBlock.fields.VARIABLE.id, variableId);
        t.equal(monitorBlock.fields.VARIABLE.variableType, Variable.SCALAR_TYPE);

        // Backdrop name monitor is visible, not sprite specific
        // should get imported with id that references the name parameter
        // via '_name' at the end since the 3.0 block has a dropdown.
        let monitorId = 'backdropnumbername_name';
        monitorRecord = vm.runtime._monitorState.get(monitorId);
        monitorBlock = vm.runtime.monitorBlocks.getBlock(monitorId);
        t.equal(monitorRecord.opcode, 'looks_backdropnumbername');
        t.equal(monitorRecord.mode, 'default');
        t.equal(monitorRecord.visible, true);
        t.equal(monitorRecord.spriteName, null);
        t.equal(monitorRecord.targetId, null);
        // Test that the monitor block and its fields were constructed correctly
        t.equal(monitorBlock.fields.NUMBER_NAME.value, 'name');

        // Backdrop name monitor is visible, not sprite specific
        // should get imported with id that references the name parameter
        // via '_number' at the end since the 3.0 block has a dropdown.
        monitorId = 'backdropnumbername_number';
        monitorRecord = vm.runtime._monitorState.get(monitorId);
        monitorBlock = vm.runtime.monitorBlocks.getBlock(monitorId);
        t.equal(monitorRecord.opcode, 'looks_backdropnumbername');
        t.equal(monitorRecord.mode, 'default');
        t.equal(monitorRecord.visible, true);
        t.equal(monitorRecord.spriteName, null);
        t.equal(monitorRecord.targetId, null);
        // Test that the monitor block and its fields were constructed correctly
        t.equal(monitorBlock.fields.NUMBER_NAME.value, 'number');

        // x position monitor is in large mode, specific to shirt sprite
        monitorId = `${shirtSprite.id}_xposition`;
        monitorRecord = vm.runtime._monitorState.get(monitorId);
        monitorBlock = vm.runtime.monitorBlocks.getBlock(monitorId);
        t.equal(monitorRecord.opcode, 'motion_xposition');
        t.equal(monitorRecord.mode, 'large');
        t.equal(monitorRecord.visible, true);
        t.equal(monitorRecord.spriteName, 'Shirt-T');
        t.equal(monitorRecord.targetId, shirtSprite.id);

        // y position monitor is in large mode, specific to shirt sprite
        monitorId = `${shirtSprite.id}_yposition`;
        monitorRecord = vm.runtime._monitorState.get(monitorId);
        monitorBlock = vm.runtime.monitorBlocks.getBlock(monitorId);
        t.equal(monitorRecord.opcode, 'motion_yposition');
        t.equal(monitorRecord.mode, 'large');
        t.equal(monitorRecord.visible, true);
        t.equal(monitorRecord.spriteName, 'Shirt-T');
        t.equal(monitorRecord.targetId, shirtSprite.id);

        // direction monitor is in large mode, specific to shirt sprite
        monitorId = `${shirtSprite.id}_direction`;
        monitorRecord = vm.runtime._monitorState.get(monitorId);
        monitorBlock = vm.runtime.monitorBlocks.getBlock(monitorId);
        t.equal(monitorRecord.opcode, 'motion_direction');
        t.equal(monitorRecord.mode, 'large');
        t.equal(monitorRecord.visible, true);
        t.equal(monitorRecord.spriteName, 'Shirt-T');
        t.equal(monitorRecord.targetId, shirtSprite.id);

        monitorId = `${shirtSprite.id}_size`;
        monitorRecord = vm.runtime._monitorState.get(monitorId);
        monitorBlock = vm.runtime.monitorBlocks.getBlock(monitorId);
        t.equal(monitorRecord.opcode, 'looks_size');
        t.equal(monitorRecord.mode, 'large');
        t.equal(monitorRecord.visible, true);
        t.equal(monitorRecord.spriteName, 'Shirt-T');
        t.equal(monitorRecord.targetId, shirtSprite.id);

        // The monitor IDs for the sensing_current block should be unique
        // to the parameter that is selected on the block being monitored.
        // The paramater portion of the id should be lowercase even
        // though the field value on the block is uppercase.
        monitorId = 'current_date';
        monitorRecord = vm.runtime._monitorState.get(monitorId);
        t.equal(monitorRecord.opcode, 'sensing_current');
        monitorBlock = vm.runtime.monitorBlocks.getBlock(monitorId);
        t.equal(monitorBlock.fields.CURRENTMENU.value, 'DATE');
        t.equal(monitorRecord.mode, 'default');
        t.equal(monitorRecord.visible, true);
        t.equal(monitorRecord.spriteName, null);
        t.equal(monitorRecord.targetId, null);

        monitorId = 'current_year';
        monitorRecord = vm.runtime._monitorState.get(monitorId);
        t.equal(monitorRecord.opcode, 'sensing_current');
        monitorBlock = vm.runtime.monitorBlocks.getBlock(monitorId);
        t.equal(monitorBlock.fields.CURRENTMENU.value, 'YEAR');
        t.equal(monitorRecord.mode, 'default');
        t.equal(monitorRecord.visible, true);
        t.equal(monitorRecord.spriteName, null);
        t.equal(monitorRecord.targetId, null);

        monitorId = 'current_month';
        monitorRecord = vm.runtime._monitorState.get(monitorId);
        t.equal(monitorRecord.opcode, 'sensing_current');
        monitorBlock = vm.runtime.monitorBlocks.getBlock(monitorId);
        t.equal(monitorBlock.fields.CURRENTMENU.value, 'MONTH');
        t.equal(monitorRecord.mode, 'default');
        t.equal(monitorRecord.visible, true);
        t.equal(monitorRecord.spriteName, null);
        t.equal(monitorRecord.targetId, null);

        // Extension Monitors
        monitorId = 'music_getTempo';
        monitorRecord = vm.runtime._monitorState.get(monitorId);
        t.equal(monitorRecord.opcode, 'music_getTempo');
        monitorBlock = vm.runtime.monitorBlocks.getBlock(monitorId);
        t.equal(monitorRecord.mode, 'default');
        t.equal(monitorRecord.visible, true);
        t.equal(monitorRecord.spriteName, null);
        t.equal(monitorRecord.targetId, null);
        t.equal(vm.extensionManager.isExtensionLoaded('music'), true);

        monitorId = 'ev3_getDistance';
        monitorRecord = vm.runtime._monitorState.get(monitorId);
        t.equal(monitorRecord.opcode, 'ev3_getDistance');
        monitorBlock = vm.runtime.monitorBlocks.getBlock(monitorId);
        t.equal(monitorRecord.mode, 'default');
        t.equal(monitorRecord.visible, true);
        t.equal(monitorRecord.spriteName, null);
        t.equal(monitorRecord.targetId, null);
        t.equal(vm.extensionManager.isExtensionLoaded('ev3'), true);

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
            vm.greenFlag();
            setTimeout(() => {
                vm.getPlaygroundData();
                vm.stopAll();
            }, 100);
        });
    });
});
