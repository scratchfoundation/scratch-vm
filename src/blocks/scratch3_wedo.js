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
     * Current motor speed as a percentage (50 = half speed).
     * @type {Number}
     */
    this._motorSpeed = 50;

    // /**
    //  * Current motor directions (1 or -1)
    //  * @type {Number}
    //  */
    this._motorDirections = {
        A: 1,
        B: 1,
        external: 1
    };
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
        wedo_motorspeed: this.motorSpeed,
        wedo_motorturndegrees: this.motorTurnDegrees,
        wedo_motorsetdirection: this.motorSetDirection,
        wedo_distance: this.distance,
        wedo_tilt: this.tilt
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
        // @todo Handle CHOICE and NUM for vertical and horizontal grammars
        if (typeof window.ext !== 'undefined') {
            window.ext.postMessage({
                extension: 'wedo',
                method: 'lightSet',
                args: [Cast.toNumber(args.CHOICE)]
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
    // @todo Handle CHOICE and NUM for vertical and horizontal grammars
    var speed = Cast.toNumber(args.CHOICE);
    this._motorSpeed = MathUtil.clamp(speed, 0, 100);
};

Scratch3WedoBlocks.prototype.motorTurnDegrees = function(args) {
    var degrees = Cast.toNumber(args.DEGREES);
    var direction = this._motorDirections[args.MOTOR];
    if (typeof window.ext !== 'undefined') {
        window.ext.postMessage({
            extension: 'wedo',
            method: 'motorTurnDegrees',
            args: [args.MOTOR, degrees, direction]
        });
    }
};

Scratch3WedoBlocks.prototype.motorSetDirection = function(args) {
    if (args.DIRECTION === 'clockwise') {
        this._motorDirections[args.MOTOR] = 1;
    }
    if (args.DIRECTION === 'counter-clockwise') {
        this._motorDirections[args.MOTOR] = -1;
    }
    if (args.DIRECTION === 'reverse') {
        this._motorDirections[args.MOTOR] *= -1;
    }
};

Scratch3WedoBlocks.prototype.distance = function(args) {
    if (typeof window.ext === 'undefined') return 0;
    if (typeof window.ext.distance === 'undefined') return 0;

    var distance = Cast.toNumber(window.ext.distance);
    var mapped = MathUtil.map(distance, 0, 7, 0, 100);
    return Math.round(mapped);
};

Scratch3WedoBlocks.prototype.tilt = function(args) {
    if (typeof window.ext === 'undefined') return 0;
    if (typeof window.ext.tilt === 'undefined') return 0;

    var distance = Cast.toNumber(window.ext.tilt[args.CHOICE]);
    var mapped = MathUtil.map(distance, -45, 45, -100, 100);
    return Math.round(mapped);
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
        if (typeof window.ext !== 'undefined') {
            window.ext.postMessage({
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
            if (typeof window.ext !== 'undefined') {
                window.ext.postMessage({
                    extension: 'wedo',
                    method: 'motorStop',
                    args: []
                });
            }
        }
    }
};

module.exports = Scratch3WedoBlocks;
