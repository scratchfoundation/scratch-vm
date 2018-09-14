const path = require('path');
const test = require('tap').test;
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

const projectUri = path.resolve(__dirname, '../fixtures/block-to-workspace-comments.sb2');
const project = readFileToBuffer(projectUri);

test('importing sb2 project where block comment is converted to workspace comment and block is deleted', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Evaluate playground data and exit
    vm.on('playgroundData', e => {
        const threads = JSON.parse(e.threads);
        t.equal(threads.length, 0);

        const target = vm.runtime.targets[1];

        // Sprite 1 has 3 Comments, 1 block comment and 2 workspace comments (which were
        // originally created via a block comment to workspace comment conversion in Scratch 2.0).
        const targetComments = Object.values(target.comments);
        t.equal(targetComments.length, 3);
        const spriteWorkspaceComments = targetComments.filter(comment => comment.blockId === null);
        t.equal(spriteWorkspaceComments.length, 2);

        // Test the sprite block comments
        const blockComments = targetComments.filter(comment => !!comment.blockId);
        t.equal(blockComments.length, 1);

        // There should not be any comments where blockId is a number
        const invalidComments = targetComments.filter(comment => typeof comment.blockId === 'number');
        t.equal(invalidComments.length, 0);

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
