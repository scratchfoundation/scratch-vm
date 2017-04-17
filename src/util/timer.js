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
const Timer = function () {};

/**
 * Used to store the start time of a timer action.
 * Updated when calling `timer.start`.
 */
Timer.prototype.startTime = 0;

/**
 * Disable use of self.performance for now as it results in lower performance
 * However, instancing it like below (caching the self.performance to a local variable) negates most of the issues.
 * @type {boolean}
 */
const USE_PERFORMANCE = false;

/**
 * Legacy object to allow for us to call now to get the old style date time (for backwards compatibility)
 * @deprecated This is only called via the nowObj.now() if no other means is possible...
 */
const legacyDateCode = {
    now: function () {
        return new Date().getTime();
    }
};

/**
 * Use this object to route all time functions through single access points.
 */
const nowObj = (USE_PERFORMANCE && typeof self !== 'undefined' && self.performance && 'now' in self.performance) ?
    self.performance : Date.now ? Date : legacyDateCode;

/**
 * Return the currently known absolute time, in ms precision.
 * @returns {number} ms elapsed since 1 January 1970 00:00:00 UTC.
 */
Timer.prototype.time = function () {
    return nowObj.now();
};

/**
 * Returns a time accurate relative to other times produced by this function.
 * If possible, will use sub-millisecond precision.
 * If not, will use millisecond precision.
 * Not guaranteed to produce the same absolute values per-system.
 * @returns {number} ms-scale accurate time relative to other relative times.
 */
Timer.prototype.relativeTime = function () {
    return nowObj.now();
};

/**
 * Start a timer for measuring elapsed time,
 * at the most accurate precision possible.
 */
Timer.prototype.start = function () {
    this.startTime = nowObj.now();
};

Timer.prototype.timeElapsed = function () {
    return nowObj.now() - this.startTime;
};

module.exports = Timer;
