/**
 * Recycle bin for empty stackFrame objects
 * @type Array<_StackFrame>
 */
const _stackFrameFreeList = [];

/**
 * Default params object to for stack frames not inside a procedure.
 * @type {object}
 */
const defaultParams = Object.create(null);

/**
 * A frame used for each level of the stack. A general purpose
 * place to store a bunch of execution context and parameters
 * @param {boolean} warpMode Whether this level of the stack is warping
 * @constructor
 * @private
 */
class _StackFrame {
    constructor (warpMode, params) {
        /**
         * Whether this level of the stack is a loop.
         * @type {boolean}
         */
        this.isLoop = false;

        /**
         * Whether this level is in warp mode.  Is set by some legacy blocks and
         * "turbo mode"
         * @type {boolean}
         */
        this.warpMode = warpMode;

        /**
         * Procedure parameters.
         * @type {Object}
         */
        this.params = params;

        /**
         * A context passed to block implementations.
         * @type {Object}
         */
        this.executionContext = {};

        /**
         * Has this frame changed and need a reset?
         * @type {boolean}
         */
        this.needReset = false;
    }

    /**
     * Reset some properties of the frame to default values. Used to recycle.
     * @return {_StackFrame} this
     */
    reset () {
        this.isLoop = false;
        this.executionContext = {};
        this.needReset = false;

        return this;
    }

    /**
     * Reuse an active stack frame in the stack.
     */
    reuse () {
        this.isLoop = false;
        this.executionContext = {};
        this.needReset = false;
    }

    /**
     * Create or recycle a stack frame object.
     * @param {boolean} warpMode Enable warpMode on this frame.
     * @param {object} params Carry over parameters from the parent stack frame.
     * @returns {_StackFrame} The clean stack frame with correct warpMode setting.
     */
    static create (warpMode, params) {
        const stackFrame = _stackFrameFreeList.pop() || null;
        if (stackFrame !== null) {
            stackFrame.warpMode = warpMode;
            stackFrame.params = params;
            return stackFrame;
        }
        return new _StackFrame(warpMode, params);
    }

    /**
     * Put a stack frame object into the recycle bin for reuse.
     * @param {_StackFrame} stackFrame The frame to reset and recycle.
     */
    static release (stackFrame) {
        if (stackFrame !== null) {
            _stackFrameFreeList.push(
                stackFrame.needReset ? stackFrame.reset() : stackFrame
            );
        }
    }
}

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
         * The "instruction" pointer the thread is currently at. This
         * determines what block is executed.
         * @type {string}
         */
        this.pointer = null;

        /**
         * Stack frames for the thread. Store metadata for the executing blocks.
         * @type {Array.<_StackFrame>}
         */
        this.stackFrames = [];

        /**
         * The current stack frame that goes along with the pointer.
         * @type {_StackFrame}
         */
        this.stackFrame = null;

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
         * The Blocks this thread will execute.
         * @type {Blocks}
         */
        this.blockContainer = null;

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

        /**
         * The value just reported by a promise.
         * @type {*}
         */
        this.justReported = null;

        /**
         * The id of the block that we will report the promise resolved value
         * for.
         * @type {string}
         */
        this.reporting = null;

        /**
         * The already reported values in a sequence of blocks to restore when
         * the awaited promise resolves.
         * @type {Array.<*>}
         */
        this.reported = null;
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
        this.stack.push(this.pointer);
        this.pointer = blockId;

        const parent = this.stackFrame;
        const warpMode = parent === null ? false : parent.warpMode;
        const params = parent === null ? defaultParams : parent.params;
        this.stackFrames.push(this.stackFrame);
        this.stackFrame = _StackFrame.create(warpMode, params);
    }

    /**
     * Reset the stack frame for use by the next block.
     * (avoids popping and re-pushing a new stack frame - keeps the warpmode the same
     * @param {string} blockId Block ID to push to stack.
     */
    reuseStackForNextBlock (blockId) {
        this.pointer = blockId;
        if (this.stackFrame.needReset) this.stackFrame.reuse();
    }

    /**
     * Pop last block on the stack and its stack frame.
     * @return {?string} Block ID popped from the stack.
     */
    popStack () {
        const popped = this.pointer;
        this.pointer = this.stack.pop();
        _StackFrame.release(this.stackFrame);
        this.stackFrame = this.stackFrames.pop();
        // Conform to existing unit tests. Return undefined if popped and
        // pointer are falsy values.
        if (!popped && !this.pointer) return;
        return popped || null;
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
        return this.pointer;
    }


    /**
     * Get top stack frame.
     * @return {?object} Last stack frame stored on this thread.
     */
    peekStackFrame () {
        return this.stackFrame;
    }

    /**
     * Get stack frame above the current top.
     * @return {?object} Second to last stack frame stored on this thread.
     */
    peekParentStackFrame () {
        return this.stackFrames.length > 0 ? this.stackFrames[this.stackFrames.length - 1] : null;
    }

    /**
     * Push a reported value to the parent of the current stack frame.
     * @param {*} value Reported value to push.
     */
    pushReportedValue (value) {
        this.justReported = typeof value === 'undefined' ? null : value;
    }

    /**
     * Return a execution context for a block to use.
     * @returns {object} the execution context
     */
    getExecutionContext () {
        const frame = this.stackFrame;
        frame.needReset = true;
        return frame.executionContext;
    }

    /**
     * Initialize procedure parameters on this stack frame.
     */
    initParams () {
        const stackFrame = this.stackFrame;
        stackFrame.params = Object.create(null);
    }

    /**
     * Add a parameter to the stack frame.
     * Use when calling a procedure with parameter values.
     * @param {!string} paramName Name of parameter.
     * @param {*} value Value to set for parameter.
     */
    pushParam (paramName, value) {
        const stackFrame = this.stackFrame;
        stackFrame.params[paramName] = value;
    }

    /**
     * Get a parameter at the lowest possible level of the stack.
     * @param {!string} paramName Name of parameter.
     * @return {*} value Value for parameter.
     */
    getParam (paramName) {
        const stackFrame = this.stackFrame;
        if (typeof stackFrame.params[paramName] !== 'undefined') {
            return stackFrame.params[paramName];
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
        const nextBlockId = this.target.blocks.getNextBlock(this.pointer);
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
        const sp = this.stack.length;
        for (let i = sp - 1; i >= 1; i--) {
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
