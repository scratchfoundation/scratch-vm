function Scratch3EventBlocks(runtime) {
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
Scratch3EventBlocks.prototype.getPrimitives = function() {
    return {
        'event_whenflagclicked': this.whenFlagClicked,
        'event_whenbroadcastreceived': this.whenBroadcastReceived,
        'event_broadcast': this.broadcast
    };
};


Scratch3EventBlocks.prototype.whenFlagClicked = function() {
    // No-op
};

Scratch3EventBlocks.prototype.whenBroadcastReceived = function() {
    // No-op
};

Scratch3EventBlocks.prototype.broadcast = function(argValues, util) {
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

module.exports = Scratch3EventBlocks;
