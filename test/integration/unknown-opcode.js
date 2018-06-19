const path = require('path');
const test = require('tap').test;
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

const uri = path.resolve(__dirname, '../fixtures/unknown-opcode.sb2');
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

        // The project has 3 blocks in a single stack:
        //      play sound => "undefined" => play sound
        // the "undefined" block has opcode "0" and was found in the wild.
        // It should be parsed in without error and it should bridge together
        // the two play sound blocks, so there should not be a third block.
        const blocks = vm.runtime.targets[0].blocks;
        const topBlockId = blocks.getScripts()[0];
        const secondBlockId = blocks.getNextBlock(topBlockId);
        const thirdBlockId = blocks.getNextBlock(secondBlockId);

        t.equal(blocks.getBlock(topBlockId).opcode, 'sound_play');
        t.equal(blocks.getBlock(secondBlockId).opcode, 'sound_play');
        t.equal(thirdBlockId, null);
        t.end();
        process.nextTick(process.exit);
    });
});
