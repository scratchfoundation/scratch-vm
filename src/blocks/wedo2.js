
function WeDo2Blocks(runtime) {
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
WeDo2Blocks.prototype.getPrimitives = function() {
    return {
        'wedo_motorclockwise': this.motorClockwise,
        'wedo_motorcounterclockwise': this.motorCounterClockwise,
        'wedo_motorspeed': this.motorSpeed,
        'wedo_setcolor': this.setColor,
        'wedo_whendistanceclose': this.whenDistanceClose,
        'wedo_whentilt': this.whenTilt
    };
};

WeDo2Blocks.prototype.motorClockwise = function() {
    console.log('Running: wedo_motorclockwise');
};

WeDo2Blocks.prototype.motorCounterClockwise = function() {
    console.log('Running: wedo_motorcounterclockwise');
};

WeDo2Blocks.prototype.motorSpeed = function() {
    console.log('Running: wedo_motorspeed');
};

WeDo2Blocks.prototype.setColor = function() {
    console.log('Running: wedo_setcolor');
};

WeDo2Blocks.prototype.whenDistanceClose = function() {
    console.log('Running: wedo_whendistanceclose');
};

WeDo2Blocks.prototype.whenTilt = function() {
    console.log('Running: wedo_whentilt');
};

module.exports = WeDo2Blocks;
