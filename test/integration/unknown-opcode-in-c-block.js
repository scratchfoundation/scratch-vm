const path = require('path');
const test = require('tap').test;
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

const uri = path.resolve(__dirname, '../fixtures/unknown-opcode-in-c-block.sb2');
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
        //      when green flag => forever [ => "undefined"]
        // the "undefined" block has opcode "foo" and was created by dragging
        // a custom procedure caller named foo from the backpack into a project.
        // It should be parsed in without error and it should
        // leave the forever block empty.
        const blocks = vm.runtime.targets[1].blocks;
        const topBlockId = blocks.getScripts()[0];
        const secondBlockId = blocks.getNextBlock(topBlockId);
        const innerBlockId = blocks.getBranch(secondBlockId, 0);

        t.equal(blocks.getBlock(topBlockId).opcode, 'event_whenflagclicked');
        t.equal(blocks.getBlock(secondBlockId).opcode, 'control_forever');
        t.equal(innerBlockId, null);

        t.end();
        process.nextTick(process.exit);
    });
});
