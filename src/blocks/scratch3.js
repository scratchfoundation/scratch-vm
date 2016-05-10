function Scratch3Blocks(runtime) {
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
Scratch3Blocks.prototype.getPrimitives = function() {
    return {
        'control_repeat': this.repeat,
        'control_forever': this.forever,
        'control_wait': this.wait,
        'control_stop': this.stop,
        'event_whenflagclicked': this.whenFlagClicked,
        'event_whenbroadcastreceived': this.whenBroadcastReceived,
        'event_broadcast': this.broadcast
    };
};

Scratch3Blocks.prototype.repeat = function(argValues, util) {
    console.log('Running: control_repeat');
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

Scratch3Blocks.prototype.forever = function(argValues, util) {
    console.log('Running: control_forever');
    util.startSubstack();
};

Scratch3Blocks.prototype.wait = function(argValues, util) {
    console.log('Running: control_wait');
    util.yield();
    util.timeout(function() {
        util.done();
    }, 1000 * parseFloat(argValues[0]));
};

Scratch3Blocks.prototype.stop = function() {
    console.log('Running: control_stop');
    // @todo - don't use this.runtime
    this.runtime.stopAll();
};

Scratch3Blocks.prototype.whenFlagClicked = function() {
    console.log('Running: event_whenflagclicked');
    // No-op
};

Scratch3Blocks.prototype.whenBroadcastReceived = function() {
    console.log('Running: event_whenbroadcastreceived');
    // No-op
};

Scratch3Blocks.prototype.broadcast = function(argValues, util) {
    console.log('Running: event_broadcast');
    util.startHats(function(hat) {
        if (hat.opcode === 'event_whenbroadcastreceived') {
            var shadows = hat.fields.CHOICE.blocks;
            for (var sb in shadows) {
                var shadowblock = shadows[sb];
                return shadowblock.fields.CHOICE.value === argValues[0];
            }
        }
        return false;
    });
};

module.exports = Scratch3Blocks;
