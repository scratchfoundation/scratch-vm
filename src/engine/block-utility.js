const Thread = require('./thread');

/**
 * @fileoverview
 * Interface provided to block primitive functions for interacting with the
 * runtime, thread, target, and convenient methods.
 */

class BlockUtility {
    constructor (sequencer = null, thread = null) {
        /**
         * A sequencer block primitives use to branch or start procedures with
         * @type {?Sequencer}
         */
        this.sequencer = sequencer;

        /**
         * The block primitives thread with the block's target, stackFrame and
         * modifiable status.
         * @type {?Thread}
         */
        this.thread = thread;
    }

    /**
     * The target the primitive is working on.
     * @type {Target}
     */
    get target () {
        return this.thread.target;
    }

    /**
     * The runtime the block primitive is running in.
     * @type {Runtime}
     */
    get runtime () {
        return this.sequencer.runtime;
    }

    /**
     * The stack frame used by loop and other blocks to track internal state.
     * @type {object}
     */
    get stackFrame () {
        const frame = this.thread.peekStackFrame();
        if (frame.executionContext === null) {
            frame.executionContext = {};
        }
        return frame.executionContext;
    }

    /**
     * Set the thread to yield.
     */
    yield () {
        this.thread.status = Thread.STATUS_YIELD;
    }

    /**
     * Set the thread to yield until the next tick of the runtime.
     */
    yieldTick () {
        this.thread.status = Thread.STATUS_YIELD_TICK;
    }

    /**
     * Start a branch in the current block.
     * @param {number} branchNum Which branch to step to (i.e., 1, 2).
     * @param {boolean} isLoop Whether this block is a loop.
     */
    startBranch (branchNum, isLoop) {
        this.sequencer.stepToBranch(this.thread, branchNum, isLoop);
    }

    /**
     * Stop all threads.
     */
    stopAll () {
        this.sequencer.runtime.stopAll();
    }

    /**
     * Stop threads other on this target other than the thread holding the
     * executed block.
     */
    stopOtherTargetThreads () {
        this.sequencer.runtime.stopForTarget(this.thread.target, this.thread);
    }

    /**
     * Stop this thread.
     */
    stopThisScript () {
        this.thread.stopThisScript();
    }

    /**
     * Start a specified procedure on this thread.
     * @param {string} procedureCode Procedure code for procedure to start.
     */
    startProcedure (procedureCode) {
        this.sequencer.stepToProcedure(this.thread, procedureCode);
    }

    /**
     * Get names and ids of parameters for the given procedure.
     * @param {string} procedureCode Procedure code for procedure to query.
     * @return {Array.<string>} List of param names for a procedure.
     */
    getProcedureParamNamesAndIds (procedureCode) {
        return this.thread.target.blocks.getProcedureParamNamesAndIds(procedureCode);
    }

    /**
     * Get names, ids, and defaults of parameters for the given procedure.
     * @param {string} procedureCode Procedure code for procedure to query.
     * @return {Array.<string>} List of param names for a procedure.
     */
    getProcedureParamNamesIdsAndDefaults (procedureCode) {
        return this.thread.target.blocks.getProcedureParamNamesIdsAndDefaults(procedureCode);
    }

    /**
     * Store a procedure parameter value by its name.
     * @param {string} paramName The procedure's parameter name.
     * @param {*} paramValue The procedure's parameter value.
     */
    pushParam (paramName, paramValue) {
        this.thread.pushParam(paramName, paramValue);
    }

    /**
     * Retrieve the stored parameter value for a given parameter name.
     * @param {string} paramName The procedure's parameter name.
     * @return {*} The parameter's current stored value.
     */
    getParam (paramName) {
        return this.thread.getParam(paramName);
    }

    /**
     * Start all relevant hats.
     * @param {!string} requestedHat Opcode of hats to start.
     * @param {object=} optMatchFields Optionally, fields to match on the hat.
     * @param {Target=} optTarget Optionally, a target to restrict to.
     * @return {Array.<Thread>} List of threads started by this function.
     */
    startHats (requestedHat, optMatchFields, optTarget) {
        return (
            this.sequencer.runtime.startHats(requestedHat, optMatchFields, optTarget)
        );
    }

    /**
     * Query a named IO device.
     * @param {string} device The name of like the device, like keyboard.
     * @param {string} func The name of the device's function to query.
     * @param {Array.<*>} args Arguments to pass to the device's function.
     * @return {*} The expected output for the device's function.
     */
    ioQuery (device, func, args) {
        // Find the I/O device and execute the query/function call.
        if (
            this.sequencer.runtime.ioDevices[device] &&
            this.sequencer.runtime.ioDevices[device][func]) {
            const devObject = this.sequencer.runtime.ioDevices[device];
            return devObject[func].apply(devObject, args);
        }
    }
}

module.exports = BlockUtility;
