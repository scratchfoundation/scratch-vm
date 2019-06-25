const test = require('tap').test;
const Worker = require('tiny-worker');

const BlockType = require('../../src/extension-support/block-type');
const ContextMenuContext = require('../../src/extension-support/context-menu-context');

const dispatch = require('../../src/dispatch/central-dispatch');
const VirtualMachine = require('../../src/virtual-machine');

const Sprite = require('../../src/sprites/sprite');
const RenderedTarget = require('../../src/sprites/rendered-target');

// By default Central Dispatch works with the Worker class built into the browser. Tell it to use TinyWorker instead.
dispatch.workerClass = Worker;

class TestInternalExtension {
    constructor () {
        this.status = {};
        this.status.constructorCalled = true;
    }

    getInfo () {
        this.status.getInfoCalled = true;
        return {
            id: 'testInternalExtension',
            name: 'Test Internal Extension',
            blocks: [
                {
                    opcode: 'go'
                }
            ],
            menus: {
                simpleMenu: this._buildAMenu(),
                dynamicMenu: '_buildDynamicMenu'
            }
        };
    }

    go (args, util, blockInfo) {
        this.status.goCalled = true;
        return blockInfo;
    }

    _buildAMenu () {
        this.status.buildMenuCalled = true;
        return ['abcd', 'efgh', 'ijkl'];
    }

    _buildDynamicMenu () {
        this.status.buildDynamicMenuCalled = true;
        return [1, 2, 3, 4, 6];
    }
}

test('internal extension', t => {
    const vm = new VirtualMachine();

    const extension = new TestInternalExtension();
    t.ok(extension.status.constructorCalled);

    t.notOk(extension.status.getInfoCalled);
    vm.extensionManager._registerInternalExtension(extension);
    t.ok(extension.status.getInfoCalled);

    const func = vm.runtime.getOpcodeFunction('testInternalExtension_go');
    t.type(func, 'function');

    t.notOk(extension.status.goCalled);
    const goBlockInfo = func();
    t.ok(extension.status.goCalled);

    // The 'go' block returns its own blockInfo. Make sure it matches the expected info.
    // Note that the extension parser fills in missing fields so there are more fields here than in `getInfo`.
    const expectedBlockInfo = {
        arguments: {},
        blockAllThreads: false,
        blockType: BlockType.COMMAND,
        func: goBlockInfo.func, // Cheat since we don't have a good way to ensure we generate the same function
        opcode: 'go',
        terminal: false,
        text: 'go'
    };
    t.deepEqual(goBlockInfo, expectedBlockInfo);

    // There should be at least one extension loaded, but there could be more
    // loaded if we have core extensions defined in src/virtual-machine.
    t.ok(vm.runtime._blockInfo.length > 0);

    for (const extensionInfo of vm.runtime._blockInfo) {
        if (extensionInfo.id !== 'testInternalExtension') continue;

        // The following should run only once, for the mock `testInternalExtension`
        // defined above. Any other extensions (e.g. core extensions that are loaded)
        // when a VM instance is constructed should be skipped above.

        // There should be 2 menus - one is an array, one is the function to call.
        t.equal(extensionInfo.menus.length, 2);
        // First menu has 3 items.
        t.equal(
            extensionInfo.menus[0].json.args0[0].options.length, 3);
        // Second menu is a dynamic menu and therefore should be a function.
        t.type(
            extensionInfo.menus[1].json.args0[0].options, 'function');
        t.end();
    }
});

test('load sync', t => {
    const vm = new VirtualMachine();
    vm.extensionManager.loadExtensionIdSync('coreExample');
    t.ok(vm.extensionManager.isExtensionLoaded('coreExample'));

    t.equal(vm.runtime._blockInfo.length, 1);

    // blocks should be an array of [button pseudo-block, reporter block, command block].
    t.equal(vm.runtime._blockInfo[0].blocks.length, 3);
    t.type(vm.runtime._blockInfo[0].blocks[0].info, 'object');
    t.type(vm.runtime._blockInfo[0].blocks[0].info.func, 'MAKE_A_VARIABLE');
    t.equal(vm.runtime._blockInfo[0].blocks[0].info.blockType, 'button');
    t.type(vm.runtime._blockInfo[0].blocks[1].info, 'object');
    t.equal(vm.runtime._blockInfo[0].blocks[1].info.opcode, 'exampleOpcode');
    t.equal(vm.runtime._blockInfo[0].blocks[1].info.blockType, 'reporter');
    t.type(vm.runtime._blockInfo[0].blocks[2].info, 'object');
    t.equal(vm.runtime._blockInfo[0].blocks[2].info.opcode, 'exampleDynamicOpcode');
    t.equal(vm.runtime._blockInfo[0].blocks[2].info.blockType, 'command');
    t.equal(vm.runtime._blockInfo[0].blocks[2].info.customContextMenu.length, 3);
    t.type(vm.runtime._blockInfo[0].blocks[2].info.customContextMenu[0].callback, 'function');
    t.type(vm.runtime._blockInfo[0].blocks[2].info.customContextMenu[1].callback, 'function');
    t.type(vm.runtime._blockInfo[0].blocks[2].info.customContextMenu[2].callback, 'function');
    t.equal(vm.runtime._blockInfo[0].blocks[2].info.customContextMenu[0].context, undefined);
    t.type(vm.runtime._blockInfo[0].blocks[2].info.customContextMenu[1].context, ContextMenuContext.TOOLBOX_ONLY);
    t.type(vm.runtime._blockInfo[0].blocks[2].info.customContextMenu[2].context, ContextMenuContext.WORKSPACE_ONLY);

    // Test the opcode function
    t.equal(vm.runtime._blockInfo[0].blocks[1].info.func(), 'no stage yet');

    const sprite = new Sprite(null, vm.runtime);
    sprite.name = 'Stage';
    const stage = new RenderedTarget(sprite, vm.runtime);
    stage.isStage = true;
    vm.runtime.targets = [stage];

    t.equal(vm.runtime._blockInfo[0].blocks[1].info.func(), 'Stage');

    t.end();
});
