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
     * Target of this thread.
     * @type {?Target}
     */
    this.target = null;

    /**
     * Whether the thread requests its script to glow during this frame.
     * @type {boolean}
     */
    this.requestScriptGlowInFrame = false;
}

/**
 * Thread status for initialized or running thread.
 * This is the default state for a thread - execution should run normally,
 * stepping from block to block.
 * @const
 */
Thread.STATUS_RUNNING = 0;

/**
 * Threads are in this state when a primitive is waiting on a promise;
 * execution is paused until the promise changes thread status.
 * @const
 */
Thread.STATUS_PROMISE_WAIT = 1;

/**
 * Thread status for yield.
 * @const
 */
Thread.STATUS_YIELD = 2;

/**
 * Thread status for a finished/done thread.
 * Thread is in this state when there are no more blocks to execute.
 * @const
 */
Thread.STATUS_DONE = 3;

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
            isLoop: false, // Whether this level of the stack is a loop.
            reported: {}, // Collects reported input values.
            waitingReporter: null, // Name of waiting reporter.
            params: {}, // Procedure parameters.
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
 * Get stack frame above the current top.
 * @return {?Object} Second to last stack frame stored on this thread.
 */
Thread.prototype.peekParentStackFrame = function () {
    return this.stackFrames[this.stackFrames.length - 2];
};

/**
 * Push a reported value to the parent of the current stack frame.
 * @param {!Any} value Reported value to push.
 */
Thread.prototype.pushReportedValue = function (value) {
    var parentStackFrame = this.peekParentStackFrame();
    if (parentStackFrame) {
        var waitingReporter = parentStackFrame.waitingReporter;
        parentStackFrame.reported[waitingReporter] = value;
    }
};

Thread.prototype.pushParam = function (paramName, value) {
    var stackFrame = this.peekStackFrame();
    stackFrame.params[paramName] = value;
};

Thread.prototype.getParam = function (paramName) {
    for (var i = this.stackFrames.length - 1; i >= 0; i--) {
        var frame = this.stackFrames[i];
        if (frame.params.hasOwnProperty(paramName)) {
            return frame.params[paramName];
        }
    }
    return null;
};

/**
 * Whether the current execution of a thread is at the top of the stack.
 * @return {Boolean} True if execution is at top of the stack.
 */
Thread.prototype.atStackTop = function () {
    return this.peekStack() === this.topBlock;
};

/**
 * Set thread target.
 * @param {?Target} target Target for this thread.
 */
Thread.prototype.setTarget = function (target) {
    this.target = target;
};

/**
 * Get thread target.
 * @return {?Target} Target for this thread, if available.
 */
Thread.prototype.getTarget = function () {
    return this.target;
};

Thread.prototype.goToNextBlock = function () {
    var nextBlockId = this.target.blocks.getNextBlock(this.peekStack());
    this.popStack();
    this.pushStack(nextBlockId);
};

module.exports = Thread;
