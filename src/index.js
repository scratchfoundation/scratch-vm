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
    EventEmitter.call(instance);
    instance.runtime = new Runtime();

    /**
     * Event listener for blockly. Handles validation and serves as a generic
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
    };

    // @todo UI listener

    // @todo Forward runtime events

    // Event dispatcher
    // this.types = keymirror({
    //     // Messages to runtime
    //     CREATE_BLOCK: null,
    //     MOVE_BLOCK: null,
    //     CHANGE_BLOCK: null,
    //     DELETE_BLOCK: null,
    //
    //     ADD_DEVICE: null,
    //     REMOVE_DEVICE: null,
    //
    //     RUN_STRIP: null,
    //     RUN_ALL_STRIPS: null,
    //     STOP_ALL_STRIPS: null,
    //     RUN_PALETTE_BLOCK: null,
    //
    //     // Messages from runtime - subscribe to these
    //     FEEDBACK_EXECUTING_BLOCK: null,
    //     FEEDBACK_STOPPED_EXECUTING_BLOCK: null,
    //     DEVICE_RUN_OP: null,
    //     DEVICE_STOP_OP: null,
    //
    //     // Tell back the interpreter device has finished an op
    //     DEVICE_FINISHED_OP: null
    // });

    // Bind block event stream
    // setTimeout(function () {
    //     _this.emit('foo', 'bar');
    // }, 1000);
}

/**
 * Inherit from EventEmitter
 */
util.inherits(VirtualMachine, EventEmitter);

// VirtualMachine.prototype.changeListener = function (e) {
//     var _this = this;
//     console.dir(this);
//
//     switch (e.type) {
//     case 'create':
//         console.dir(e);
//         _this.runtime.createBlock(
//             e.blockId,
//             event.xml.attributes.type.value
//         );
//         break;
//     case 'change':
//         // @todo
//         break;
//     case 'move':
//         // @todo
//         break;
//     case 'delete':
//         // @todo
//         break;
//     }
// };
//
// VirtualMachine.prototype.tapListener = function (e) {
//     // @todo
// };

VirtualMachine.prototype.start = function () {
    this.runtime.runAllGreenFlags();
};

VirtualMachine.prototype.stop = function () {
    this.runtime.stop();
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
