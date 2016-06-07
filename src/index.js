var EventEmitter = require('events');
var util = require('util');

var Runtime = require('./engine/runtime');
var adapter = require('./engine/adapter');

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

        // UI event: clicked stacks toggle in the runtime.
        if (e.element === 'stackclick') {
            instance.runtime.toggleStack(e.blockId);
            return;
        }

        // Block create/update/destroy
        switch (e.type) {
        case 'create':
            instance.runtime.createBlock(adapter(e), false);
            break;
        case 'change':
            instance.runtime.changeBlock({
                id: e.blockId,
                element: e.element,
                name: e.name,
                value: e.newValue
            });
            break;
        case 'move':
            instance.runtime.moveBlock({
                id: e.blockId,
                oldParent: e.oldParentId,
                oldField: e.oldInputName,
                newParent: e.newParentId,
                newField: e.newInputName
            });
            break;
        case 'delete':
            instance.runtime.deleteBlock({
                id: e.blockId
            });
            break;
        }
    };

    instance.flyoutBlockListener = function (e) {
        switch (e.type) {
        case 'create':
            instance.runtime.createBlock(adapter(e), true);
            break;
        case 'change':
            instance.runtime.changeBlock({
                id: e.blockId,
                element: e.element,
                name: e.name,
                value: e.newValue
            });
            break;
        case 'delete':
            instance.runtime.deleteBlock({
                id: e.blockId
            });
            break;
        case 'stackclick':
            instance.runtime.toggleStack(e.blockId);
            break;
        }
    };
}

/**
 * Inherit from EventEmitter
 */
util.inherits(VirtualMachine, EventEmitter);

/**
 * Export and bind to `window`
 */
module.exports = VirtualMachine;
if (typeof window !== 'undefined') window.VirtualMachine = module.exports;
