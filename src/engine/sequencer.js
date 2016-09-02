var Timer = require('../util/timer');
var Thread = require('./thread');
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
    // Clear all yield statuses that were for the previous frame.
    for (var t = 0; t < threads.length; t++) {
        if (threads[t].status === Thread.STATUS_YIELD_FRAME) {
            threads[t].setStatus(Thread.STATUS_RUNNING);
        }
    }

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
            } else if (activeThread.status === Thread.STATUS_YIELD ||
                       activeThread.status === Thread.STATUS_YIELD_FRAME) {
                // Yielding thread: do nothing for this step.
                numYieldingThreads++;
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
        // A "null block" - empty branch.
        // Yield for the frame.
        thread.popStack();
        thread.setStatus(Thread.STATUS_YIELD_FRAME);
        return;
    }
    // Execute the current block
    execute(this, thread);
    // If the block executed without yielding and without doing control flow,
    // move to done.
    if (thread.status === Thread.STATUS_RUNNING &&
        thread.peekStack() === currentBlockId) {
        this.proceedThread(thread);
    }
};

/**
 * Step a thread into a block's branch.
 * @param {!Thread} thread Thread object to step to branch.
 * @param {Number} branchNum Which branch to step to (i.e., 1, 2).
 */
Sequencer.prototype.stepToBranch = function (thread, branchNum) {
    if (!branchNum) {
        branchNum = 1;
    }
    var currentBlockId = thread.peekStack();
    var branchId = this.runtime.targetForThread(thread).blocks.getBranch(
        currentBlockId,
        branchNum
    );
    if (branchId) {
        // Push branch ID to the thread's stack.
        thread.pushStack(branchId);
    } else {
        // Push null, so we come back to the current block.
        thread.pushStack(null);
    }
};

/**
 * Step a thread into an input reporter, and manage its status appropriately.
 * @param {!Thread} thread Thread object to step to reporter.
 * @param {!string} blockId ID of reporter block.
 * @param {!string} inputName Name of input on parent block.
 * @return {boolean} True if yielded, false if it finished immediately.
 */
Sequencer.prototype.stepToReporter = function (thread, blockId, inputName) {
    var currentStackFrame = thread.peekStackFrame();
    // Push to the stack to evaluate the reporter block.
    thread.pushStack(blockId);
    // Save name of input for `Thread.pushReportedValue`.
    currentStackFrame.waitingReporter = inputName;
    // Actually execute the block.
    this.startThread(thread);
    // If a reporter yielded, caller must wait for it to unyield.
    // The value will be populated once the reporter unyields,
    // and passed up to the currentStackFrame on next execution.
    return thread.status === Thread.STATUS_YIELD;
};

/**
 * Finish stepping a thread and proceed it to the next block.
 * @param {!Thread} thread Thread object to proceed.
 */
Sequencer.prototype.proceedThread = function (thread) {
    var currentBlockId = thread.peekStack();
    // Mark the status as done and proceed to the next block.
    // Pop from the stack - finished this level of execution.
    thread.popStack();
    // Push next connected block, if there is one.
    var nextBlockId = (this.runtime.targetForThread(thread).
        blocks.getNextBlock(currentBlockId));
    if (nextBlockId) {
        thread.pushStack(nextBlockId);
    }
    // If we can't find a next block to run, mark the thread as done.
    if (!thread.peekStack()) {
        thread.setStatus(Thread.STATUS_DONE);
    }
};

/**
 * Retire a thread in the middle, without considering further blocks.
 * @param {!Thread} thread Thread object to retire.
 */
Sequencer.prototype.retireThread = function (thread) {
    thread.stack = [];
    thread.stackFrame = [];
    thread.setStatus(Thread.STATUS_DONE);
};

module.exports = Sequencer;
