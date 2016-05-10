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
     * ID of next block that the thread will execute, or null if none.
     * @type {?string}
     */
    this.nextBlock = firstBlock;
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
     * Yield timer ID (for checking when the thread should unyield).
     * @type {number}
     */
    this.yieldTimerId = -1;
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

module.exports = Thread;
