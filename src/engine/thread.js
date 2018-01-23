/**
 * A thread is a running stack context and all the metadata needed.
 * @param {?string} firstBlock First block to execute in the thread.
 * @constructor
 */
class Thread {
    constructor (firstBlock) {
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
         * Whether the thread is killed in the middle of execution.
         * @type {boolean}
         */
        this.isKilled = false;

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

        /**
         * Which block ID should glow during this frame, if any.
         * @type {?string}
         */
        this.blockGlowInFrame = null;

        /**
         * A timer for when the thread enters warp mode.
         * Substitutes the sequencer's count toward WORK_TIME on a per-thread basis.
         * @type {?Timer}
         */
        this.warpTimer = null;
    }

    /**
     * Thread status for initialized or running thread.
     * This is the default state for a thread - execution should run normally,
     * stepping from block to block.
     * @const
     */
    static get STATUS_RUNNING () {
        return 0;
    }

    /**
     * Threads are in this state when a primitive is waiting on a promise;
     * execution is paused until the promise changes thread status.
     * @const
     */
    static get STATUS_PROMISE_WAIT () {
        return 1;
    }

    /**
     * Thread status for yield.
     * @const
     */
    static get STATUS_YIELD () {
        return 2;
    }

    /**
     * Thread status for a single-tick yield. This will be cleared when the
     * thread is resumed.
     * @const
     */
    static get STATUS_YIELD_TICK () {
        return 3;
    }

    /**
     * Thread status for a finished/done thread.
     * Thread is in this state when there are no more blocks to execute.
     * @const
     */
    static get STATUS_DONE () {
        return 4;
    }

    /**
     * Push stack and update stack frames appropriately.
     * @param {string} blockId Block ID to push to stack.
     */
    pushStack (blockId) {
        this.stack.push(blockId);
        // Push an empty stack frame, if we need one.
        // Might not, if we just popped the stack.
        if (this.stack.length > this.stackFrames.length) {
            // Copy warp mode from any higher level.
            let warpMode = false;
            if (this.stackFrames.length > 0 && this.stackFrames[this.stackFrames.length - 1]) {
                warpMode = this.stackFrames[this.stackFrames.length - 1].warpMode;
            }
            this.stackFrames.push({
                isLoop: false, // Whether this level of the stack is a loop.
                warpMode: warpMode, // Whether this level is in warp mode.
                reported: {}, // Collects reported input values.
                waitingReporter: null, // Name of waiting reporter.
                params: {}, // Procedure parameters.
                executionContext: {} // A context passed to block implementations.
            });
        }
    }

    /**
     * Reset the stack frame for use by the next block.
     * (avoids popping and re-pushing a new stack frame - keeps the warpmode the same
     * @param {string} blockId Block ID to push to stack.
     */
    reuseStackForNextBlock (blockId) {
        this.stack[this.stack.length - 1] = blockId;
        const frame = this.stackFrames[this.stackFrames.length - 1];
        frame.isLoop = false;
        // frame.warpMode = warpMode;   // warp mode stays the same when reusing the stack frame.
        frame.reported = {};
        frame.waitingReporter = null;
        frame.params = {};
        frame.executionContext = {};
    }

    /**
     * Pop last block on the stack and its stack frame.
     * @return {string} Block ID popped from the stack.
     */
    popStack () {
        this.stackFrames.pop();
        return this.stack.pop();
    }

    /**
     * Pop back down the stack frame until we hit a procedure call or the stack frame is emptied
     */
    stopThisScript () {
        let blockID = this.peekStack();
        while (blockID !== null) {
            const block = this.target.blocks.getBlock(blockID);
            if (typeof block !== 'undefined' && block.opcode === 'procedures_call') {
                break;
            }
            this.popStack();
            blockID = this.peekStack();
        }

        if (this.stack.length === 0) {
            // Clean up!
            this.requestScriptGlowInFrame = false;
            this.status = Thread.STATUS_DONE;
        }
    }

    /**
     * Get top stack item.
     * @return {?string} Block ID on top of stack.
     */
    peekStack () {
        return this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
    }


    /**
     * Get top stack frame.
     * @return {?object} Last stack frame stored on this thread.
     */
    peekStackFrame () {
        return this.stackFrames.length > 0 ? this.stackFrames[this.stackFrames.length - 1] : null;
    }

    /**
     * Get stack frame above the current top.
     * @return {?object} Second to last stack frame stored on this thread.
     */
    peekParentStackFrame () {
        return this.stackFrames.length > 1 ? this.stackFrames[this.stackFrames.length - 2] : null;
    }

    /**
     * Push a reported value to the parent of the current stack frame.
     * @param {*} value Reported value to push.
     */
    pushReportedValue (value) {
        const parentStackFrame = this.peekParentStackFrame();
        if (parentStackFrame) {
            const waitingReporter = parentStackFrame.waitingReporter;
            parentStackFrame.reported[waitingReporter] = value;
        }
    }

    /**
     * Add a parameter to the stack frame.
     * Use when calling a procedure with parameter values.
     * @param {!string} paramName Name of parameter.
     * @param {*} value Value to set for parameter.
     */
    pushParam (paramName, value) {
        const stackFrame = this.peekStackFrame();
        stackFrame.params[paramName] = value;
    }

    /**
     * Get a parameter at the lowest possible level of the stack.
     * @param {!string} paramName Name of parameter.
     * @return {*} value Value for parameter.
     */
    getParam (paramName) {
        for (let i = this.stackFrames.length - 1; i >= 0; i--) {
            const frame = this.stackFrames[i];
            if (frame.params.hasOwnProperty(paramName)) {
                return frame.params[paramName];
            }
        }
        return null;
    }

    /**
     * Whether the current execution of a thread is at the top of the stack.
     * @return {boolean} True if execution is at top of the stack.
     */
    atStackTop () {
        return this.peekStack() === this.topBlock;
    }


    /**
     * Switch the thread to the next block at the current level of the stack.
     * For example, this is used in a standard sequence of blocks,
     * where execution proceeds from one block to the next.
     */
    goToNextBlock () {
        const nextBlockId = this.target.blocks.getNextBlock(this.peekStack());
        this.reuseStackForNextBlock(nextBlockId);
    }

    /**
     * Attempt to determine whether a procedure call is recursive,
     * by examining the stack.
     * @param {!string} procedureCode Procedure code of procedure being called.
     * @return {boolean} True if the call appears recursive.
     */
    isRecursiveCall (procedureCode) {
        let callCount = 5; // Max number of enclosing procedure calls to examine.
        const sp = this.stack.length - 1;
        for (let i = sp - 1; i >= 0; i--) {
            const block = this.target.blocks.getBlock(this.stack[i]);
            if (block.opcode === 'procedures_call' &&
                block.mutation.proccode === procedureCode) {
                return true;
            }
            if (--callCount < 0) return false;
        }
        return false;
    }
}

module.exports = Thread;
