/**
 * @fileoverview Timers that are synchronized with the Scratch sequencer.
 */
var Timer = require('./timer');

function YieldTimers () {}

/**
 * Shared collection of timers.
 * Each timer is a [Function, number] with the callback
 * and absolute time for it to run.
 * @type {Object.<number,Array>}
 */
YieldTimers.timers = {};

/**
 * Monotonically increasing timer ID.
 * @type {number}
 */
YieldTimers.timerId = 0;

/**
 * Utility for measuring time.
 * @type {!Timer}
 */
YieldTimers.globalTimer = new Timer();

/**
 * The timeout function is passed to primitives and is intended
 * as a convenient replacement for window.setTimeout.
 * The sequencer will attempt to resolve the timer every time
 * the yielded thread would have been stepped.
 * @param {!Function} callback To be called when the timer is done.
 * @param {number} timeDelta Time to wait, in ms.
 * @return {number} Timer ID to be used with other methods.
 */
YieldTimers.timeout = function (callback, timeDelta) {
    var id = ++YieldTimers.timerId;
    YieldTimers.timers[id] = [
        callback,
        YieldTimers.globalTimer.time() + timeDelta
    ];
    return id;
};

/**
 * Attempt to resolve a timeout.
 * If the time has passed, call the callback.
 * Otherwise, do nothing.
 * @param {number} id Timer ID to resolve.
 * @return {boolean} True if the timer has resolved.
 */
YieldTimers.resolve = function (id) {
    var timer = YieldTimers.timers[id];
    if (!timer) {
        // No such timer.
        return false;
    }
    var callback = timer[0];
    var time = timer[1];
    if (YieldTimers.globalTimer.time() < time) {
        // Not done yet.
        return false;
    }
    // Execute the callback and remove the timer.
    callback();
    delete YieldTimers.timers[id];
    return true;
};

module.exports = YieldTimers;
