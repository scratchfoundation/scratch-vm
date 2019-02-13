/**
 * Mimic the Timer class with external control of the "time" value, allowing tests to run more quickly and
 * reliably. Multiple instances of this class operate independently: they may report different time values, and
 * advancing one timer will not trigger timeouts set on another.
 */
class MockTimer {
    /**
     * Creates an instance of MockTimer.
     * @param {*} [nowObj=null] - alert the caller that this parameter, supported by Timer, is not supported here.
     * @memberof MockTimer
     */
    constructor (nowObj = null) {
        if (nowObj) {
            throw new Error('nowObj is not implemented in MockTimer');
        }

        /**
         * The fake "current time" value, in epoch milliseconds.
         * @type {number}
         */
        this._mockTime = 0;

        /**
         * Used to store the start time of a timer action.
         * Updated when calling `timer.start`.
         * @type {number}
         */
        this.startTime = 0;

        /**
         * The ID to use the next time `setTimeout` is called.
         * @type {number}
         */
        this._nextTimeoutId = 1;

        /**
         * Map of timeout ID to pending timeout callback info.
         * @type {Map.<Object>}
         * @property {number} time - the time at/after which this handler should run
         * @property {Function} handler - the handler to call when the time comes
         */
        this._timeouts = new Map();
    }

    /**
     * Advance this MockTimer's idea of "current time", running timeout handlers if appropriate.
     *
     * @param {number} milliseconds - the amount of time to add to the current mock time value, in milliseconds.
     * @memberof MockTimer
     */
    advanceMockTime (milliseconds) {
        if (milliseconds < 0) {
            throw new Error('Time may not move backward');
        }
        this._mockTime += milliseconds;
        this._runTimeouts();
    }

    /**
     * Advance this MockTimer's idea of "current time", running timeout handlers if appropriate.
     *
     * @param {number} milliseconds - the amount of time to add to the current mock time value, in milliseconds.
     * @returns {Promise} - promise which resolves after timeout handlers have had an opportunity to run.
     * @memberof MockTimer
     */
    advanceMockTimeAsync (milliseconds) {
        return new Promise(resolve => {
            this.advanceMockTime(milliseconds);
            global.setTimeout(resolve, 0);
        });
    }

    /**
     * @returns {number} - current mock time elapsed since 1 January 1970 00:00:00 UTC.
     * @memberof MockTimer
     */
    time () {
        return this._mockTime;
    }

    /**
     * Returns a time accurate relative to other times produced by this function.
     * @returns {number} ms-scale accurate time relative to other relative times.
     * @memberof MockTimer
     */
    relativeTime () {
        return this._mockTime;
    }

    /**
     * Start a timer for measuring elapsed time.
     * @memberof MockTimer
     */
    start () {
        this.startTime = this._mockTime;
    }

    /**
     * @returns {number} - the time elapsed since `start()` was called.
     * @memberof MockTimer
     */
    timeElapsed () {
        return this._mockTime - this.startTime;
    }

    /**
     * Call a handler function after a specified amount of time has elapsed.
     * Guaranteed to happen in between "ticks" of JavaScript.
     * @param {function} handler - function to call after the timeout
     * @param {number} timeout - number of milliseconds to delay before calling the handler
     * @returns {number} - the ID of the new timeout.
     * @memberof MockTimer
     */
    setTimeout (handler, timeout) {
        const timeoutId = this._nextTimeoutId++;
        this._timeouts.set(timeoutId, {
            time: this._mockTime + timeout,
            handler
        });
        this._runTimeouts();
        return timeoutId;
    }

    /**
     * Clear a particular timeout from the pending timeout pool.
     * @param {number} timeoutId - the value returned from `setTimeout()`
     * @memberof MockTimer
     */
    clearTimeout (timeoutId) {
        this._timeouts.delete(timeoutId);
    }

    /**
     * WARNING: this method has no equivalent in `Timer`. Do not use this method outside of tests!
     * @returns {boolean} - true if there are any pending timeouts, false otherwise.
     * @memberof MockTimer
     */
    hasTimeouts () {
        return this._timeouts.size > 0;
    }

    /**
     * Run any timeout handlers whose timeouts have expired.
     * @memberof MockTimer
     */
    _runTimeouts () {
        const ready = [];

        this._timeouts.forEach((timeoutRecord, timeoutId) => {
            const isReady = timeoutRecord.time <= this._mockTime;
            if (isReady) {
                ready.push(timeoutRecord);
                this._timeouts.delete(timeoutId);
            }
        });

        // sort so that earlier timeouts run before later timeouts
        ready.sort((a, b) => a.time < b.time);

        // next tick, call everything that's ready
        global.setTimeout(() => {
            ready.forEach(o => o.handler());
        }, 0);
    }
}

module.exports = MockTimer;
