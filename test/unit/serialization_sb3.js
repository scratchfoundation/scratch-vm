const test = require('tap').test;
const path = require('path');
const VirtualMachine = require('../../src/index');
const sb3 = require('../../src/serialization/sb3');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const exampleProjectPath = path.resolve(__dirname, '../fixtures/clone-cleanup.sb2');
const commentsSB2ProjectPath = path.resolve(__dirname, '../fixtures/comments.sb2');
const commentsSB3ProjectPath = path.resolve(__dirname, '../fixtures/comments.sb3');
const commentsSB3NoDupeIds = path.resolve(__dirname, '../fixtures/comments_no_duplicate_id_serialization.sb3');
const FakeRenderer = require('../fixtures/fake-renderer');

test('serialize', t => {
    const vm = new VirtualMachine();
    vm.loadProject(readFileToBuffer(exampleProjectPath))
        .then(() => {
            const result = sb3.serialize(vm.runtime);
            // @todo Analyze
            t.type(JSON.stringify(result), 'string');
            t.end();
        });
});

test('deserialize', t => {
    const vm = new VirtualMachine();
    sb3.deserialize('', vm.runtime).then(({targets}) => {
        // @todo Analyze
        t.type(targets, 'object');
        t.end();
    });
});


test('serialize sb2 project with comments as sb3', t => {
    const vm = new VirtualMachine();
    vm.loadProject(readFileToBuffer(commentsSB2ProjectPath))
        .then(() => {
            const result = sb3.serialize(vm.runtime);

            t.type(JSON.stringify(result), 'string');
            t.type(result.targets, 'object');
            t.equal(Array.isArray(result.targets), true);
            t.equal(result.targets.length, 2);

            const stage = result.targets[0];
            t.equal(stage.isStage, true);
            // The stage has 0 blocks, and 1 workspace comment
            t.type(stage.blocks, 'object');
            t.equal(Object.keys(stage.blocks).length, 0);
            t.type(stage.comments, 'object');
            t.equal(Object.keys(stage.comments).length, 1);
            const stageBlockComments = Object.values(stage.comments).filter(comment => !!comment.blockId);
            const stageWorkspaceComments = Object.values(stage.comments).filter(comment => comment.blockId === null);
            t.equal(stageBlockComments.length, 0);
            t.equal(stageWorkspaceComments.length, 1);

            const sprite = result.targets[1];
            t.equal(sprite.isStage, false);
            t.type(sprite.blocks, 'object');
            // Sprite 1 has 6 blocks, 5 block comments, and 1 workspace comment
            t.equal(Object.keys(sprite.blocks).length, 6);
            t.type(sprite.comments, 'object');
            t.equal(Object.keys(sprite.comments).length, 6);

            const spriteBlockComments = Object.values(sprite.comments).filter(comment => !!comment.blockId);
            const spriteWorkspaceComments = Object.values(sprite.comments).filter(comment => comment.blockId === null);
            t.equal(spriteBlockComments.length, 5);
            t.equal(spriteWorkspaceComments.length, 1);

            t.end();
        });
});

test('deserialize sb3 project with comments', t => {
    const vm = new VirtualMachine();
    vm.loadProject(readFileToBuffer(commentsSB3ProjectPath))
        .then(() => {
            const runtime = vm.runtime;

            t.type(runtime.targets, 'object');
            t.equal(Array.isArray(runtime.targets), true);
            t.equal(runtime.targets.length, 2);

            const stage = runtime.targets[0];
            t.equal(stage.isStage, true);
            // The stage has 0 blocks, and 1 workspace comment
            t.type(stage.blocks, 'object');
            t.equal(Object.keys(stage.blocks._blocks).length, 0);
            t.type(stage.comments, 'object');
            t.equal(Object.keys(stage.comments).length, 1);
            const stageBlockComments = Object.values(stage.comments).filter(comment => !!comment.blockId);
            const stageWorkspaceComments = Object.values(stage.comments).filter(comment => comment.blockId === null);
            t.equal(stageBlockComments.length, 0);
            t.equal(stageWorkspaceComments.length, 1);

            const sprite = runtime.targets[1];
            t.equal(sprite.isStage, false);
            t.type(sprite.blocks, 'object');
            // Sprite 1 has 6 blocks, 5 block comments, and 1 workspace comment
            t.equal(Object.values(sprite.blocks._blocks).filter(block => !block.shadow).length, 6);
            t.type(sprite.comments, 'object');
            t.equal(Object.keys(sprite.comments).length, 6);

            const spriteBlockComments = Object.values(sprite.comments).filter(comment => !!comment.blockId);
            const spriteWorkspaceComments = Object.values(sprite.comments).filter(comment => comment.blockId === null);
            t.equal(spriteBlockComments.length, 5);
            t.equal(spriteWorkspaceComments.length, 1);

            t.end();
        });
});

test('deserialize sb3 project with comments - no duplicate id serialization', t => {
    const vm = new VirtualMachine();
    vm.loadProject(readFileToBuffer(commentsSB3NoDupeIds))
        .then(() => {
            const runtime = vm.runtime;

            t.type(runtime.targets, 'object');
            t.equal(Array.isArray(runtime.targets), true);
            t.equal(runtime.targets.length, 2);

            const stage = runtime.targets[0];
            t.equal(stage.isStage, true);
            // The stage has 0 blocks, and 0 workspace comment
            t.type(stage.blocks, 'object');
            t.equal(Object.keys(stage.blocks._blocks).length, 0);
            t.type(stage.comments, 'object');
            t.equal(Object.keys(stage.comments).length, 0);

            const sprite = runtime.targets[1];
            t.equal(sprite.isStage, false);
            t.type(sprite.blocks, 'object');
            // Sprite1 has 1 blocks, 1 block comment, and 1 workspace comment
            t.equal(Object.values(sprite.blocks._blocks).filter(block => !block.shadow).length, 1);
            t.type(sprite.comments, 'object');
            t.equal(Object.keys(sprite.comments).length, 2);

            const spriteBlockComments = Object.values(sprite.comments).filter(comment => !!comment.blockId);
            const spriteWorkspaceComments = Object.values(sprite.comments).filter(comment => comment.blockId === null);
            t.equal(spriteBlockComments.length, 1);
            t.equal(spriteWorkspaceComments.length, 1);

            t.end();
        });
});

test('serialize sb3 preserves sprite layer order', t => {
    const vm = new VirtualMachine();
    vm.attachRenderer(new FakeRenderer());
    vm.loadProject(readFileToBuffer(path.resolve(__dirname, '../fixtures/ordering.sb2')))
        .then(() => {
            // Target get layer order needs a renderer,
            // fake the numbers we would get back from the
            // renderer in order to test that they are serialized
            // correctly
            vm.runtime.targets[0].getLayerOrder = () => 0;
            vm.runtime.targets[1].getLayerOrder = () => 20;
            vm.runtime.targets[2].getLayerOrder = () => 10;
            vm.runtime.targets[3].getLayerOrder = () => 30;

            const result = sb3.serialize(vm.runtime);

            t.type(JSON.stringify(result), 'string');
            t.type(result.targets, 'object');
            t.equal(Array.isArray(result.targets), true);
            t.equal(result.targets.length, 4);

            // First check that the sprites are ordered correctly (as they would
            // appear in the target pane)
            t.equal(result.targets[0].name, 'Stage');
            t.equal(result.targets[1].name, 'First');
            t.equal(result.targets[2].name, 'Second');
            t.equal(result.targets[3].name, 'Third');

            // Check that they are in the correct layer order (as they would render
            // back to front on the stage)
            t.equal(result.targets[0].layerOrder, 0);
            t.equal(result.targets[1].layerOrder, 2);
            t.equal(result.targets[2].layerOrder, 1);
            t.equal(result.targets[3].layerOrder, 3);

            t.end();
        });
});

test('serializeBlocks', t => {
    const vm = new VirtualMachine();
    vm.loadProject(readFileToBuffer(commentsSB3ProjectPath))
        .then(() => {
            const blocks = vm.runtime.targets[1].blocks._blocks;
            const result = sb3.serializeBlocks(blocks);
            // @todo Analyze
            t.type(result[0], 'object');
            t.ok(Object.keys(result[0]).length < Object.keys(blocks).length, 'less blocks in serialized format');
            t.ok(Array.isArray(result[1]));
            t.end();
        });
});

test('deserializeBlocks', t => {
    const vm = new VirtualMachine();
    vm.loadProject(readFileToBuffer(commentsSB3ProjectPath))
        .then(() => {
            const blocks = vm.runtime.targets[1].blocks._blocks;
            const serialized = sb3.serializeBlocks(blocks)[0];
            const deserialized = sb3.deserializeBlocks(serialized);
            t.equal(Object.keys(deserialized).length, Object.keys(blocks).length, 'same number of blocks');
            t.end();
        });
});

test('deserializeBlocks on already deserialized input', t => {
    const vm = new VirtualMachine();
    vm.loadProject(readFileToBuffer(commentsSB3ProjectPath))
        .then(() => {
            const blocks = vm.runtime.targets[1].blocks._blocks;
            const serialized = sb3.serializeBlocks(blocks)[0];
            const deserialized = sb3.deserializeBlocks(serialized);
            const deserializedAgain = sb3.deserializeBlocks(deserialized);
            t.deepEqual(deserialized, deserializedAgain, 'no change from second pass of deserialize');
            t.end();
        });
});

test('getExtensionIdForOpcode', t => {
    t.equal(sb3.getExtensionIdForOpcode('wedo_loopy'), 'wedo');

    // does not consider CORE to be extensions
    t.false(sb3.getExtensionIdForOpcode('control_loopy'));

    // only considers things before the first underscore
    t.equal(sb3.getExtensionIdForOpcode('hello_there_loopy'), 'hello');

    // does not return anything for opcodes with no extension
    t.false(sb3.getExtensionIdForOpcode('hello'));

    t.end();
});
