var EventEmitter = require('events');
var util = require('util');

function VirtualMachine () {
    if (!window.Worker) {
        console.error('WebWorkers not supported in this environment.' +
            ' Please use the non-worker version (vm.js or vm.min.js).');
        return;
    }
    var instance = this;
    EventEmitter.call(instance);
    instance.vmWorker = new Worker('../vm.js');

    // onmessage calls are converted into emitted events.
    instance.vmWorker.onmessage = function (e) {
        instance.emit(e.data.method, e.data);
    };

    instance.blockListener = function (e) {
        // Messages from Blockly are not serializable by default.
        // Pull out the necessary, serializable components to pass across.
        var serializableE = {
            blockId: e.blockId,
            element: e.element,
            type: e.type,
            name: e.name,
            newValue: e.newValue,
            oldParentId: e.oldParentId,
            oldInputName: e.oldInputName,
            newParentId: e.newParentId,
            newInputName: e.newInputName,
            newCoordinate: e.newCoordinate,
            xml: {
                outerHTML: (e.xml) ? e.xml.outerHTML : null
            }
        };
        instance.vmWorker.postMessage({
            method: 'blockListener',
            args: serializableE
        });
    };
}

/**
 * Inherit from EventEmitter
 */
util.inherits(VirtualMachine, EventEmitter);

// For documentation, please see index.js.
// These mirror the functionality provided there, with the worker wrapper.
VirtualMachine.prototype.getPlaygroundData = function () {
    this.vmWorker.postMessage({method: 'getPlaygroundData'});
};

VirtualMachine.prototype.postIOData = function (device, data) {
    this.vmWorker.postMessage({
        method: 'postIOData',
        device: device,
        data: data
    });
};

VirtualMachine.prototype.start = function () {
    this.vmWorker.postMessage({method: 'start'});
};

VirtualMachine.prototype.greenFlag = function () {
    this.vmWorker.postMessage({method: 'greenFlag'});
};

VirtualMachine.prototype.stopAll = function () {
    this.vmWorker.postMessage({method: 'stopAll'});
};

VirtualMachine.prototype.animationFrame = function () {
    this.vmWorker.postMessage({method: 'animationFrame'});
};

VirtualMachine.prototype.loadProject = function (json) {
    this.vmWorker.postMessage({method: 'loadProject', json: json});
};

VirtualMachine.prototype.setEditingTarget = function (targetId) {
    this.vmWorker.postMessage({method: 'setEditingTarget', targetId: targetId});
};

/**
 * Export and bind to `window`
 */
module.exports = VirtualMachine;
if (typeof window !== 'undefined') window.VirtualMachine = module.exports;
