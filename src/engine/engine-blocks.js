const {Map} = require('immutable');

const Cast = require('../util/cast');
const execute = require('../engine/execute');
const Thread = require('../engine/thread');
const BlocksExecuteCache = require('../engine/blocks-execute-cache');

class Scratch3VMBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            vm_end_of_thread: this.endOfThread,
            vm_end_of_procedure: this.endOfProcedure,
            vm_end_of_loop_branch: this.endOfLoopBranch,
            vm_end_of_branch: this.endOfBranch,
            vm_reenter_promise: this.reenterFromPromise,
            vm_report_hat: this.reportHat,
            vm_report_stack_click: this.reportStackClick,
            vm_report_monitor: this.reportMonitor
        };
    }

    getHats () {
        return {
        };
    }

    endOfThread (args, {thread}) {
        thread.popStack();
        thread.status = Thread.STATUS_DONE;
    }

    endOfProcedure (args, {thread}) {
        thread.popStack();
        thread.goToNextBlock();
    }

    endOfLoopBranch (args, {thread}) {
        thread.popStack();
        thread.status = Thread.STATUS_YIELD;
    }

    endOfBranch (args, {thread}) {
        thread.popStack();
        thread.goToNextBlock();
    }

    _getBlockCached (sequencer, thread, currentBlockId) {
        const blockCached = (
            BlocksExecuteCache.getCached(thread.blockContainer, currentBlockId) ||
            BlocksExecuteCache.getCached(sequencer.blocks, currentBlockId) ||
            BlocksExecuteCache.getCached(sequencer.runtime.flyoutBlocks, currentBlockId)
        );
        if (blockCached === null) {
            // No block found: stop the thread; script no longer exists.
            sequencer.retireThread(thread);
        }
        return blockCached;
    }

    reenterFromPromise (args, {sequencer, thread}) {
        thread.popStack();

        // Current block to execute is the one on the top of the stack.
        const currentBlockId = thread.peekStack();

        const blockCached = this._getBlockCached(sequencer, thread, currentBlockId);
        if (blockCached === null) return;

        const ops = blockCached._ops;
        let i = 0;

        const reported = thread.reported;
        // Reinstate all the previous values.
        for (; i < reported.length; i++) {
            const {opCached: oldOpCached, inputValue} = reported[i];

            const opCached = ops.find(op => op.id === oldOpCached);

            if (opCached) {
                const inputName = opCached._parentKey;
                const argValues = opCached._parentValues;
                argValues[inputName] = inputValue;
            }
        }

        // Find the last reported block that is still in the set of operations.
        // This way if the last operation was removed, we'll find the next
        // candidate. If an earlier block that was performed was removed then
        // we'll find the index where the last operation is now.
        if (reported.length > 0) {
            const lastExisting = reported.reverse().find(report => ops.find(op => op.id === report.opCached));
            if (lastExisting) {
                i = ops.findIndex(opCached => opCached.id === lastExisting.opCached) + 1;
            } else {
                i = 0;
            }
        }

        // The reporting block must exist and must be the next one in the
        // sequence of operations.
        if (
            thread.justReported !== null &&
            ops[i] && ops[i].id === thread.reporting
        ) {
            const opCached = ops[i];
            const inputValue = thread.justReported;

            thread.justReported = null;

            const inputName = opCached._parentKey;
            const argValues = opCached._parentValues;
            argValues[inputName] = inputValue;
        }

        i += 1;

        thread.reporting = null;
        thread.reported = null;

        const allOps = blockCached._allOps;
        blockCached._ops = ops.slice(i);
        blockCached._allOps = allOps.slice(i);

        const continuous = thread.continuous;
        thread.continuous = false;
        execute(sequencer, thread);
        thread.continuous = continuous;

        blockCached._ops = ops;
        blockCached._allOps = allOps;

        if (thread.reported) {
            thread.reported = reported.concat(thread.reported);
        }

        if (
            thread.status === Thread.STATUS_RUNNING &&
            thread.peekStack() === currentBlockId
        ) {
            thread.goToNextBlock();
        }
    }

    reportHat (args, {sequencer, thread}) {
        // reportHat is injected as the final operation to the actual hat block
        // id by execute.js. So looking at the top of the stack will get us the
        const currentBlockId = thread.peekStack();

        const blockCached = this._getBlockCached(sequencer, thread, currentBlockId);
        if (blockCached === null) return;

        const opcode = blockCached.opcode;

        const resolvedValue = args.VALUE;

        // Hat predicate was evaluated.
        if (sequencer.runtime.getIsEdgeActivatedHat(opcode)) {
            // If this is an edge-activated hat, only proceed if the value is
            // true and used to be false, or the stack was activated explicitly
            // via stack click
            if (!thread.stackClick) {
                const hasOldEdgeValue = thread.target.hasEdgeActivatedValue(currentBlockId);
                const oldEdgeValue = thread.target.updateEdgeActivatedValue(
                    currentBlockId,
                    resolvedValue
                );

                const edgeWasActivated = hasOldEdgeValue ? (!oldEdgeValue && resolvedValue) : resolvedValue;
                if (!edgeWasActivated) {
                    sequencer.retireThread(thread);
                }
            }
        } else if (!resolvedValue) {
            // Not an edge-activated hat: retire the thread
            // if predicate was false.
            sequencer.retireThread(thread);
        }
    }

    reportStackClick (args, {sequencer, thread}) {
        // Current block to execute is the one on the top of the stack.
        const currentBlockId = thread.topBlock;

        const blockCached = this._getBlockCached(sequencer, thread, currentBlockId);
        if (blockCached === null) return;

        const isHat = blockCached._isHat;
        const resolvedValue = blockCached._parentValues[blockCached._parentKey];

        if (!isHat && typeof resolvedValue !== 'undefined') {
            sequencer.runtime.visualReport(currentBlockId, resolvedValue);
        }

        thread.popStack();
        thread.status = Thread.STATUS_DONE;
    }

    reportMonitor (args, {sequencer, thread}) {
        // Current block to execute is the one on the top of the stack.
        const currentBlockId = thread.topBlock;

        const blockCached = this._getBlockCached(sequencer, thread, currentBlockId);
        if (blockCached === null) return;

        const resolvedValue = blockCached._parentValues[blockCached._parentKey];

        if (typeof resolvedValue !== 'undefined') {
            const targetId = sequencer.runtime.monitorBlocks.getBlock(currentBlockId).targetId;
            if (targetId && !sequencer.runtime.getTargetById(targetId)) {
                // Target no longer exists
                return;
            }
            sequencer.runtime.requestUpdateMonitor(Map({
                id: currentBlockId,
                spriteName: targetId ? sequencer.runtime.getTargetById(targetId).getName() : null,
                value: resolvedValue
            }));
        }

        thread.popStack();
        thread.status = Thread.STATUS_DONE;
    }
}

module.exports = Scratch3VMBlocks;
