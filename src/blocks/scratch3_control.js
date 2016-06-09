function Scratch3ControlBlocks(runtime) {
    /**
     * The runtime instantiating this block package.
     * @type {Runtime}
     */
    this.runtime = runtime;
}

/**
 * Retrieve the block primitives implemented by this package.
 * @return {Object.<string, Function>} Mapping of opcode to Function.
 */
Scratch3ControlBlocks.prototype.getPrimitives = function() {
    return {
        'control_repeat': this.repeat,
        'control_forever': this.forever,
        'control_wait': this.wait,
        'control_stop': this.stop
    };
};

Scratch3ControlBlocks.prototype.repeat = function(argValues, util) {
    // Initialize loop
    if (util.stackFrame.loopCounter === undefined) {
        util.stackFrame.loopCounter = parseInt(argValues[0]); // @todo arg
    }
    // Decrease counter
    util.stackFrame.loopCounter--;
    // If we still have some left, start the substack
    if (util.stackFrame.loopCounter >= 0) {
        util.startSubstack();
    }
};

Scratch3ControlBlocks.prototype.forever = function(argValues, util) {
    util.startSubstack();
};

Scratch3ControlBlocks.prototype.wait = function(argValues, util) {
    util.yield();
    util.timeout(function() {
        util.done();
    }, 1000 * parseFloat(argValues[0]));
};

Scratch3ControlBlocks.prototype.stop = function() {
    // @todo - don't use this.runtime
    this.runtime.stopAll();
};

module.exports = Scratch3ControlBlocks;
