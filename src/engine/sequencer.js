var Timer = require('../util/timer');
var Thread = require('./thread');
var execute = require('./execute.js');

var Sequencer = function (runtime) {
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
};

/**
 * Time to run a warp-mode thread, in ms.
 * @type {number}
 */
Sequencer.WARP_TIME = 500;

/**
 * Step through all threads in `this.runtime.threads`, running them in order.
 * @return {Array.<!Thread>} List of inactive threads after stepping.
 */
Sequencer.prototype.stepThreads = function () {
    // Work time is 75% of the thread stepping interval.
    var WORK_TIME = 0.75 * this.runtime.currentStepTime;
    // Start counting toward WORK_TIME.
    this.timer.start();
    // Count of active threads.
    var numActiveThreads = Infinity;
    // Whether `stepThreads` has run through a full single tick.
    var ranFirstTick = false;
    var doneThreads = [];
    // Conditions for continuing to stepping threads:
    // 1. We must have threads in the list, and some must be active.
    // 2. Time elapsed must be less than WORK_TIME.
    // 3. Either turbo mode, or no redraw has been requested by a primitive.
    while (this.runtime.threads.length > 0 &&
           numActiveThreads > 0 &&
           this.timer.timeElapsed() < WORK_TIME &&
           (this.runtime.turboMode || !this.runtime.redrawRequested)) {
        numActiveThreads = 0;
        // Attempt to run each thread one time.
        for (var i = 0; i < this.runtime.threads.length; i++) {
            var activeThread = this.runtime.threads[i];
            if (activeThread.stack.length === 0 ||
                activeThread.status === Thread.STATUS_DONE) {
                // Finished with this thread.
                if (doneThreads.indexOf(activeThread) < 0) {
                    doneThreads.push(activeThread);
                }
                continue;
            }
            if (activeThread.status === Thread.STATUS_YIELD_TICK &&
                !ranFirstTick) {
                // Clear single-tick yield from the last call of `stepThreads`.
                activeThread.status = Thread.STATUS_RUNNING;
            }
            if (activeThread.status === Thread.STATUS_RUNNING ||
                activeThread.status === Thread.STATUS_YIELD) {
                // Normal-mode thread: step.
                this.stepThread(activeThread);
                activeThread.warpTimer = null;
            }
            if (activeThread.status === Thread.STATUS_RUNNING) {
                numActiveThreads++;
            }
        }
        // We successfully ticked once. Prevents running STATUS_YIELD_TICK
        // threads on the next tick.
        ranFirstTick = true;
    }
    // Filter inactive threads from `this.runtime.threads`.
    this.runtime.threads = this.runtime.threads.filter(function (thread) {
        if (doneThreads.indexOf(thread) > -1) {
            return false;
        }
        return true;
    });
    return doneThreads;
};

/**
 * Step the requested thread for as long as necessary.
 * @param {!Thread} thread Thread object to step.
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
            // Initialize warp-mode timer if it hasn't been already.
            // This will start counting the thread toward `Sequencer.WARP_TIME`.
            thread.warpTimer = new Timer();
            thread.warpTimer.start();
        }
        // Execute the current block.
        // Save the current block ID to notice if we did control flow.
        currentBlockId = thread.peekStack();
        execute(this, thread);
        thread.blockGlowInFrame = currentBlockId;
        // If the thread has yielded or is waiting, yield to other threads.
        if (thread.status === Thread.STATUS_YIELD) {
            // Mark as running for next iteration.
            thread.status = Thread.STATUS_RUNNING;
            // In warp mode, yielded blocks are re-executed immediately.
            if (isWarpMode &&
                thread.warpTimer.timeElapsed() <= Sequencer.WARP_TIME) {
                continue;
            }
            return;
        } else if (thread.status === Thread.STATUS_PROMISE_WAIT) {
            // A promise was returned by the primitive. Yield the thread
            // until the promise resolves. Promise resolution should reset
            // thread.status to Thread.STATUS_RUNNING.
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
                // No more stack to run!
                thread.status = Thread.STATUS_DONE;
                return;
            }

            var stackFrame = thread.peekStackFrame();
            isWarpMode = stackFrame.warpMode;

            if (stackFrame.isLoop) {
                // The current level of the stack is marked as a loop.
                // Return to yield for the frame/tick in general.
                // Unless we're in warp mode - then only return if the
                // warp timer is up.
                if (!isWarpMode ||
                    thread.warpTimer.timeElapsed() > Sequencer.WARP_TIME) {
                    // Don't do anything to the stack, since loops need
                    // to be re-executed.
                    return;
                } else {
                    // Don't go to the next block for this level of the stack,
                    // since loops need to be re-executed.
                    continue;
                }
            } else if (stackFrame.waitingReporter) {
                // This level of the stack was waiting for a value.
                // This means a reporter has just returned - so don't go
                // to the next block for this level of the stack.
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
 * @param {number} branchNum Which branch to step to (i.e., 1, 2).
 * @param {boolean} isLoop Whether this block is a loop.
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
 * @param {!string} procedureCode Procedure code of procedure to step to.
 */
Sequencer.prototype.stepToProcedure = function (thread, procedureCode) {
    var definition = thread.target.blocks.getProcedureDefinition(procedureCode);
    if (!definition) {
        return;
    }
    // Check if the call is recursive.
    // If so, set the thread to yield after pushing.
    var isRecursive = thread.isRecursiveCall(procedureCode);
    // To step to a procedure, we put its definition on the stack.
    // Execution for the thread will proceed through the definition hat
    // and on to the main definition of the procedure.
    // When that set of blocks finishes executing, it will be popped
    // from the stack by the sequencer, returning control to the caller.
    thread.pushStack(definition);
    // In known warp-mode threads, only yield when time is up.
    if (thread.peekStackFrame().warpMode &&
        thread.warpTimer.timeElapsed() > Sequencer.WARP_TIME) {
        thread.status = Thread.STATUS_YIELD;
    } else {
        // Look for warp-mode flag on definition, and set the thread
        // to warp-mode if needed.
        var definitionBlock = thread.target.blocks.getBlock(definition);
        var doWarp = definitionBlock.mutation.warp;
        if (doWarp) {
            thread.peekStackFrame().warpMode = true;
        } else {
            // In normal-mode threads, yield any time we have a recursive call.
            if (isRecursive) {
                thread.status = Thread.STATUS_YIELD;
            }
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
