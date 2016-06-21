var EventEmitter = require('events');
var util = require('util');

var Blocks = require('./engine/blocks');
var Runtime = require('./engine/runtime');

/**
 * Whether the environment is a WebWorker.
 * @const{boolean}
 */
var ENV_WORKER = typeof importScripts === 'function';

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

/*
 * Worker Handlers
 */
if (ENV_WORKER) {
    self.vmInstance = new VirtualMachine();
    self.onmessage = function (e) {
        var messageData = e.data;
        switch (messageData.method) {
        case 'start':
            self.vmInstance.runtime.start();
            break;
        case 'greenFlag':
            self.vmInstance.runtime.greenFlag();
            break;
        case 'stopAll':
            self.vmInstance.runtime.stopAll();
            break;
        case 'blockListener':
            self.vmInstance.blockListener(messageData.args);
            break;
        case 'flyoutBlockListener':
            self.vmInstance.flyoutBlockListener(messageData.args);
            break;
        case 'getPlaygroundData':
            self.postMessage({
                method: 'playgroundData',
                blocks: self.vmInstance.blocks,
                threads: self.vmInstance.runtime.threads
            });
            break;
        default:
            throw 'Unknown method' + messageData.method;
        }
    };
    // Bind runtime's emitted events to postmessages.
    self.vmInstance.runtime.on(Runtime.STACK_GLOW_ON, function (id) {
        self.postMessage({method: Runtime.STACK_GLOW_ON, id: id});
    });
    self.vmInstance.runtime.on(Runtime.STACK_GLOW_OFF, function (id) {
        self.postMessage({method: Runtime.STACK_GLOW_OFF, id: id});
    });
    self.vmInstance.runtime.on(Runtime.BLOCK_GLOW_ON, function (id) {
        self.postMessage({method: Runtime.BLOCK_GLOW_ON, id: id});
    });
    self.vmInstance.runtime.on(Runtime.BLOCK_GLOW_OFF, function (id) {
        self.postMessage({method: Runtime.BLOCK_GLOW_OFF, id: id});
    });
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
