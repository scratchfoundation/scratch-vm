var Timer = require('../util/timer');

function Sequencer (runtime) {
    /**
     * A utility timer for timing thread sequencing.
     * @type {!Timer}
     */
    this.timer = new Timer();

    /**
     * Reference to the runtime owning this sequencer.
     * @type {!Runtime}
     */
    this.runtime = runtime;
}

/**
 * The sequencer does as much work as it can within WORK_TIME milliseconds,
 * then yields. This is essentially a rate-limiter for blocks.
 * In Scratch 2.0, this is set to 75% of the target stage frame-rate (30fps).
 * @const {!number}
 */
Sequencer.WORK_TIME = 1000 / 60;

/**
 * Step through all threads in `this.threads`, running them in order.
 * @return {Array.<Thread>} All threads which have finished in this iteration.
 */
Sequencer.prototype.stepThreads = function (threads) {
    // Start counting toward WORK_TIME
    this.timer.start();
    // List of threads which have been killed by this step.
    var inactiveThreads = [];
    // While there are still threads to run and we are within WORK_TIME,
    // continue executing threads.
    while (threads.length > 0 &&
           this.timer.timeElapsed() < Sequencer.WORK_TIME) {
        // New threads at the end of the iteration.
        var newThreads = [];
        // Attempt to run each thread one time
        for (var i = 0; i < threads.length; i++) {
            var activeThread = threads[i];
            this.stepThread(activeThread);
            if (activeThread.nextBlock !== null) {
                newThreads.push(activeThread);
            } else {
                inactiveThreads.push(activeThread);
            }
        }
        // Effectively filters out threads that have stopped.
        threads = newThreads;
    }
    return inactiveThreads;
};

/**
 * Step the requested thread
 * @param {!Thread} thread Thread object to step
 */
Sequencer.prototype.stepThread = function (thread) {
    // Save the current block and set the nextBlock.
    // If the primitive would like to do control flow,
    // it can overwrite nextBlock.
    var currentBlock = thread.nextBlock;
    thread.nextBlock = this.runtime._getNextBlock(thread.nextBlock);

    var opcode = this.runtime._getOpcode(currentBlock);

    if (!opcode) {
        console.warn('Could not get opcode for block: ' + currentBlock);
    }
    else {
        var blockFunction = this.runtime.getOpcodeFunction(opcode);
        if (!blockFunction) {
            console.warn('Could not get implementation for opcode: ' + opcode);
        }
        else {
            try {
                blockFunction();
            }
            catch(e) {
                console.error('Exception calling block function',
                    {opcode: opcode, exception: e});
            }
        }
    }

};

module.exports = Sequencer;
