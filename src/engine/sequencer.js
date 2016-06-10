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
        // Reset yielding thread count.
        numYieldingThreads = 0;
        // Attempt to run each thread one time
        for (var i = 0; i < threads.length; i++) {
            var activeThread = threads[i];
            if (activeThread.status === Thread.STATUS_RUNNING) {
                // Normal-mode thread: step.
                this.startThread(activeThread);
            } else if (activeThread.status === Thread.STATUS_YIELD) {
                // Yield-mode thread: check if the time has passed.
                if (!YieldTimers.resolve(activeThread.yieldTimerId)) {
                    // Thread is still yielding
                    // if YieldTimers.resolve returns false.
                    numYieldingThreads++;
                }
            } else if (activeThread.status === Thread.STATUS_DONE) {
                // Moved to a done state - finish up
                activeThread.status = Thread.STATUS_RUNNING;
                // @todo Deal with the return value
            }
            if (activeThread.stack.length === 0 &&
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
Sequencer.prototype.startThread = function (thread) {
    var currentBlockId = thread.peekStack();
    if (!currentBlockId) {
        // A "null block" - empty substack. Pop the stack.
        thread.popStack();
        thread.status = Thread.STATUS_DONE;
        return;
    }
    // Start showing run feedback in the editor.
    this.runtime.glowBlock(currentBlockId, true);

    // Execute the current block
    execute(this, thread);

    // If the block executed without yielding and without doing control flow,
    // move to done.
    if (thread.status === Thread.STATUS_RUNNING &&
        thread.peekStack() === currentBlockId) {
        this.proceedThread(thread, currentBlockId);
    }
};

/**
 * Step a thread into a block's substack.
 * @param {!Thread} thread Thread object to step to substack.
 * @param {Number} substackNum Which substack to step to (i.e., 1, 2).
 */
Sequencer.prototype.stepToSubstack = function (thread, substackNum) {
    if (!substackNum) {
        substackNum = 1;
    }
    var currentBlockId = thread.peekStack();
    var substackId = this.runtime.blocks.getSubstack(
        currentBlockId,
        substackNum
    );
    if (substackId) {
        // Push substack ID to the thread's stack.
        thread.pushStack(substackId);
    } else {
        // Push null, so we come back to the current block.
        thread.pushStack(null);
    }
};

/**
 * Finish stepping a thread and proceed it to the next block.
 * @param {!Thread} thread Thread object to proceed.
 */
Sequencer.prototype.proceedThread = function (thread) {
    var currentBlockId = thread.peekStack();
    // Mark the status as done and proceed to the next block.
    this.runtime.glowBlock(currentBlockId, false);
    thread.status = Thread.STATUS_DONE;
    // Pop from the stack - finished this level of execution.
    thread.popStack();
    // Push next connected block, if there is one.
    var nextBlockId = this.runtime.blocks.getNextBlock(currentBlockId);
    if (nextBlockId) {
        thread.pushStack(nextBlockId);
    }
    // Pop from the stack until we have a next block.
    while (thread.peekStack() === null && thread.stack.length > 0) {
        thread.popStack();
    }
};

module.exports = Sequencer;
