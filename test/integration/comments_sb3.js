const path = require('path');
const test = require('tap').test;
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

const projectUri = path.resolve(__dirname, '../fixtures/comments.sb3');
const project = readFileToBuffer(projectUri);

test('load an sb3 project with comments', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Evaluate playground data and exit
    vm.on('playgroundData', e => {
        const threads = JSON.parse(e.threads);
        t.equal(threads.length, 0);

        const stage = vm.runtime.targets[0];
        const target = vm.runtime.targets[1];

        const stageComments = Object.values(stage.comments);

        // Stage has 1 comment, and it is minimized.
        t.equal(stageComments.length, 1);
        t.equal(stageComments[0].minimized, true);
        t.equal(stageComments[0].text, 'A minimized stage comment.');
        // The stage comment is a workspace comment
        t.equal(stageComments[0].blockId, null);

        // Sprite 1 has 6 Comments, 1 workspace comment, and 5 block comments
        const targetComments = Object.values(target.comments);
        t.equal(targetComments.length, 6);
        const spriteWorkspaceComments = targetComments.filter(comment => comment.blockId === null);
        t.equal(spriteWorkspaceComments.length, 1);
        t.equal(spriteWorkspaceComments[0].minimized, false);
        t.equal(spriteWorkspaceComments[0].text, 'This is a workspace comment.');

        // Test the sprite block comments
        const blockComments = targetComments.filter(comment => !!comment.blockId);
        t.equal(blockComments.length, 5);

        t.equal(blockComments[0].minimized, true);
        t.equal(blockComments[0].text, '1. Green Flag Comment.');
        const greenFlagBlock = target.blocks.getBlock(blockComments[0].blockId);
        t.equal(greenFlagBlock.comment, blockComments[0].id);
        t.equal(greenFlagBlock.opcode, 'event_whenflagclicked');

        t.equal(blockComments[1].minimized, true);
        t.equal(blockComments[1].text, '2. Turn 15 Degrees Comment.');
        const turnRightBlock = target.blocks.getBlock(blockComments[1].blockId);
        t.equal(turnRightBlock.comment, blockComments[1].id);
        t.equal(turnRightBlock.opcode, 'motion_turnright');

        t.equal(blockComments[2].minimized, false);
        t.equal(blockComments[2].text, '3. Comment for a loop.');
        const repeatBlock = target.blocks.getBlock(blockComments[2].blockId);
        t.equal(repeatBlock.comment, blockComments[2].id);
        t.equal(repeatBlock.opcode, 'control_repeat');

        t.equal(blockComments[3].minimized, false);
        t.equal(blockComments[3].text, '4. Comment for a block nested in a loop.');
        const changeColorBlock = target.blocks.getBlock(blockComments[3].blockId);
        t.equal(changeColorBlock.comment, blockComments[3].id);
        t.equal(changeColorBlock.opcode, 'looks_changeeffectby');

        t.equal(blockComments[4].minimized, false);
        t.equal(blockComments[4].text, '5. Comment for a block outside of a loop.');
        const stopAllBlock = target.blocks.getBlock(blockComments[4].blockId);
        t.equal(stopAllBlock.comment, blockComments[4].id);
        t.equal(stopAllBlock.opcode, 'control_stop');

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
