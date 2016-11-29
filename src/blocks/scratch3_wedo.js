var Cast = require('../util/cast');
var MathUtil = require('../util/math-util');
var Timer = require('../util/timer');

var Scratch3WedoBlocks = function (runtime) {
    /**
     * The runtime instantiating this block package.
     * @type {Runtime}
     */
    this.runtime = runtime;

    /**
     * Current motor speed as a percentage (100 = full speed).
     * @type {Number}
     */
    this._motorSpeed = 100;
};

/**
 * Retrieve the block primitives implemented by this package.
 * @return {Object.<string, Function>} Mapping of opcode to Function.
 */
Scratch3WedoBlocks.prototype.getPrimitives = function () {
    return {
        wedo_setcolor: this.setColor,
        wedo_motorclockwise: this.motorClockwise,
        wedo_motorcounterclockwise: this.motorCounterClockwise,
        wedo_motorspeed: this.motorSpeed
    };
};

 Scratch3WedoBlocks.prototype.getHats = function () {
     return {
         wedo_whentilt: {
             restartExistingThreads: true
         },
         wedo_whendistanceclose: {
             restartExistingThreads: true
         }
     };
 };

Scratch3WedoBlocks.prototype.setColor = function(args, util) {
    // Pause for quarter second
    if (!util.stackFrame.timer) {
        // If extension interface is available, send LED color "set" command
        if (typeof window.extensions !== 'undefined') {
            var colorIndex = this._getColor(Cast.toString(args.CHOICE));
            window.extensions.postMessage({
                                          extension: 'wedo',
                                          method: 'lightSet',
                                          args: [colorIndex]
                                          });
        }
        
        // Yield
        util.stackFrame.timer = new Timer();
        util.stackFrame.timer.start();
        util.yield();
    } else {
        if (util.stackFrame.timer.timeElapsed() < 250) {
            util.yield();
        }
    }
};

Scratch3WedoBlocks.prototype.motorClockwise = function(args, util) {
    this._motorOnFor('right', Cast.toNumber(args.DURATION), util);
};

Scratch3WedoBlocks.prototype.motorCounterClockwise = function(args, util) {
    this._motorOnFor('left', Cast.toNumber(args.DURATION), util);
};

Scratch3WedoBlocks.prototype.motorSpeed = function(args) {
    var speed = Cast.toString(args.CHOICE);
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
Scratch3WedoBlocks.prototype._getColor = function(colorName) {
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

/**
 * Common implementation for motor blocks.
 * @param direction The direction to turn ('left' or 'right').
 * @param durationSeconds The number of seconds to run.
 * @param util The util instance to use for yielding and finishing.
 * @private
 */
Scratch3WedoBlocks.prototype._motorOnFor = function(direction, durationSeconds, util) {
    // Start motor and begin timer
    if (!util.stackFrame.timer) {
        // If extension interface is available, send LED color "set" command
        if (typeof window.extensions !== 'undefined') {
            window.extensions.postMessage({
                extension: 'wedo',
                method: 'motorRun',
                args: [direction, this._motorSpeed]
            });
        }
        
        // Yield
        util.stackFrame.timer = new Timer();
        util.stackFrame.timer.start();
        util.yield();
    } else {
        if (util.stackFrame.timer.timeElapsed() < 1000 * durationSeconds) {
            util.yield();
        } else {
            if (typeof window.extensions !== 'undefined') {
                window.extensions.postMessage({
                    extension: 'wedo',
                    method: 'motorStop',
                    args: []
                });
            }
        }
    }
};

module.exports = Scratch3WedoBlocks;
