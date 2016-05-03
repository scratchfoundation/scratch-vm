
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
 * Convert HSV to RGB.
 * See https://en.wikipedia.org/wiki/HSL_and_HSV#From_HSV
 * @todo move this to a common utility class.
 * @param hueDegrees Hue, in degrees.
 * @param saturation Saturation in the range [0,1].
 * @param value Value in the range [0,1].
 * @returns {number[]} An array of [r,g,b], each in the range [0,255].
 * @private
 */
WeDo2Blocks.prototype._HSVToRGB = function(hueDegrees, saturation, value) {
    hueDegrees %= 360;
    if (hueDegrees < 0) hueDegrees += 360;
    saturation = this._clamp(saturation, 0, 1);
    value = this._clamp(value, 0, 1);

    var chroma = value * saturation;
    var huePrime = hueDegrees / 60;
    var x = chroma * (1 - Math.abs(huePrime % 2 - 1));
    var rgb;
    switch (Math.floor(huePrime)) {
    case 0:
        rgb = [chroma, x, 0];
        break;
    case 1:
        rgb = [x, chroma, 0];
        break;
    case 2:
        rgb = [0, chroma, x];
        break;
    case 3:
        rgb = [0, x, chroma];
        break;
    case 4:
        rgb = [x, 0, chroma];
        break;
    case 5:
        rgb = [chroma, 0, x];
        break;
    }

    var m = value - chroma;
    rgb[0] = (rgb[0] + m) * 255;
    rgb[1] = (rgb[1] + m) * 255;
    rgb[2] = (rgb[2] + m) * 255;

    return rgb;
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
        YieldTimers.reject(this._motorTimeout);
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
 * Convert a color name to an [r,b,g] array.
 * Supports 'mystery' for a random hue.
 * @param colorName The color to retrieve.
 * @returns {number[]} The [r,g,b] values for the color in [0,255] range.
 * @private
 */
WeDo2Blocks.prototype._getColor = function(colorName) {
    if (colorName == 'mystery') {
        return this._HSVToRGB(Math.random() * 360, 1, 1);
    }
    return {
        'yellow': [255, 255, 0],
        'orange': [255, 165, 0],
        'coral': [255, 127, 80],
        'magenta': [255, 0, 255],
        'purple': [128, 0, 128],
        'blue': [0, 0, 255],
        'green': [0, 255, 0],
        'white': [255, 255, 255]
    }[colorName];
};

WeDo2Blocks.prototype.setColor = function(argValues, util) {
    if (window.native) {
        var rgbColor = this._getColor(argValues[0]);
        window.native.setLedColor(rgbColor[0], rgbColor[1], rgbColor[2]);
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
