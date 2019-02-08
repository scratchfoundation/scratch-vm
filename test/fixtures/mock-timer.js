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
         * Array of pending timeout callbacks
         * @type {Array.<Object>}
         */
        this._timeouts = [];
    }

    /**
     * Advance this MockTimer's idea of "current time", running timeout handlers if appropriate.
     * @param {number} delta - the amount of time to add to the current mock time value, in milliseconds.
     * @memberof MockTimer
     */
    advanceMockTime (delta) {
        if (delta < 0) {
            throw new Error('Time may not move backward');
        }
        this._mockTime += delta;
        this._runTimeouts();
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
     * @memberof MockTimer
     */
    setTimeout (handler, timeout) {
        this._timeouts.push({
            time: this._mockTime + timeout,
            handler
        });
        this._runTimeouts();
    }

    /**
     * Run any timeout handlers whose timeouts have expired.
     * @memberof MockTimer
     */
    _runTimeouts () {
        const ready = [];
        const waiting = [];

        // partition timeout records by whether or not they're ready to call
        this._timeouts.forEach(o => {
            const isReady = o.time <= this._mockTime;
            (isReady ? ready : waiting).push(o);
        });

        this._timeouts = waiting;

        // next tick, call everything that's ready
        global.setTimeout(() => {
            ready.forEach(o => o.handler());
        }, 0);
    }
}

module.exports = MockTimer;
