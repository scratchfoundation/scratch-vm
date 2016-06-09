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
    var currentBlockId = thread.nextBlock;
    if (!currentBlockId || !this.runtime.blocks.getBlock(currentBlockId)) {
        thread.status = Thread.STATUS_DONE;
        return;
    }
    // Start showing run feedback in the editor.
    this.runtime.glowBlock(currentBlockId, true);
    // Execute the block
    execute(this, thread, currentBlockId, false);
    // If the block executed without yielding, move to done.
    if (thread.status === Thread.STATUS_RUNNING && !thread.switchedStack) {
        this.proceedThread(thread, currentBlockId);
    }
};

/**
 * Step a thread into a block's substack.
 * @param {!Thread} thread Thread object to step to substack.
 * @param {string} currentBlockId Block which owns a substack to step to.
 */
Sequencer.prototype.stepToSubstack = function (thread, currentBlockId) {
    // Set nextBlock to the start of the substack
    var substack = this.runtime.blocks.getSubstack(currentBlockId);
    if (substack && substack.value) {
        thread.nextBlock = substack.value;
    } else {
        thread.nextBlock = null;
    }
    thread.switchedStack = true;
};

/**
 * Finish stepping a thread and proceed it to the next block.
 * @param {!Thread} thread Thread object to proceed.
 * @param {string} currentBlockId Block we are finished with.
 */
Sequencer.prototype.proceedThread = function (thread, currentBlockId) {
    // Stop showing run feedback in the editor.
    this.runtime.glowBlock(currentBlockId, false);
    // Mark the thread as done and proceed to the next block.
    thread.status = Thread.STATUS_DONE;
    // Refresh nextBlock in case it has changed during a yield.
    thread.nextBlock = this.runtime.blocks.getNextBlock(currentBlockId);
    // If none is available, attempt to pop from the stack.
    // First attempt to pop from the stack
    if (!thread.nextBlock && thread.stack.length > 0) {
        thread.nextBlock = thread.popStack();
    }
};

module.exports = Sequencer;
