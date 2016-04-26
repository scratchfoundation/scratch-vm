function Thread () {
    /**
     * Next block that the thread will execute.
     * @type {string}
     */
    this.nextBlock = null;
    /**
     * Stack for the thread. When the sequencer enters a control structure,
     * the block is pushed onto the stack so we know where to exit.
     * @type {Array.<string>}
     */
    this.stack = [];
}

module.exports = Thread;
