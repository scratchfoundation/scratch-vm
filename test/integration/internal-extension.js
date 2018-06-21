const test = require('tap').test;
const Worker = require('tiny-worker');

const dispatch = require('../../src/dispatch/central-dispatch');
const VirtualMachine = require('../../src/virtual-machine');

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

    go () {
        this.status.goCalled = true;
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
    return vm.extensionManager._registerInternalExtension(extension).then(() => {
        t.ok(extension.status.getInfoCalled);

        const func = vm.runtime.getOpcodeFunction('testInternalExtension_go');
        t.type(func, 'function');

        t.notOk(extension.status.goCalled);
        func();
        t.ok(extension.status.goCalled);

        // There should be 2 menus - one is an array, one is the function to call.
        t.equal(vm.runtime._blockInfo[0].menus.length, 2);
        // First menu has 3 items.
        t.equal(
            vm.runtime._blockInfo[0].menus[0].json.args0[0].options.length, 3);
        // Second menu is a dynamic menu and therefore should be a function.
        t.type(
            vm.runtime._blockInfo[0].menus[1].json.args0[0].options, 'function');
    });
});
