export = Sequencer;
declare class Sequencer {
    /**
     * Time to run a warp-mode thread, in ms.
     * @type {number}
     */
    static get WARP_TIME(): number;
    constructor(runtime: any);
    /**
     * A utility timer for timing thread sequencing.
     * @type {!Timer}
     */
    timer: Timer;
    /**
     * Reference to the runtime owning this sequencer.
     * @type {!import("./runtime")}
     */
    runtime: import("./runtime");
    activeThread: Thread;
    /**
     * Step through all threads in `this.runtime.threads`, running them in order.
     * @return {Array.<!Thread>} List of inactive threads after stepping.
     */
    stepThreads(): Array<Thread>;
    /**
     * Step the requested thread for as long as necessary.
     * @param {!Thread} thread Thread object to step.
     */
    stepThread(thread: Thread): void;
    /**
     * Step a thread into a block's branch.
     * @param {!Thread} thread Thread object to step to branch.
     * @param {number} branchNum Which branch to step to (i.e., 1, 2).
     * @param {boolean} isLoop Whether this block is a loop.
     */
    stepToBranch(thread: Thread, branchNum: number, isLoop: boolean): void;
    /**
     * Step a procedure.
     * @param {!Thread} thread Thread object to step to procedure.
     * @param {!string} procedureCode Procedure code of procedure to step to.
     */
    stepToProcedure(thread: Thread, procedureCode: string): void;
    /**
     * Retire a thread in the middle, without considering further blocks.
     * @param {!Thread} thread Thread object to retire.
     */
    retireThread(thread: Thread): void;
}
import Timer = require("../util/timer");
import Thread = require("./thread");
