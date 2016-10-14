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
           this.timer.timeElapsed() < Sequencer.WORK_TIME &&
           !this.runtime.redrawRequested) {
        // New threads at the end of the iteration.
        var newThreads = [];
        // Reset yielding thread count.
        numYieldingThreads = 0;
        // Attempt to run each thread one time
        for (var i = 0; i < threads.length; i++) {
            var activeThread = threads[i];
            if (activeThread.status === Thread.STATUS_RUNNING) {
                // Normal-mode thread: step.
                this.stepThread(activeThread);
            } else if (activeThread.status === Thread.STATUS_PROMISE_WAIT ||
                       activeThread.status === Thread.STATUS_YIELD_FRAME) {
                // Yielding thread: do nothing for this step.
                numYieldingThreads++;
            }
            if (activeThread.stack.length === 0 ||
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
    var currentBlockId = thread.peekStack();
    if (!currentBlockId) {
        // A "null block" - empty branch.
        // Yield for the frame.
        thread.popStack();
        thread.setStatus(Thread.STATUS_YIELD_FRAME);
        return;
    }
    while (thread.peekStack()) {
        // Execute the current block.
        currentBlockId = thread.peekStack();
        execute(this, thread);
        // If the thread has yielded or is waiting, yield to other threads.
        if (thread.status === Thread.STATUS_YIELD_FRAME ||
            thread.status === Thread.STATUS_PROMISE_WAIT) {
            return;
        }
        // If no control flow has happened, switch to next block.
        if (thread.peekStack() === currentBlockId) {
            thread.goToNextBlock();
        }
        // If no next block has been found at this point, look on the stack.
        while (!thread.peekStack()) {
            thread.popStack();
            if (thread.stack.length === 0) {
                thread.status = Thread.STATUS_DONE;
                return;
            }
            if (thread.peekStackFrame().isLoop) {
                return;
            } else if (thread.peekStackFrame().waitingReporter) {
                return;
            }
            // Get next block of existing block on the stack.
            thread.goToNextBlock();
        }
    }
};

/**
 * Step a thread into a block's branch.
 * @param {!Thread} thread Thread object to step to branch.
 * @param {Number} branchNum Which branch to step to (i.e., 1, 2).
 * @param {Boolean} isLoop Whether this block is a loop.
 */
Sequencer.prototype.stepToBranch = function (thread, branchNum, isLoop) {
    if (!branchNum) {
        branchNum = 1;
    }
    var currentBlockId = thread.peekStack();
    var branchId = thread.target.blocks.getBranch(
        currentBlockId,
        branchNum
    );
    thread.peekStackFrame().isLoop = isLoop;
    if (branchId) {
        // Push branch ID to the thread's stack.
        thread.pushStack(branchId);
    }
};

/**
 * Step a procedure.
 * @param {!Thread} thread Thread object to step to procedure.
 * @param {!string} procedureName Name of procedure defined in this target.
 */
Sequencer.prototype.stepToProcedure = function (thread, procedureName) {
    var definition = thread.target.blocks.getProcedureDefinition(procedureName);
    thread.pushStack(definition);
    // Check if the call is recursive. If so, yield.
    // @todo: Have behavior match Scratch 2.0.
    /*if (thread.stack.indexOf(definition) > -1) {
        thread.setStatus(Thread.STATUS_YIELD_FRAME);
    }*/
};

Sequencer.prototype.proceedThread = function (thread) {
    var currentBlockId = thread.peekStack();
    // Mark the status as done and proceed to the next block.
    // Pop from the stack - finished this level of execution.
    thread.popStack();
    // Push next connected block, if there is one.
    var nextBlockId = thread.target.blocks.getNextBlock(currentBlockId);
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
    thread.requestScriptGlowInFrame = false;
    thread.setStatus(Thread.STATUS_DONE);
};

module.exports = Sequencer;
