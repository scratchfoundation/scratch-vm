var YieldTimers = require('../util/yieldtimers.js');

/**
 * A thread is a running stack context and all the metadata needed.
 * @param {?string} firstBlock First block to execute in the thread.
 * @constructor
 */
function Thread (firstBlock) {
    /**
     * ID of top block of the thread
     * @type {!string}
     */
    this.topBlock = firstBlock;

    /**
     * Stack for the thread. When the sequencer enters a control structure,
     * the block is pushed onto the stack so we know where to exit.
     * @type {Array.<string>}
     */
    this.stack = [];

    /**
     * Stack frames for the thread. Store metadata for the executing blocks.
     * @type {Array.<Object>}
     */
    this.stackFrames = [];

    /**
     * Status of the thread, one of three states (below)
     * @type {number}
     */
    this.status = 0; /* Thread.STATUS_RUNNING */

    /**
     * Execution-synced timeouts.
     * @type {number}
     */
    this.timeoutIds = [];
}

/**
 * Thread status for initialized or running thread.
 * Threads are in this state when the primitive is called for the first time.
 * @const
 */
Thread.STATUS_RUNNING = 0;

/**
 * Thread status for a yielded thread.
 * Threads are in this state when a primitive has yielded.
 * @const
 */
Thread.STATUS_YIELD = 1;

/**
 * Thread status for a finished/done thread.
 * Thread is moved to this state when the interpreter
 * can proceed with execution.
 * @const
 */
Thread.STATUS_DONE = 2;

/**
 * Push stack and update stack frames appropriately.
 * @param {string} blockId Block ID to push to stack.
 */
Thread.prototype.pushStack = function (blockId) {
    this.stack.push(blockId);
    // Push an empty stack frame, if we need one.
    // Might not, if we just popped the stack.
    if (this.stack.length > this.stackFrames.length) {
        this.stackFrames.push({
            reported: {}, // Collects reported input values.
            waitingReporter: null, // Name of waiting reporter.
            executionContext: {} // A context passed to block implementations.
        });
    }
};

/**
 * Pop last block on the stack and its stack frame.
 * @return {string} Block ID popped from the stack.
 */
Thread.prototype.popStack = function () {
    this.stackFrames.pop();
    return this.stack.pop();
};

/**
 * Get top stack item.
 * @return {?string} Block ID on top of stack.
 */
Thread.prototype.peekStack = function () {
    return this.stack[this.stack.length - 1];
};


/**
 * Get top stack frame.
 * @return {?Object} Last stack frame stored on this thread.
 */
Thread.prototype.peekStackFrame = function () {
    return this.stackFrames[this.stackFrames.length - 1];
};

/**
 * Push a reported value to the parent of the current stack frame.
 * @param {!Any} value Reported value to push.
 */
Thread.prototype.pushReportedValue = function (value) {
    var parentStackFrame = this.stackFrames[this.stackFrames.length - 2];
    if (parentStackFrame) {
        var waitingReporter = parentStackFrame.waitingReporter;
        parentStackFrame.reported[waitingReporter] = value;
        parentStackFrame.waitingReporter = null;
    }
};

/**
 * Yields the thread.
 */
Thread.prototype.yield = function () {
    this.status = Thread.STATUS_YIELD;
};

/**
 * Add an execution-synced timeouts for this thread.
 * See also: util/yieldtimers.js:timeout
 * @param {!Function} callback To be called when the timer is done.
 * @param {number} timeDelta Time to wait, in ms.
 */
Thread.prototype.addTimeout = function (callback, timeDelta) {
    var timeoutId = YieldTimers.timeout(callback, timeDelta);
    this.timeoutIds.push(timeoutId);
};

/**
 * Attempt to resolve all execution-synced timeouts on this thread.
 */
Thread.prototype.resolveTimeouts = function () {
    var newTimeouts = [];
    for (var i = 0; i < this.timeoutIds.length; i++) {
        var resolved = YieldTimers.resolve(this.timeoutIds[i]);
        if (!resolved) {
            newTimeouts.push(this.timeoutIds[i]);
        }
    }
    this.timeoutIds = newTimeouts;
};

module.exports = Thread;
