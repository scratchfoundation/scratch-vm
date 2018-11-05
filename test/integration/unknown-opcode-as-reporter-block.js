const path = require('path');
const test = require('tap').test;
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

const uri = path.resolve(__dirname, '../fixtures/unknown-opcode-as-reporter-block.sb2');
const project = readFileToBuffer(uri);

test('unknown opcode', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    vm.start();
    vm.clear();
    vm.setCompatibilityMode(false);
    vm.setTurboMode(false);
    vm.loadProject(project).then(() => {
        vm.greenFlag();

        // The project has 4 blocks in a single stack:
        //      when green flag
        //      if "unknown block"
        //      set volume to "unknown block"
        //      play sound "unknown block"
        // the "unknown block" has unknown opcode and was created by
        // dragging a discontinued extension.
        // It should be parsed in without error and a shadow block
        // should be created where appropriate.
        const blocks = vm.runtime.targets[0].blocks;
        const topBlockId = blocks.getScripts()[0];
        const secondBlockId = blocks.getNextBlock(topBlockId);
        const thirdBlockId = blocks.getNextBlock(secondBlockId);
        const fourthBlockId = blocks.getNextBlock(thirdBlockId);

        t.equal(blocks.getBlock(topBlockId).opcode, 'event_whenflagclicked');
        t.equal(blocks.getBlock(secondBlockId).opcode, 'control_wait_until');
        t.equal(blocks.getBlock(thirdBlockId).opcode, 'sound_setvolumeto');
        t.equal(blocks.getBlock(fourthBlockId).opcode, 'sound_play');

        const secondBlockInputId = blocks.getBlock(secondBlockId).inputs.CONDITION.block;
        const thirdBlockInputId = blocks.getBlock(thirdBlockId).inputs.VOLUME.block;
        const fourthBlockInputId = blocks.getBlock(fourthBlockId).inputs.SOUND_MENU.block;

        t.equal(secondBlockInputId, null);
        t.true(blocks.getBlock(thirdBlockInputId).shadow);
        t.equal(blocks.getBlock(thirdBlockInputId).opcode, 'math_number');
        t.true(blocks.getBlock(fourthBlockInputId).shadow);
        t.equal(blocks.getBlock(fourthBlockInputId).opcode, 'sound_sounds_menu');

        t.end();
        process.nextTick(process.exit);
    });
});
