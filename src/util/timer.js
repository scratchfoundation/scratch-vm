/**
 * @fileoverview
 * A utility for accurately measuring time.
 * To use:
 * ---
 * var timer = new Timer();
 * timer.start();
 * ... pass some time ...
 * var timeDifference = timer.timeElapsed();
 * ---
 * Or, you can use the `time` and `relativeTime`
 * to do some measurement yourself.
 */

/**
 * @constructor
 */
var Timer = function () {};

/**
 * Used to store the start time of a timer action.
 * Updated when calling `timer.start`.
 */
Timer.prototype.startTime = 0;

/**
 * Return the currently known absolute time, in ms precision.
 * @returns {number} ms elapsed since 1 January 1970 00:00:00 UTC.
 */
Timer.prototype.time = function () {
    if (Date.now) {
        return Date.now();
    } else {
        return new Date().getTime();
    }
};

/**
 * Returns a time accurate relative to other times produced by this function.
 * If possible, will use sub-millisecond precision.
 * If not, will use millisecond precision.
 * Not guaranteed to produce the same absolute values per-system.
 * @returns {number} ms-scale accurate time relative to other relative times.
 */
Timer.prototype.relativeTime = function () {
    if (typeof self !== 'undefined' &&
        self.performance && 'now' in self.performance) {
        return self.performance.now();
    } else {
        return this.time();
    }
};

/**
 * Start a timer for measuring elapsed time,
 * at the most accurate precision possible.
 */
Timer.prototype.start = function () {
    this.startTime = this.relativeTime();
};

/**
 * Check time elapsed since `timer.start` was called.
 * @returns {number} Time elapsed, in ms (possibly sub-ms precision).
 */
Timer.prototype.timeElapsed = function () {
    return this.relativeTime() - this.startTime;
};

module.exports = Timer;
