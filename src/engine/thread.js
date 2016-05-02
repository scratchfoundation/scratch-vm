/**
 * A thread is a running stack context and all the metadata needed.
 * @param {?string} firstBlock First block to execute in the thread.
 * @constructor
 */
function Thread (firstBlock) {
    /**
     * Top block of the thread
     */
    this.topBlock = firstBlock;
    /**
     * Next block that the thread will execute.
     * @type {string}
     */
    this.nextBlock = firstBlock;
    /**
     * Stack for the thread. When the sequencer enters a control structure,
     * the block is pushed onto the stack so we know where to exit.
     * @type {Array.<string>}
     */
    this.stack = [];
}

module.exports = Thread;
