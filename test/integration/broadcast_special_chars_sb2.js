const path = require('path');
const test = require('tap').test;
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');
const Variable = require('../../src/engine/variable');
const StringUtil = require('../../src/util/string-util');
const VariableUtil = require('../../src/util/variable-util');

const projectUri = path.resolve(__dirname, '../fixtures/broadcast_special_chars.sb2');
const project = readFileToBuffer(projectUri);

test('importing sb2 project with special chars in message names', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Evaluate playground data and exit
    vm.on('playgroundData', e => {
        const threads = JSON.parse(e.threads);
        t.equal(threads.length, 0);

        t.equal(vm.runtime.targets.length, 2);

        const stage = vm.runtime.targets[0];
        const cat = vm.runtime.targets[1];

        const allBroadcastFields = VariableUtil.getAllVarRefsForTargets(vm.runtime.targets, true);

        const abMessageId = Object.keys(stage.variables).filter(k => stage.variables[k].name === 'a&b')[0];
        const abMessage = stage.variables[abMessageId];
        // Check for unsafe characters, replaceUnsafeChars should just result in the original string
        // (e.g. there was nothing to replace)
        // Check that the message ID does not have any unsafe characters
        t.equal(StringUtil.replaceUnsafeChars(abMessageId), abMessageId);

        // Check that the message still has the correct info
        t.equal(StringUtil.replaceUnsafeChars(abMessage.id), abMessage.id);
        t.equal(abMessage.id, abMessageId);
        t.equal(abMessage.type, Variable.BROADCAST_MESSAGE_TYPE);
        t.equal(abMessage.value, 'a&b');


        const ltPerfectMessageId = Object.keys(stage.variables).filter(k => stage.variables[k].name === '< perfect')[0];
        const ltPerfectMessage = stage.variables[ltPerfectMessageId];
        // Check for unsafe characters, replaceUnsafeChars should just result in the original string
        // (e.g. there was nothing to replace)
        // Check that the message ID does not have any unsafe characters
        t.equal(StringUtil.replaceUnsafeChars(ltPerfectMessageId), ltPerfectMessageId);

        // Check that the message still has the correct info
        t.equal(StringUtil.replaceUnsafeChars(ltPerfectMessage.id), ltPerfectMessage.id);
        t.equal(ltPerfectMessage.id, ltPerfectMessageId);
        t.equal(ltPerfectMessage.type, Variable.BROADCAST_MESSAGE_TYPE);
        t.equal(ltPerfectMessage.value, '< perfect');

        // Find all the references for these messages, and verify they have the correct ID
        t.equal(allBroadcastFields[ltPerfectMessageId].length, 1);
        t.equal(allBroadcastFields[abMessageId].length, 1);
        const catBlocks = Object.keys(cat.blocks._blocks).map(blockId => cat.blocks._blocks[blockId]);
        const catMessageBlocks = catBlocks.filter(
            block => Object.prototype.hasOwnProperty.call(block.fields, 'BROADCAST_OPTION')
        );
        t.equal(catMessageBlocks.length, 2);
        t.equal(catMessageBlocks[0].fields.BROADCAST_OPTION.id, ltPerfectMessageId);
        t.equal(catMessageBlocks[1].fields.BROADCAST_OPTION.id, abMessageId);

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
