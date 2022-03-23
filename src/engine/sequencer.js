const Timer = require('../util/timer');
const Thread = require('./thread');
const execute = require('./execute.js');

/**
 * Profiler frame name for stepping a single thread.
 * @const {string}
 */
const stepThreadProfilerFrame = 'Sequencer.stepThread';

/**
 * Profiler frame name for the inner loop of stepThreads.
 * @const {string}
 */
const stepThreadsInnerProfilerFrame = 'Sequencer.stepThreads#inner';

/**
 * Profiler frame name for execute.
 * @const {string}
 */
const executeProfilerFrame = 'execute';

/**
 * Profiler frame ID for stepThreadProfilerFrame.
 * @type {number}
 */
let stepThreadProfilerId = -1;

/**
 * Profiler frame ID for stepThreadsInnerProfilerFrame.
 * @type {number}
 */
let stepThreadsInnerProfilerId = -1;

/**
 * Profiler frame ID for executeProfilerFrame.
 * @type {number}
 */
let executeProfilerId = -1;

class Sequencer {
    constructor (runtime) {
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

        this.activeThread = null;
    }

    /**
     * Time to run a warp-mode thread, in ms.
     * @type {number}
     */
    static get WARP_TIME () {
        return 500;
    }

    /**
     * Step through all threads in `this.runtime.threads`, running them in order.
     * @return {Array.<!Thread>} List of inactive threads after stepping.
     */
    stepThreads () {
        // Work time is 75% of the thread stepping interval.
        const WORK_TIME = 0.75 * this.runtime.currentStepTime;
        // For compatibility with Scatch 2, update the millisecond clock
        // on the Runtime once per step (see Interpreter.as in Scratch 2
        // for original use of `currentMSecs`)
        this.runtime.updateCurrentMSecs();
        // Start counting toward WORK_TIME.
        this.timer.start();
        // Are there active threads?
        let activeThreads = true;
        // Whether `stepThreads` has run through a full single tick.
        let ranFirstTick = false;
        const doneThreads = [];
        // Conditions for continuing to stepping threads:
        // 1. We must have threads in the list, and some must be active.
        // 2. Time elapsed must be less than WORK_TIME.
        // 3. Either turbo mode, or no redraw has been requested by a primitive.
        while (this.runtime.threads.length > 0 &&
               activeThreads &&
               this.timer.timeElapsed() < WORK_TIME &&
               (this.runtime.turboMode || !this.runtime.redrawRequested)) {
            if (this.runtime.profiler !== null) {
                if (stepThreadsInnerProfilerId === -1) {
                    stepThreadsInnerProfilerId = this.runtime.profiler.idByName(stepThreadsInnerProfilerFrame);
                }
                this.runtime.profiler.start(stepThreadsInnerProfilerId);
            }

            activeThreads = false;
            let stoppedThread = false;
            // Attempt to run each thread one time.
            const threads = this.runtime.threads;
            for (let i = 0; i < threads.length; i++) {
                const activeThread = this.activeThread = threads[i];
                if (activeThread.status === Thread.STATUS_RUNNING) {
                    // Normal-mode thread: step.
                    if (this.runtime.profiler === null) {
                        this.stepThread(activeThread);
                    } else {
                        if (stepThreadProfilerId === -1) {
                            stepThreadProfilerId = this.runtime.profiler.idByName(stepThreadProfilerFrame);
                        }
                        // Increment the number of times stepThread is called.
                        this.runtime.profiler.increment(stepThreadProfilerId);

                        this.stepThread(activeThread);
                    }
                } else if (activeThread.status === Thread.STATUS_YIELD || (
                    activeThread.status === Thread.STATUS_YIELD_TICK &&
                    !ranFirstTick
                )) {
                    // Clear yield and yield tick on first outer step loop.
                    activeThread.status = Thread.STATUS_RUNNING;
                    // Run this thread again in the loop. (Since most threads
                    // are RUNNING this second clause will be rarely checked.
                    // Instead of checking it first we can check it late, and
                    // loop over this index a second time to get the RUNNING
                    // behaviour.)
                    i--;
                    // Skip ahead to running this thread again. We don't want
                    // this to count towards activeThreads until after
                    // execution.
                    continue;
                }
                // If the thread is running allow, loop over the threads again.
                // If the thread finished make sure it is removed before the
                // next iteration of all threads.
                if (activeThread.status === Thread.STATUS_RUNNING) {
                    activeThreads = true;
                } else if (activeThread.status === Thread.STATUS_DONE) {
                    // Finished with this thread.
                    stoppedThread = true;
                }
            }
            // We successfully ticked once. Prevents running STATUS_YIELD_TICK
            // threads on the next tick.
            ranFirstTick = true;

            if (this.runtime.profiler !== null) {
                this.runtime.profiler.stop();
            }

            // Filter inactive threads from `this.runtime.threads`.
            if (stoppedThread) {
                let nextActiveThread = 0;
                for (let i = 0; i < this.runtime.threads.length; i++) {
                    const thread = this.runtime.threads[i];
                    if (thread.status === Thread.STATUS_DONE) {
                        doneThreads.push(thread);
                    } else {
                        this.runtime.threads[nextActiveThread] = thread;
                        nextActiveThread++;
                    }
                }
                this.runtime.threads.length = nextActiveThread;
            }
        }

        this.activeThread = null;

        return doneThreads;
    }

    /**
     * Step the requested thread once. The thread must be at a hat block.
     * @param {!Thread} thread Thread object to step.
     * @param {object=} optMatchFields Optionally, fields to match on the hat.
     */
    stepHat (thread) {
        execute(this, thread);
        if (thread.status === Thread.STATUS_RUNNING) {
            thread.goToNextBlock();
            if (thread.peekStack() === null) {
                // Necessary to maintain the invariant that STATUS_RUNNING threads always have a next block
                this.unwrapStack(thread);
            }
        }
    }

    /**
     * Pop the stack as long as it is pointing at null.
     * @param {!Thread} thread Thread to pop.
     */
    unwrapStack (thread) {
        while (
            thread.status === Thread.STATUS_RUNNING &&
            thread.peekStack() === null
        ) {
            thread.popStack();

            const stackFrame = thread.peekStackFrame();
            if (stackFrame === null) {
                // No more stack to run!
                thread.status = Thread.STATUS_DONE;
            } else if (stackFrame.isLoop) {
                // The current level of the stack is marked as a loop. Yield
                // this thread so the next thread may run.
                thread.status = Thread.STATUS_YIELD;
            } else {
                // Step to the next block.
                thread.goToNextBlock();
            }
        }
    }

    /**
     * Step the requested thread for as long as necessary.
     * @param {!Thread} thread Thread object to step.
     */
    stepThread (thread) {
        // warpMode may be true when we start stepping a thread or become true
        // when a procedure is pushed. So we only need to check here and in
        // stepToProcedure.
        if (thread.peekStackFrame().warpMode && thread.warpTimer === null) {
            // Initialize warp-mode timer if it hasn't been already. This
            // will start counting the thread toward `Sequencer.WARP_TIME`.
            thread.warpTimer = new Timer();
            thread.warpTimer.start();
        }
        // The thread entered a null block while outside of stepThreads during a
        // stepHat or promise resolution. We can't unwrap during stepHat or
        // promise resolution if we need to change the thread status.
        if (thread.peekStack() === null) {
            // Unwrap the stack until we find a loop block, a non-null
            // block, or the top of the stack.
            this.unwrapStack(thread);
            // If we unwrapped into a loop block, execute it immediately.
            if (thread.status === Thread.STATUS_YIELD) {
                thread.status = Thread.STATUS_RUNNING;
            }
        }
        while (thread.status === Thread.STATUS_RUNNING) {
            // Save the current block ID to notice if we did control flow.
            const currentBlockId = thread.peekStack();

            if (this.runtime.profiler !== null) {
                if (executeProfilerId === -1) {
                    executeProfilerId = this.runtime.profiler.idByName(executeProfilerFrame);
                }
                // Increment the number of times execute is called.
                this.runtime.profiler.increment(executeProfilerId);
            }

            // Execute the current block.
            execute(this, thread);

            if (thread.status === Thread.STATUS_RUNNING) {
                // If no control flow has happened, switch to next block.
                if (thread.peekStack() === currentBlockId) {
                    thread.goToNextBlock();
                }
                // A empty branch was pushed or we stepped out of the last block
                // in a stack.
                if (thread.peekStack() === null) {
                    // Unwrap the stack until we find a loop block, a non-null
                    // block, or the top of the stack.
                    this.unwrapStack(thread);
                }
            }

            if (thread.status === Thread.STATUS_YIELD &&
                thread.peekStackFrame().warpMode &&
                thread.warpTimer.timeElapsed() <= Sequencer.WARP_TIME) {
                // In warp mode, yielded blocks are re-executed immediately.
                thread.status = Thread.STATUS_RUNNING;
            }
        }
        // If we yielded out of the thread, set status to RUNNING so stepThreads
        // can count it as an activeThread and possibly step all threads an
        // extra time.
        if (thread.status === Thread.STATUS_YIELD) {
            thread.status = Thread.STATUS_RUNNING;
        }
        // Unset warpTimer if it was used so it can be set again next time.
        thread.warpTimer = null;
    }

    /**
     * Step a thread into a block's branch.
     * @param {!Thread} thread Thread object to step to branch.
     * @param {number} branchNum Which branch to step to (i.e., 1, 2).
     * @param {boolean} isLoop Whether this block is a loop.
     */
    stepToBranch (thread, branchNum, isLoop) {
        if (!branchNum) {
            branchNum = 1;
        }
        const currentBlockId = thread.peekStack();
        const branchId = thread.target.blocks.getBranch(
            currentBlockId,
            branchNum
        );
        if (isLoop) {
            const stackFrame = thread.peekStackFrame();
            stackFrame.needsReset = true;
            stackFrame.isLoop = true;
        }
        if (branchId) {
            // Push branch ID to the thread's stack.
            thread.pushStack(branchId);
        } else {
            thread.pushStack(null);
        }
    }

    /**
     * Step a procedure.
     * @param {!Thread} thread Thread object to step to procedure.
     * @param {!string} procedureCode Procedure code of procedure to step to.
     */
    stepToProcedure (thread, procedureCode) {
        const definition = thread.target.blocks.getProcedureDefinition(procedureCode);
        if (!definition) {
            return;
        }
        // Check if the call is recursive.
        // If so, set the thread to yield after pushing.
        const isRecursive = thread.isRecursiveCall(procedureCode);
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
            const definitionBlock = thread.target.blocks.getBlock(definition);
            const innerBlock = thread.target.blocks.getBlock(
                definitionBlock.inputs.custom_block.block);
            let doWarp = false;
            if (innerBlock && innerBlock.mutation) {
                const warp = innerBlock.mutation.warp;
                if (typeof warp === 'boolean') {
                    doWarp = warp;
                } else if (typeof warp === 'string') {
                    doWarp = JSON.parse(warp);
                }
            }
            if (doWarp) {
                // Going from non warpMode to warpMode, enable the warpTimer.
                if (!thread.peekStackFrame().warpMode &&
                    thread.warpTimer === null) {
                    // Initialize warp-mode timer if it hasn't been already.
                    // This will start counting the thread toward
                    // `Sequencer.WARP_TIME`.
                    thread.warpTimer = new Timer();
                    thread.warpTimer.start();
                }

                thread.peekStackFrame().warpMode = true;
            } else if (isRecursive) {
                // In normal-mode threads, yield any time we have a recursive call.
                thread.status = Thread.STATUS_YIELD;
            }
        }
    }

    /**
     * Retire a thread in the middle, without considering further blocks.
     * @param {!Thread} thread Thread object to retire.
     */
    retireThread (thread) {
        thread.stack = [];
        thread.pointer = null;
        thread.stackFrames = [];
        thread.stackFrame = null;
        thread.requestScriptGlowInFrame = false;
        thread.status = Thread.STATUS_DONE;
    }
}

module.exports = Sequencer;
