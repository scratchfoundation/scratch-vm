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

class Timer {
    constructor (nowObj = Timer.nowObj) {
        /**
         * Used to store the start time of a timer action.
         * Updated when calling `timer.start`.
         */
        this.startTime = 0;

        /**
         * Used to pass custom logic for determining the value for "now",
         * which is sometimes useful for compatibility with Scratch 2
         */
        this.nowObj = nowObj;
    }

    /**
     * Disable use of self.performance for now as it results in lower performance
     * However, instancing it like below (caching the self.performance to a local variable) negates most of the issues.
     * @type {boolean}
     */
    static get USE_PERFORMANCE () {
        return false;
    }

    /**
     * Legacy object to allow for us to call now to get the old style date time (for backwards compatibility)
     * @deprecated This is only called via the nowObj.now() if no other means is possible...
     */
    static get legacyDateCode () {
        return {
            now: function () {
                return new Date().getTime();
            }
        };
    }

    /**
     * Use this object to route all time functions through single access points.
     */
    static get nowObj () {
        if (Timer.USE_PERFORMANCE && typeof self !== 'undefined' && self.performance && 'now' in self.performance) {
            return self.performance;
        } else if (Date.now) {
            return Date;
        }
        return Timer.legacyDateCode;
    }

    /**
     * Return the currently known absolute time, in ms precision.
     * @returns {number} ms elapsed since 1 January 1970 00:00:00 UTC.
     */
    time () {
        return this.nowObj.now();
    }

    /**
     * Returns a time accurate relative to other times produced by this function.
     * If possible, will use sub-millisecond precision.
     * If not, will use millisecond precision.
     * Not guaranteed to produce the same absolute values per-system.
     * @returns {number} ms-scale accurate time relative to other relative times.
     */
    relativeTime () {
        return this.nowObj.now();
    }

    /**
     * Start a timer for measuring elapsed time,
     * at the most accurate precision possible.
     */
    start () {
        this.startTime = this.nowObj.now();
    }

    timeElapsed () {
        return this.nowObj.now() - this.startTime;
    }

    /**
     * Call a handler function after a specified amount of time has elapsed.
     * @param {function} handler - function to call after the timeout
     * @param {number} timeout - number of milliseconds to delay before calling the handler
     * @returns {number} - the ID of the new timeout
     */
    setTimeout (handler, timeout) {
        return global.setTimeout(handler, timeout);
    }

    /**
     * Clear a timeout from the pending timeout pool.
     * @param {number} timeoutId - the ID returned by `setTimeout()`
     * @memberof Timer
     */
    clearTimeout (timeoutId) {
        global.clearTimeout(timeoutId);
    }
}

module.exports = Timer;
