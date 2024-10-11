const Timer = require('../util/timer');

/**
 * Recycle bin for empty stackFrame objects
 * @type Array<_StackFrame>
 */
const _stackFrameFreeList = [];

/**
 * Default params object for stack frames outside of a procedure.
 *
 * StackFrame.params uses a null prototype object. It does not have Object
 * methods like hasOwnProperty. With a null prototype
 * `typeof params[key] !== 'undefined'` has similar behaviour to hasOwnProperty.
 * @type {object}
 */
const defaultParams = Object.create(null);

/**
 * A frame used for each level of the stack. A general purpose place to store a
 * bunch of execution contexts and parameters.
 * @constructor
 * @private
 */
class _StackFrame {
    constructor () {
        /**
         * Whether this level of the stack is a loop.
         * @type {boolean}
         */
        this.isLoop = false;

        /**
         * Whether this level is in warp mode. Set to true by the sequencer for
         * some procedures.
         *
         * After being set to true at the beginning of a procedure a thread
         * will be in warpMode until it pops a stack frame to reveal one that
         * is not in warpMode. Either this value is always false for a stack
         * frame or always true after a procedure sets it.
         * @type {boolean}
         */
        this.warpMode = false;

        /**
         * Procedure parameters.
         *
         * After being set by a procedure these values do not change and they
         * will be copied to deeper stack frames.
         * @type {Object}
         */
        this.params = defaultParams;

        /**
         * A context passed to block implementations.
         * @type {Object}
         */
        this.executionContext = {};

        /**
         * Has this frame changed and need a reset?
         * @type {boolean}
         */
        this.needsReset = false;
    }

    /**
     * Reset some properties of the frame to default values. Used to recycle.
     * @return {_StackFrame} this
     */
    reset () {
        this.isLoop = false;
        this.executionContext = {};
        this.needsReset = false;

        return this;
    }

    /**
     * Create or recycle a stack frame object.
     * @param {_StackFrame} parent Parent frame to copy "immutable" values.
     * @returns {_StackFrame} The clean stack frame with correct warpMode
     *   setting.
     */
    static create (parent) {
        const stackFrame = _stackFrameFreeList.pop() || new _StackFrame();
        stackFrame.warpMode = parent.warpMode;
        stackFrame.params = parent.params;
        return stackFrame;
    }

    /**
     * Put a stack frame object into the recycle bin for reuse.
     * @param {_StackFrame} stackFrame The frame to reset and recycle.
     */
    static release (stackFrame) {
        if (stackFrame !== null) {
            _stackFrameFreeList.push(
                stackFrame.needsReset ? stackFrame.reset() : stackFrame
            );
        }
    }
}

/**
 * The initial stack frame for all threads. A call to pushStack will create the
 * first to be used frame for a thread. That first frame will use the initial
 * values from initialStackFrame.
 * @type {_StackFrame}
 */
const initialStackFrame = new _StackFrame();

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
        this.pointer = firstBlock;

        /**
         * Stack frames for the thread. Store metadata for the executing blocks.
         * @type {Array.<_StackFrame>}
         */
        this.stackFrames = [];

        /**
         * The current stack frame that goes along with the pointer.
         * @type {_StackFrame}
         */
        this.stackFrame = _StackFrame.create(initialStackFrame);

        /**
         * Status of the thread, one of five states (below)
         * @type {number}
         */
        this.status = Thread.STATUS_RUNNING;

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
         * Which block ID should glow during this frame, if any.
         * @type {?string}
         */
        this.blockGlowInFrame = null;

        /**
         * A timer for when the thread enters warp mode.
         * Substitutes the sequencer's count toward WORK_TIME on a per-thread basis.
         * @type {?Timer}
         */
        this.warpTimer = new Timer();

        /**
         * Whether a promise just resolved on this thread and is waiting for its value to be used.
         * @type {boolean}
         */
        this.justResolved = false;

        /**
         * The value just reported by a promise.
         */
        this.resolvedValue = null;

        /**
         * The ID of the block that we're currently promise-waiting on.
         * @type {?string}
         */
        this.reportingBlockId = null;

        /**
         * All blocks evaluated before a promise-waiting block was evaluated and the thread was paused. Contains all
         * blocks located before the promise-waiting block in the operations list,
         * at the time that the thread was paused.
         * @type {Array.<{oldOpID: string, inputValue: (string | number | boolean)}>}
         */
        this.reported = null;

        /**
         * Number of times this thread has been restarted. Used to make sure resuming block promises don't do anything
         * across restarts.
         * @type {number}
         */
        this.generation = 0;
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
        this.stackFrames.push(parent);
        this.stackFrame = _StackFrame.create(parent);
    }

    /**
     * Move the instruction pointer to the last value before this stack of
     * blocks was pushed and executed.
     * @return {?string} Block ID popped from the stack.
     */
    popStack () {
        const lastPointer = this.pointer;
        this.pointer = this.stack.pop() || null;
        _StackFrame.release(this.stackFrame);
        this.stackFrame = this.stackFrames.pop() || null;
        return lastPointer;
    }

    /**
     * Move the instruction pointer to the last procedure call block and resume
     * execution there or to the end of this thread and stop executing this
     * thread.
     */
    stopThisScript () {
        let blockID = this.pointer;
        while (blockID !== null) {
            const block = this.target.blocks.getBlock(blockID);
            if (typeof block !== 'undefined' && block.opcode === 'procedures_call') {
                // Move execution to the next block in the script that called this procedure
                this.goToNextBlock();
                break;
            }
            this.popStack();
            blockID = this.pointer;
        }

        if (this.stackFrame === null) {
            // Clean up!
            this.blockGlowInFrame = null;
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
     * Pause a thread while waiting on a promise, saving the state needed to resume.
     * @param {string} reportingBlockId The ID of the block we are waiting on.
     * @param {Array.<{oldOpID: string, inputValue: (string | number | boolean)}>} reported The results of the
     * operations executed so far.
     */
    pause (reportingBlockId, reported) {
        this.status = Thread.STATUS_PROMISE_WAIT;
        this.reportingBlockId = reportingBlockId;
        this.reported = reported;
    }

    /**
     * Resume a thread once a promise resolves, storing the value that it resolved to.
     * @param {(string | number | boolean)} reportedValue The value returned by the block promise.
     */
    resume (reportedValue) {
        this.status = Thread.STATUS_RUNNING;
        this.justResolved = true;
        this.resolvedValue = reportedValue;
    }

    /**
     * Reset thread resume state after the resolved promise value is handled.
     */
    finishResuming () {
        this.justResolved = false;
        this.resolvedValue = null;
        this.reportingBlockId = null;
        this.reported = null;
    }

    /**
     * Retire this thread in the middle, without considering further blocks.
     */
    retire () {
        this.stack = [];
        this.pointer = null;
        this.stackFrames = [];
        this.stackFrame = null;
        this.blockGlowInFrame = null;
        this.status = Thread.STATUS_DONE;
    }

    /**
     * Restart this thread from the beginning.
     */
    restart () {
        this.pointer = this.topBlock;
        this.stack.length = 0;
        // Release stack frame so we can immediately reuse it
        if (this.stackFrame) _StackFrame.release(this.stackFrame);
        this.stackFrame = _StackFrame.create(initialStackFrame);
        this.stackFrames.length = 0;
        this.blockGlowInFrame = null;
        this.finishResuming();
        this.generation++;
        this.status = Thread.STATUS_RUNNING;
    }

    /**
     * Return an execution context for a block to use.
     * @returns {object} the execution context
     */
    getExecutionContext () {
        const frame = this.stackFrame;
        frame.needsReset = true;
        return frame.executionContext;
    }

    /**
     * Initialize procedure parameters on this stack frame.
     */
    initParams () {
        this.stackFrame.params = Object.create(null);
    }

    /**
     * Add a parameter to the stack frame.
     * Use when calling a procedure with parameter values.
     * @param {!string} paramName Name of parameter.
     * @param {*} value Value to set for parameter.
     */
    pushParam (paramName, value) {
        this.stackFrame.params[paramName] = value;
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
        return this.pointer === this.topBlock;
    }


    /**
     * Switch the thread to the next block at the current level of the stack.
     * For example, this is used in a standard sequence of blocks,
     * where execution proceeds from one block to the next.
     */
    goToNextBlock () {
        this.pointer = this.target.blocks.getNextBlock(this.pointer);
        if (this.stackFrame.needsReset) this.stackFrame.reset();
    }

    /**
     * Attempt to determine whether a procedure call is recursive, by examining
     * the stack.
     * @param {!string} procedureCode Procedure code of procedure being called.
     * @return {boolean} True if the call appears recursive.
     */
    isRecursiveCall (procedureCode) {
        const stackHeight = this.stack.length;
        // Limit the number of stack levels that are examined for procedures.
        const stackBottom = Math.max(stackHeight - 5, 0);
        for (let i = stackHeight - 1; i >= stackBottom; i--) {
            const block = this.target.blocks.getBlock(this.stack[i]);
            if (block.opcode === 'procedures_call' &&
                block.mutation.proccode === procedureCode) {
                return true;
            }
        }
        return false;
    }
}

module.exports = Thread;
