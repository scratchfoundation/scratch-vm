const test = require('tap').test;
const VirtualMachine = require('../../src/index');

test('interface', t => {
    const vm = new VirtualMachine();
    t.type(vm, 'object');
    t.type(vm.start, 'function');
    t.type(vm.greenFlag, 'function');
    t.type(vm.setTurboMode, 'function');
    t.type(vm.setCompatibilityMode, 'function');
    t.type(vm.stopAll, 'function');
    t.type(vm.clear, 'function');

    t.type(vm.getPlaygroundData, 'function');
    t.type(vm.postIOData, 'function');

    t.type(vm.loadProject, 'function');
    t.type(vm.addSprite, 'function');
    t.type(vm.addCostume, 'function');
    t.type(vm.addBackdrop, 'function');
    t.type(vm.addSound, 'function');
    t.type(vm.deleteCostume, 'function');
    t.type(vm.deleteSound, 'function');
    t.type(vm.renameSprite, 'function');
    t.type(vm.deleteSprite, 'function');

    t.type(vm.attachRenderer, 'function');
    t.type(vm.blockListener, 'function');
    t.type(vm.flyoutBlockListener, 'function');
    t.type(vm.setEditingTarget, 'function');

    t.type(vm.emitTargetsUpdate, 'function');
    t.type(vm.emitWorkspaceUpdate, 'function');
    t.type(vm.postSpriteInfo, 'function');
    t.end();
});
