var EventEmitter = require('events');
var util = require('util');

var Blocks = require('./engine/blocks');
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
    instance.blocks = new Blocks();
    instance.runtime = new Runtime(instance.blocks);

    /**
     * Event listeners for scratch-blocks.
     */
    instance.blockListener = (
        instance.blocks.generateBlockListener(false, instance.runtime)
    );

    instance.flyoutBlockListener = (
        instance.blocks.generateBlockListener(true, instance.runtime)
    );
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
