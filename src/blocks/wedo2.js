
var YieldTimers = require('../util/yieldtimers.js');

function WeDo2Blocks(runtime) {
    /**
     * The runtime instantiating this block package.
     * @type {Runtime}
     */
    this.runtime = runtime;

    /**
     * Current motor speed, as a percentage (100 = full speed).
     * @type {number}
     * @private
     */
    this._motorSpeed = 100;

    /**
     * The timeout ID for a pending motor action.
     * @type {?int}
     * @private
     */
    this._motorTimeout = null;
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

/**
 * Clamp a value between a minimum and maximum value.
 * @todo move this to a common utility class.
 * @param val The value to clamp.
 * @param min The minimum return value.
 * @param max The maximum return value.
 * @returns {number} The clamped value.
 * @private
 */
WeDo2Blocks.prototype._clamp = function(val, min, max) {
    return Math.max(min, Math.min(val, max));
};

/**
 * Common implementation for motor blocks.
 * @param direction The direction to turn ('left' or 'right').
 * @param durationSeconds The number of seconds to run.
 * @param util The util instance to use for yielding and finishing.
 * @private
 */
WeDo2Blocks.prototype._motorOnFor = function(direction, durationSeconds, util) {
    if (this._motorTimeout > 0) {
        // @todo maybe this should go through util
        YieldTimers.resolve(this._motorTimeout);
        this._motorTimeout = null;
    }
    if (window.native) {
        window.native.motorRun(direction, this._motorSpeed);
    }

    var instance = this;
    var myTimeout = this._motorTimeout = util.timeout(function() {
        if (instance._motorTimeout == myTimeout) {
            instance._motorTimeout = null;
        }
        if (window.native) {
            window.native.motorStop();
        }
        util.done();
    }, 1000 * durationSeconds);

    util.yield();
};

WeDo2Blocks.prototype.motorClockwise = function(argValues, util) {
    this._motorOnFor('right', parseFloat(argValues[0]), util);
};

WeDo2Blocks.prototype.motorCounterClockwise = function(argValues, util) {
    this._motorOnFor('left', parseFloat(argValues[0]), util);
};

WeDo2Blocks.prototype.motorSpeed = function(argValues) {
    var speed = argValues[0];
    switch (speed) {
    case 'slow':
        this._motorSpeed = 20;
        break;
    case 'medium':
        this._motorSpeed = 50;
        break;
    case 'fast':
        this._motorSpeed = 100;
        break;
    }
};

/**
 * Convert a color name to a WeDo color index.
 * Supports 'mystery' for a random hue.
 * @param colorName The color to retrieve.
 * @returns {number} The WeDo color index.
 * @private
 */
WeDo2Blocks.prototype._getColor = function(colorName) {
    var colors = {
        'yellow': 7,
        'orange': 8,
        'coral': 9,
        'magenta': 1,
        'purple': 2,
        'blue': 3,
        'green': 6,
        'white': 10
    };

    if (colorName == 'mystery') {
        return Math.floor((Math.random() * 10) + 1);
    }

    return colors[colorName];
};

WeDo2Blocks.prototype.setColor = function(argValues, util) {
    if (window.native) {
        var colorIndex = this._getColor(argValues[0]);
        window.native.setLedColor(colorIndex);
    }
    // Pause for quarter second
    util.yield();
    util.timeout(function() {
        util.done();
    }, 250);
};

WeDo2Blocks.prototype.whenDistanceClose = function() {
    console.log('Running: wedo_whendistanceclose');
};

WeDo2Blocks.prototype.whenTilt = function() {
    console.log('Running: wedo_whentilt');
};

module.exports = WeDo2Blocks;
