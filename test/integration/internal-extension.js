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
            id: 'test-internal-extension',
            name: 'Test Internal Extension',
            blocks: [
                {
                    opcode: 'go'
                }
            ]
        };
    }

    go () {
        this.status.goCalled = true;
    }
}

test('internal extension', t => {
    const vm = new VirtualMachine();

    const extension = new TestInternalExtension();
    t.ok(extension.status.constructorCalled);

    t.notOk(extension.status.getInfoCalled);
    return vm.extensionManager._registerInternalExtension(extension).then(() => {
        t.ok(extension.status.getInfoCalled);

        const func = vm.runtime.getOpcodeFunction('test-internal-extension.go');
        t.type(func, 'function');

        t.notOk(extension.status.goCalled);
        func();
        t.ok(extension.status.goCalled);
    });
});
