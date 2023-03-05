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
                const activeThread = threads[i];
                if (activeThread.status === Thread.STATUS_RUNNING) {
                    // Normal-mode thread: step.
                    if (this.runtime.profiler !== null) {
                        if (stepThreadProfilerId === -1) {
                            stepThreadProfilerId = this.runtime.profiler.idByName(stepThreadProfilerFrame);
                        }
                        // Increment the number of times stepThread is called.
                        this.runtime.profiler.increment(stepThreadProfilerId);
                    }

                    // Reset the warp timer for this tick.
                    // This will start counting the thread toward `Sequencer.WARP_TIME`.
                    if (activeThread.peekStackFrame().warpMode) {
                        activeThread.warpTimer.start();
                    }
                    // Step the thread until it yields.
                    while (activeThread.status === Thread.STATUS_RUNNING) {
                        this.stepOnce(activeThread);
                    }
                    // If we yielded out of the thread, set status to RUNNING so we will re-execute the thread during
                    // the next iteration.
                    if (activeThread.status === Thread.STATUS_YIELD) {
                        activeThread.status = Thread.STATUS_RUNNING;
                    }
                } else if (
                    activeThread.status === Thread.STATUS_YIELD_TICK &&
                    !ranFirstTick
                ) {
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

        return doneThreads;
    }

    /**
     * Step the requested thread once.
     * @param {!Thread} thread Thread object to step.
     */
    stepOnce (thread) {
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

            // Unwrap the stack until we find a loop block, a non-null block, or the top of the stack.
            while (thread.peekStack() === null) {
                thread.popStack();

                const stackFrame = thread.peekStackFrame();
                if (stackFrame === null) {
                    // No more stack to run!
                    thread.status = Thread.STATUS_DONE;
                    break;
                }
                if (stackFrame.isLoop) {
                    // The current level of the stack is marked as a loop. Yield
                    // this thread so the next thread may run.
                    thread.status = Thread.STATUS_YIELD;
                    break;
                }
                // Step to the next block.
                thread.goToNextBlock();
            }
        }

        if (thread.status === Thread.STATUS_YIELD &&
            thread.peekStackFrame().warpMode &&
            thread.warpTimer.timeElapsed() <= Sequencer.WARP_TIME) {
            // In warp mode, yielded blocks are re-executed immediately.
            thread.status = Thread.STATUS_RUNNING;
        }
    }

    /**
     * Step a thread into a block's branch.
     * @param {!Thread} thread Thread object to step to branch.
     * @param {?string} branchID ID of the first block in the branch to step to (or null/undefined if the branch input
     * is empty).
     * @param {boolean} isLoop Whether this block is a loop.
     */
    stepToBranch (thread, branchID, isLoop) {
        if (isLoop) {
            const stackFrame = thread.peekStackFrame();
            stackFrame.needsReset = true;
            stackFrame.isLoop = true;
        }
        // Push branch ID to the thread's stack. Note that the branch ID may be null (empty C-block).
        // We need to cast undefined (empty branch input) to null.
        thread.pushStack(typeof branchID === 'string' ? branchID : null);
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
        // To step to a procedure, we put its definition on the stack.
        // Execution for the thread will proceed through the definition hat
        // and on to the main definition of the procedure.
        // When that set of blocks finishes executing, it will be popped
        // from the stack by the sequencer, returning control to the caller.
        thread.pushStack(definition);

        const parentWarpMode = thread.peekStackFrame().warpMode;

        // Determine whether or not to enter warp-mode and/or yield.
        if (parentWarpMode && thread.warpTimer.timeElapsed() > Sequencer.WARP_TIME) {
            // We are already in warp-mode (the stack frame inherited warp-mode from its parent),
            // and have exceeded the warp timer. Yield.
            thread.status = Thread.STATUS_YIELD;
        } else {
            // Look for warp-mode flag on definition, and set the thread to warp-mode if needed.
            const definitionBlock = thread.target.blocks.getBlock(definition);
            const innerBlock = thread.target.blocks.getBlock(
                definitionBlock.inputs.custom_block.block);
            let doWarp = false;
            if (innerBlock && innerBlock.mutation) {
                const warp = innerBlock.mutation.warp;
                doWarp = warp === true || warp === 'true';
            }
            if (doWarp && !parentWarpMode) {
                thread.peekStackFrame().warpMode = true;
                // Going from non warpMode to warpMode, enable the warpTimer.
                // This will start counting the thread toward `Sequencer.WARP_TIME`.
                thread.warpTimer.start();
            }
            if (!doWarp && thread.isRecursiveCall(procedureCode)) {
                // This procedure is *not* warp-mode and is a recursive call. Yield.
                thread.status = Thread.STATUS_YIELD;
            }
        }
    }
}

module.exports = Sequencer;
