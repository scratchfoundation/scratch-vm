var Timer = require('../util/timer');
var Thread = require('./thread');
var YieldTimers = require('../util/yieldtimers.js');
var execute = require('./execute.js');

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
Sequencer.WORK_TIME = 10;

/**
 * If set, block calls, args, and return values will be logged to the console.
 * @const {boolean}
 */
Sequencer.DEBUG_BLOCK_CALLS = true;

/**
 * Step through all threads in `this.threads`, running them in order.
 * @param {Array.<Thread>} threads List of which threads to step.
 * @return {Array.<Thread>} All threads which have finished in this iteration.
 */
Sequencer.prototype.stepThreads = function (threads) {
    // Start counting toward WORK_TIME
    this.timer.start();
    // List of threads which have been killed by this step.
    var inactiveThreads = [];
    // If all of the threads are yielding, we should yield.
    var numYieldingThreads = 0;
    // While there are still threads to run and we are within WORK_TIME,
    // continue executing threads.
    while (threads.length > 0 &&
           threads.length > numYieldingThreads &&
           this.timer.timeElapsed() < Sequencer.WORK_TIME) {
        // New threads at the end of the iteration.
        var newThreads = [];
        // Attempt to run each thread one time
        for (var i = 0; i < threads.length; i++) {
            var activeThread = threads[i];
            if (activeThread.status === Thread.STATUS_RUNNING) {
                // Normal-mode thread: step.
                this.stepThread(activeThread);
            } else if (activeThread.status === Thread.STATUS_YIELD) {
                // Yield-mode thread: check if the time has passed.
                YieldTimers.resolve(activeThread.yieldTimerId);
                numYieldingThreads++;
            } else if (activeThread.status === Thread.STATUS_DONE) {
                // Moved to a done state - finish up
                activeThread.status = Thread.STATUS_RUNNING;
                // @todo Deal with the return value
            }
            // First attempt to pop from the stack
            if (activeThread.stack.length > 0 &&
                activeThread.nextBlock === null &&
                activeThread.status === Thread.STATUS_DONE) {
                activeThread.nextBlock = activeThread.stack.pop();
                // Don't pop stack frame - we need the data.
                // A new one won't be created when we execute.
                if (activeThread.nextBlock !== null) {
                    activeThread.status === Thread.STATUS_RUNNING;
                }
            }
            if (activeThread.nextBlock === null &&
                activeThread.status === Thread.STATUS_DONE) {
                // Finished with this thread - tell runtime to clean it up.
                inactiveThreads.push(activeThread);
            } else {
                // Keep this thead in the loop.
                newThreads.push(activeThread);
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
    if (!currentBlock || !this.runtime.blocks.getBlock(currentBlock)) {
        thread.status = Thread.STATUS_DONE;
        return;
    }
    thread.nextBlock = this.runtime.blocks.getNextBlock(currentBlock);

    execute(this, thread, currentBlock, false);
};

module.exports = Sequencer;
