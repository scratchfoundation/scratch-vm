var EventEmitter = require('events');
var util = require('util');

var Runtime = require('./engine/runtime');

/**
 * Handles connections between blocks, stage, and extensions.
 *
 * @author Andrew Sliwinski <ascii@media.mit.edu>
 */
function VirtualMachine () {
    var instance = this;

    // Bind event emitter and runtime to VM instance
    // @todo Post message (Web Worker) polyfill
    EventEmitter.call(instance);
    instance.runtime = new Runtime();

    /**
     * Event listener for blocks. Handles validation and serves as a generic
     * adapter between the blocks and the runtime interface.
     *
     * @param {Object} Blockly "block" event
     */
    instance.blockListener = function (e) {
        // Validate event
        if (typeof e !== 'object') return;
        if (typeof e.blockId !== 'string') return;

        // Blocks
        switch (e.type) {
        case 'create':
            instance.runtime.createBlock({
                id: e.blockId,
                opcode: e.xml.attributes.type.value
            });
            break;
        case 'move':
            instance.runtime.moveBlock({
                id: e.blockId,
                oldParent: e.oldParentId,
                oldInput: e.oldInputName,
                newParent: e.newParentId,
                newInput: e.newInputName
            });
            break;
        case 'change':
            instance.runtime.changeBlock({
                id: e.blockId
            });
            break;
        case 'delete':
            instance.runtime.deleteBlock({
                id: e.blockId
            });
            break;
        }

        // UI
        if (typeof e.element === 'undefined') return;
        switch (e.element) {
        case 'click':
            instance.runtime.runStack({
                id: e.blockId
            });
            break;
        }
    };

    // @todo Forward runtime events
}

/**
 * Inherit from EventEmitter
 */
util.inherits(VirtualMachine, EventEmitter);

VirtualMachine.prototype.start = function () {
    // @todo Run all green flags
};

VirtualMachine.prototype.stop = function () {
    // @todo Stop all threads
};

VirtualMachine.prototype.save = function () {
    // @todo Serialize runtime state
};

VirtualMachine.prototype.load = function () {
    // @todo Deserialize and apply runtime state
};

/**
 * Export and bind to `window`
 */
module.exports = VirtualMachine;
if (typeof window !== 'undefined') window.VirtualMachine = module.exports;
