export = BlockUtility;
/**
 * @fileoverview
 * Interface provided to block primitive functions for interacting with the
 * runtime, thread, target, and convenient methods.
 */
declare class BlockUtility {
    constructor(sequencer?: any, thread?: any);
    /**
     * A sequencer block primitives use to branch or start procedures with
     * @type {?import("./sequencer")}
     */
    sequencer: import("./sequencer") | null;
    /**
     * The block primitives thread with the block's target, stackFrame and
     * modifiable status.
     * @type {?import("./thread")}
     */
    thread: import("./thread") | null;
    _nowObj: {
        now: () => number;
    };
    /**
     * The target the primitive is working on.
     * @type {import("./target")}
     */
    get target(): import("./target");
    /**
     * The runtime the block primitive is running in.
     * @type {import("./runtime")}
     */
    get runtime(): import("./runtime");
    /**
     * Use the runtime's currentMSecs value as a timestamp value for now
     * This is useful in some cases where we need compatibility with Scratch 2
     * @type {function}
     */
    get nowObj(): Function;
    /**
     * The stack frame used by loop and other blocks to track internal state.
     * @type {import("./stackFrame")}
     */
    get stackFrame(): import("./stackFrame");
    /**
     * Check the stack timer and return a boolean based on whether it has finished or not.
     * @return {boolean} - true if the stack timer has finished.
     */
    stackTimerFinished(): boolean;
    /**
     * Check if the stack timer needs initialization.
     * @return {boolean} - true if the stack timer needs to be initialized.
     */
    stackTimerNeedsInit(): boolean;
    /**
     * Create and start a stack timer
     * @param {number} duration - a duration in milliseconds to set the timer for.
     */
    startStackTimer(duration: number): void;
    /**
     * Set the thread to yield.
     */
    yield(): void;
    /**
     * Set the thread to yield until the next tick of the runtime.
     */
    yieldTick(): void;
    /**
     * Start a branch in the current block.
     * @param {number} branchNum Which branch to step to (i.e., 1, 2).
     * @param {boolean} isLoop Whether this block is a loop.
     */
    startBranch(branchNum: number, isLoop: boolean): void;
    /**
     * Stop all threads.
     */
    stopAll(): void;
    /**
     * Stop threads other on this target other than the thread holding the
     * executed block.
     */
    stopOtherTargetThreads(): void;
    /**
     * Stop this thread.
     */
    stopThisScript(): void;
    /**
     * Start a specified procedure on this thread.
     * @param {string} procedureCode Procedure code for procedure to start.
     */
    startProcedure(procedureCode: string): void;
    /**
     * Get names and ids of parameters for the given procedure.
     * @param {string} procedureCode Procedure code for procedure to query.
     * @return {Array.<string>} List of param names for a procedure.
     */
    getProcedureParamNamesAndIds(procedureCode: string): Array<string>;
    /**
     * Get names, ids, and defaults of parameters for the given procedure.
     * @param {string} procedureCode Procedure code for procedure to query.
     * @return {Array.<string>} List of param names for a procedure.
     */
    getProcedureParamNamesIdsAndDefaults(procedureCode: string): Array<string>;
    /**
     * Initialize procedure parameters in the thread before pushing parameters.
     */
    initParams(): void;
    /**
     * Store a procedure parameter value by its name.
     * @param {string} paramName The procedure's parameter name.
     * @param {*} paramValue The procedure's parameter value.
     */
    pushParam(paramName: string, paramValue: any): void;
    /**
     * Retrieve the stored parameter value for a given parameter name.
     * @param {string} paramName The procedure's parameter name.
     * @return {*} The parameter's current stored value.
     */
    getParam(paramName: string): any;
    /**
     * Start all relevant hats.
     * @param {!string} requestedHat Opcode of hats to start.
     * @param {object=} optMatchFields Optionally, fields to match on the hat.
     * @param {import("./target")=} optTarget Optionally, a target to restrict to.
     * @return {Array.<import("./thread")>} List of threads started by this function.
     */
    startHats(requestedHat: string, optMatchFields?: object | undefined, optTarget?: import("./target") | undefined): Array<import("./thread")>;
    /**
     * Query a named IO device.
     * @param {string} device The name of like the device, like keyboard.
     * @param {string} func The name of the device's function to query.
     * @param {Array.<*>} args Arguments to pass to the device's function.
     * @return {*} The expected output for the device's function.
     */
    ioQuery(device: string, func: string, args: Array<any>): any;
}
