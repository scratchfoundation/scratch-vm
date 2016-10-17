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

Sequencer.WARP_TIME = 500;

/**
 * Step through all threads in `this.runtime.threads`, running them in order.
 * @return {Array.<!Thread>} List of inactive threads after stepping.
 */
Sequencer.prototype.stepThreads = function () {
    var WORK_TIME = 0.75 * this.runtime.currentStepTime;
    // Start counting toward WORK_TIME
    this.timer.start();
    // Count of active threads.
    var numActiveThreads = Infinity;
    var ranFirstFrame = false;
    var filteredThreads = [];
    // While there are still threads to run and we are within WORK_TIME,
    // continue executing threads.
    while (this.runtime.threads.length > 0 &&
           numActiveThreads > 0 &&
           this.timer.timeElapsed() < WORK_TIME &&
           (this.runtime.turboMode || !this.runtime.redrawRequested)) {
        // New threads at the end of the iteration.
        var newThreads = [];
        numActiveThreads = 0;
        // Attempt to run each thread one time
        for (var i = 0; i < this.runtime.threads.length; i++) {
            var activeThread = this.runtime.threads[i];
            if (activeThread.status === Thread.STATUS_YIELD_FRAME &&
                !ranFirstFrame) {
                // Clear single-frame yield from last time.
                activeThread.status = Thread.STATUS_RUNNING;
            }
            if (activeThread.status !== Thread.STATUS_PROMISE_WAIT &&
                activeThread.status !== Thread.STATUS_YIELD_FRAME) {
                // Normal-mode thread: step.
                this.stepThread(activeThread);
                activeThread.warpTimer = null;
            }
            if (activeThread.status === Thread.STATUS_RUNNING) {
                if (this.runtime.singleStepping) {
                    activeThread.status = Thread.STATUS_YIELD_FRAME;
                }
                numActiveThreads++;
            }
            if (activeThread.stack.length === 0 ||
                activeThread.status === Thread.STATUS_DONE) {
                // Finished with this thread.
                filteredThreads.push(activeThread);
            } else {
                // Keep this thead in the loop.
                newThreads.push(activeThread);
            }
        }
        // Filter out threads that have stopped.
        this.runtime.threads = newThreads;
        ranFirstFrame = true;
    }
    return filteredThreads;
};

/**
 * Step the requested thread
 * @param {!Thread} thread Thread object to step
 */
Sequencer.prototype.stepThread = function (thread) {
    var currentBlockId = thread.peekStack();
    if (!currentBlockId) {
        // A "null block" - empty branch.
        thread.popStack();
    }
    while (thread.peekStack()) {
        var isWarpMode = thread.peekStackFrame().warpMode;
        if (isWarpMode && !thread.warpTimer) {
            thread.warpTimer = new Timer();
            thread.warpTimer.start();
        }
        // Execute the current block.
        currentBlockId = thread.peekStack();
        execute(this, thread);
        // If the thread has yielded or is waiting, yield to other threads.
        if (thread.status === Thread.STATUS_YIELD) {
            thread.status = Thread.STATUS_RUNNING;
            if (isWarpMode &&
                thread.warpTimer.timeElapsed() <= Sequencer.WARP_TIME) {
                continue;
            }
            return;
        } else if (thread.status === Thread.STATUS_PROMISE_WAIT) {
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
                if (!isWarpMode ||
                    thread.warpTimer.timeElapsed() > Sequencer.WARP_TIME) {
                    return;
                } else {
                    continue;
                }
            } else if (thread.peekStackFrame().waitingReporter) {
                return;
            }
            // Get next block of existing block on the stack.
            thread.goToNextBlock();
        }
        // In single-stepping mode, force `stepThread` to only run one block
        // at a time.
        if (this.runtime.singleStepping) {
            return;
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
    } else {
        thread.pushStack(null);
    }
};

/**
 * Step a procedure.
 * @param {!Thread} thread Thread object to step to procedure.
 * @param {!string} procedureName Name of procedure defined in this target.
 */
Sequencer.prototype.stepToProcedure = function (thread, procedureName) {
    var definition = thread.target.blocks.getProcedureDefinition(procedureName);
    // Check if the call is recursive. If so, yield.
    if (thread.isRecursiveCall(procedureName)) {
        thread.status = Thread.STATUS_YIELD;
    }
    thread.pushStack(definition);
    if (thread.peekStackFrame().warpMode &&
        thread.warpTimer.timeElapsed() > Sequencer.WARP_TIME) {
        thread.status = Thread.STATUS_YIELD;
    } else {
        var definitionBlock = thread.target.blocks.getBlock(definition);
        var doWarp = definitionBlock.mutation.warp;
        if (doWarp) {
            thread.peekStackFrame().warpMode = true;
        }
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
    thread.status = Thread.STATUS_DONE;
};

module.exports = Sequencer;
