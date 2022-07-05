const path = require('path');
const test = require('tap').test;
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

const projectUri = path.resolve(__dirname, '../fixtures/stack-click.sb2');
const project = readFileToBuffer(projectUri);

/**
 * stack-click.sb2 contains a sprite at (0, 0) with a single stack
 *     when timer > 100000000
 *         move 100 steps
 * The intention is to make sure that the stack can be activated by a stack click
 * even when the hat predicate is false.
 */
test('stack click activates the stack', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Evaluate playground data and exit
    vm.on('playgroundData', () => {
        // The sprite should have moved 100 to the right
        t.equal(vm.editingTarget.x, 100);
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
            const blockContainer = vm.runtime.targets[1].blocks;
            const allBlocks = blockContainer._blocks;

            // Confirm the editing target is initially at 0
            t.equal(vm.editingTarget.x, 0);

            // Find hat for greater than and click it
            for (const blockId in allBlocks) {
                if (allBlocks[blockId].opcode === 'event_whengreaterthan') {
                    blockContainer.blocklyListen({
                        blockId: blockId,
                        element: 'stackclick'
                    });
                }
            }

            // After two seconds, get playground data and stop
            setTimeout(() => {
                vm.getPlaygroundData();
                vm.stopAll();
            }, 2000);
        });
    });
});
