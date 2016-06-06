var EventEmitter = require('events');
var util = require('util');

var Blocks = require('./engine/blocks');
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
    instance.blocks = new Blocks();
    instance.runtime = new Runtime(instance.blocks);

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
            var newBlocks = adapter(e);
            // A create event can create many blocks. Add them all.
            for (var i = 0; i < newBlocks.length; i++) {
                instance.blocks.createBlock(newBlocks[i], false);
            }
            break;
        case 'change':
            instance.blocks.changeBlock({
                id: e.blockId,
                element: e.element,
                name: e.name,
                value: e.newValue
            });
            break;
        case 'move':
            instance.blocks.moveBlock({
                id: e.blockId,
                oldParent: e.oldParentId,
                oldInput: e.oldInputName,
                newParent: e.newParentId,
                newInput: e.newInputName
            });
            break;
        case 'delete':
            instance.blocks.deleteBlock({
                id: e.blockId
            });
            break;
        case 'stackclick':
            instance.runtime.toggleStack(e.blockId);
            break;
        }
    };

    instance.flyoutBlockListener = function (e) {
        switch (e.type) {
        case 'create':
            var newBlocks = adapter(e);
            // A create event can create many blocks. Add them all.
            for (var i = 0; i < newBlocks.length; i++) {
                instance.blocks.createBlock(newBlocks[i], true);
            }
            break;
        case 'change':
            instance.blocks.changeBlock({
                id: e.blockId,
                element: e.element,
                name: e.name,
                value: e.newValue
            });
            break;
        case 'delete':
            instance.blocks.deleteBlock({
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
