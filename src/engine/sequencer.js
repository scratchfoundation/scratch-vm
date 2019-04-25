const Timer = require('../util/timer');
const Thread = require('./thread');
const execute = require('./execute.js');
const Blocks = require('./blocks.js');

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

        this.blocks = new Blocks(runtime, true);

        this.blocks.createBlock({
            id: 'vm_end_of_thread',
            opcode: 'vm_end_of_thread',
            fields: {},
            inputs: {},
            shadow: false,
            parent: null,
            next: null
        });

        this.blocks.createBlock({
            id: 'vm_end_of_procedure',
            opcode: 'vm_end_of_procedure',
            fields: {},
            inputs: {},
            shadow: false,
            parent: null,
            next: null
        });

        this.blocks.createBlock({
            id: 'vm_end_of_loop_branch',
            opcode: 'vm_end_of_loop_branch',
            fields: {},
            inputs: {},
            shadow: false,
            parent: null,
            next: null
        });

        this.blocks.createBlock({
            id: 'vm_end_of_branch',
            opcode: 'vm_end_of_branch',
            fields: {},
            inputs: {},
            shadow: false,
            parent: null,
            next: null
        });

        this.blocks.createBlock({
            id: 'vm_reenter_promise',
            opcode: 'vm_reenter_promise',
            fields: {},
            inputs: {},
            shadow: false,
            parent: null,
            next: null
        });

        this.blocks.createBlock({
            id: 'vm_report_stack_click',
            opcode: 'vm_report_stack_click',
            fields: {},
            inputs: {},
            shadow: false,
            parent: null,
            next: null
        });

        this.blocks.createBlock({
            id: 'vm_report_monitor',
            opcode: 'vm_report_monitor',
            fields: {},
            inputs: {},
            shadow: false,
            parent: null,
            next: null
        });
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
        // Count of active threads.
        let numActiveThreads = Infinity;
        // Whether `stepThreads` has run through a full single tick.
        let ranFirstTick = false;
        const doneThreads = [];
        // Conditions for continuing to stepping threads:
        // 1. We must have threads in the list, and some must be active.
        // 2. Time elapsed must be less than WORK_TIME.
        // 3. Either turbo mode, or no redraw has been requested by a primitive.
        while (this.runtime.threads.length > 0 &&
               numActiveThreads > 0 &&
               this.timer.timeElapsed() < WORK_TIME &&
               (this.runtime.turboMode || !this.runtime.redrawRequested)) {
            if (this.runtime.profiler !== null) {
                if (stepThreadsInnerProfilerId === -1) {
                    stepThreadsInnerProfilerId = this.runtime.profiler.idByName(stepThreadsInnerProfilerFrame);
                }
                this.runtime.profiler.start(stepThreadsInnerProfilerId);
            }

            numActiveThreads = 0;
            let stoppedThread = false;
            // Attempt to run each thread one time.
            for (let i = 0; i < this.runtime.threads.length; i++) {
                const activeThread = this.runtime.threads[i];
                // Check if the thread is done so it is not executed.
                if (activeThread.stack.length === 0 ||
                    activeThread.status === Thread.STATUS_DONE) {
                    // Finished with this thread.
                    stoppedThread = true;
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
                    if (this.runtime.profiler !== null) {
                        if (stepThreadProfilerId === -1) {
                            stepThreadProfilerId = this.runtime.profiler.idByName(stepThreadProfilerFrame);
                        }
                        this.runtime.profiler.start(stepThreadProfilerId);
                    }
                    this.stepThread(activeThread);
                    if (this.runtime.profiler !== null) {
                        this.runtime.profiler.stop();
                    }
                    activeThread.warpTimer = null;
                    if (activeThread.isKilled) {
                        i--; // if the thread is removed from the list (killed), do not increase index
                    }
                }
                if (activeThread.status === Thread.STATUS_RUNNING) {
                    numActiveThreads++;
                }
                // Check if the thread completed while it just stepped to make
                // sure we remove it before the next iteration of all threads.
                if (activeThread.stack.length === 0 ||
                    activeThread.status === Thread.STATUS_DONE) {
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
                    if (thread.stack.length !== 0 &&
                        thread.status !== Thread.STATUS_DONE) {
                        this.runtime.threads[nextActiveThread] = thread;
                        nextActiveThread++;
                    } else {
                        doneThreads.push(thread);
                    }
                }
                this.runtime.threads.length = nextActiveThread;
            }
        }

        return doneThreads;
    }

    /**
     * Step the requested thread for as long as necessary.
     * @param {!Thread} thread Thread object to step.
     */
    stepThread (thread) {
        if (thread.target === null) {
            this.retireThread(thread);
            return;
        }

        if (thread.peekStackFrame().warpMode && !thread.warpTimer) {
            // Initialize warp-mode timer if it hasn't been already.
            // This will start counting the thread toward `Sequencer.WARP_TIME`.
            thread.warpTimer = new Timer();
            thread.warpTimer.start();
        }

        // Save the current block ID to notice if we did control flow.
        while (thread.status === Thread.STATUS_RUNNING) {
            const currentBlockId = thread.peekStack();

            // Execute the current block.
            if (this.runtime.profiler === null) {
                thread.continuous = true;
                execute(this, thread);
                thread.continuous = false;
            } else {
                if (executeProfilerId === -1) {
                    executeProfilerId = this.runtime.profiler.idByName(executeProfilerFrame);
                }

                // The method commented below has its code inlined underneath to
                // reduce the bias recorded for the profiler's calls in this
                // time sensitive stepThread method.
                //
                // this.runtime.profiler.start(executeProfilerId, null);
                this.runtime.profiler.records.push(
                    this.runtime.profiler.START, executeProfilerId, null, 0);

                thread.continuous = true;
                execute(this, thread);
                thread.continuous = false;

                // this.runtime.profiler.stop();
                this.runtime.profiler.records.push(this.runtime.profiler.STOP, 0);
            }

            // If the thread has yielded or is waiting, yield to other threads.
            if (
                thread.status === Thread.STATUS_YIELD &&
                thread.peekStackFrame().warpMode &&
                thread.warpTimer.timeElapsed() <= Sequencer.WARP_TIME
            ) {
                // Mark as running for next iteration.
                thread.status = Thread.STATUS_RUNNING;
            } else if (
                thread.status === Thread.STATUS_RUNNING &&
                thread.peekStack() === currentBlockId
            ) {
                // If no control flow has happened, switch to next block.
                thread.goToNextBlock();
            }
        }

        if (thread.status === Thread.STATUS_YIELD) {
            // Mark as running for next iteration.
            thread.status = Thread.STATUS_RUNNING;
        }

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

        // Push branch ID to the thread's stack.
        thread.pushStack(
            branchId,
            isLoop ? 'vm_end_of_loop_branch' : 'vm_end_of_branch'
        );
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
        thread.pushStack(definition, 'vm_end_of_procedure');
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
                thread.peekStackFrame().warpMode = true;

                if (!thread.warpTimer) {
                    // Initialize warp-mode timer if it hasn't been already.
                    // This will start counting the thread toward
                    // `Sequencer.WARP_TIME`.
                    thread.warpTimer = new Timer();
                    thread.warpTimer.start();
                }
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
        thread.stackFrames = [];
        thread.requestScriptGlowInFrame = false;
        thread.status = Thread.STATUS_DONE;
    }
}

module.exports = Sequencer;
