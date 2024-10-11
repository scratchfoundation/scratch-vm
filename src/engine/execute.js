const Blocks = require('./blocks');
const BlockUtility = require('./block-utility');
const BlocksExecuteCache = require('./blocks-execute-cache');
const log = require('../util/log');
const Thread = require('./thread');
const {Map} = require('immutable');

/**
 * Single BlockUtility instance reused by execute for every pritimive ran.
 * @const
 */
const blockUtility = new BlockUtility();

/**
 * Profiler frame name for block functions.
 * @const {string}
 */
const blockFunctionProfilerFrame = 'blockFunction';

/**
 * Profiler frame ID for 'blockFunction'.
 * @type {number}
 */
let blockFunctionProfilerId = -1;

/**
 * Utility function to determine if a value is a Promise.
 * @param {*} value Value to check for a Promise.
 * @return {boolean} True if the value appears to be a Promise.
 */
const isPromise = function (value) {
    return (
        value !== null &&
        typeof value === 'object' &&
        typeof value.then === 'function'
    );
};

/**
 * A execute.js internal representation of a block to reduce the time spent in
 * execute as the same blocks are called the most.
 *
 * With the help of the Blocks class create a mutable copy of block
 * information. The members of BlockCached derived values of block information
 * that does not need to be reevaluated until a change in Blocks. Since Blocks
 * handles where the cache instance is stored, it drops all cache versions of a
 * block when any change happens to it. This way we can quickly execute blocks
 * and keep perform the right action according to the current block information
 * in the editor.
 *
 * @param {Blocks} blockContainer the related Blocks instance
 * @param {object} block the block information to cache
 * @param {boolean} topLevel True if the block is top-level (not nested in
 * another block)
 */
class BlockCached {
    constructor (blockContainer, block, topLevel) {
        /**
         * Block id in its parent set of blocks.
         * @type {string}
         */
        this.id = block.id;

        /**
         * Block operation code for this block.
         * @type {string}
         */
        this.opcode = block.opcode;

        /**
         * The profiler the block is configured with.
         * @type {?Profiler}
         */
        this._profiler = null;

        /**
         * Profiler information frame.
         * @type {?ProfilerFrame}
         */
        this._profilerFrame = null;

        /**
         * Is the opcode a hat (event responder) block.
         * @type {boolean}
         */
        this._isHat = false;

        /**
         * The block opcode's implementation function.
         * @type {?function}
         */
        this._blockFunction = null;

        /**
         * Is this block a block with no function but a static value to return.
         * @type {boolean}
         */
        this._isShadowBlock = block.shadow;

        /**
         * The static value of this block if it is a shadow block.
         * @type {?any}
         */
        this._shadowValue = null;

        /**
         * An arguments object for block implementations. All executions of this
         * specific block will use this objecct.
         * @type {object}
         */
        this._argValues = {
            mutation: block.mutation
        };

        /**
         * The inputs key the parent refers to this BlockCached by.
         * @type {string}
         */
        this._parentKey = null;

        /**
         * The target object where the parent wants the resulting value stored
         * with _parentKey as the key.
         * @type {object}
         */
        this._parentValues = null;

        /**
         * A sequence of non-shadow operations that can must be performed. This
         * list recreates the order this block and its children are executed.
         * Since the order is always the same we can safely store that order
         * and iterate over the operations instead of dynamically walking the
         * tree every time.
         * @type {Array<BlockCached>}
         */
        this._ops = [];

        const {runtime} = blockUtility.sequencer;

        const {opcode, fields} = block;

        // Assign opcode isHat and blockFunction data to avoid dynamic lookups.
        this._isHat = runtime.getIsHat(opcode);
        this._blockFunction = runtime.getOpcodeFunction(opcode);

        // Store the current shadow value if there is a shadow value.
        const fieldKeys = Object.keys(fields);
        this._shadowValue = this._isShadowBlock && fields[fieldKeys[0]].value;

        // Store the static fields onto _argValues.
        for (const fieldName in fields) {
            if (
                fieldName === 'VARIABLE' ||
                fieldName === 'LIST' ||
                fieldName === 'BROADCAST_OPTION'
            ) {
                this._argValues[fieldName] = {
                    id: fields[fieldName].id,
                    name: fields[fieldName].value
                };
            } else {
                this._argValues[fieldName] = fields[fieldName].value;
            }
        }

        // NOTE: because we modify `inputs` in-place, this relies on getInputs returning a new object each
        // time it's called.
        const inputs = blockContainer.getInputs(block);
        // Remove custom_block. It is not part of block execution.
        delete inputs.custom_block;

        if ('BROADCAST_INPUT' in inputs) {
            // We can go ahead and compute BROADCAST_INPUT if it is a shadow
            // value.
            const broadcastInput = inputs.BROADCAST_INPUT;
            if (broadcastInput.block === broadcastInput.shadow) {
                // Shadow dropdown menu is being used.
                // Get the appropriate information out of it.
                const shadow = blockContainer.getBlock(broadcastInput.shadow);
                const broadcastField = shadow.fields.BROADCAST_OPTION;
                this._argValues.BROADCAST_INPUT = {
                    id: broadcastField.id,
                    name: broadcastField.value
                };

                // Evaluating BROADCAST_INPUT here we do not need to do so
                // later.
                delete inputs.BROADCAST_INPUT;
            }
        }

        // Cache all input children blocks in the operation lists. The
        // operations can later be run in the order they appear in correctly
        // executing the operations quickly in a flat loop instead of needing to
        // recursively iterate them.
        for (const inputName in inputs) {
            const input = inputs[inputName];
            if (inputName.startsWith(Blocks.BRANCH_INPUT_PREFIX)) {
                // Convert branch inputs to their block IDs
                this._argValues[inputName] = input.block;
            } else if (input.block) {
                const inputCached = BlocksExecuteCache.getCached(blockContainer, input.block, BlockCached);

                if (inputCached._isHat) {
                    continue;
                }

                this._ops.push(...inputCached._ops);
                inputCached._parentKey = inputName;
                inputCached._parentValues = this._argValues;

                // Shadow values are static and do not change, go ahead and
                // store their value on args.
                if (inputCached._isShadowBlock) {
                    this._argValues[inputName] = inputCached._shadowValue;
                }
            }
        }

        // The final operation is this block itself. At the top most block is a
        // command block or a block that is being run as a monitor.
        if (typeof this._blockFunction === 'function') {
            this._ops.push(this);
        }

        /**
         * @method
         * @name BlockCached#handleReport
         * @desc Handle the value (eventually) returned by this block primitive's function.
         * Dynamically set based on this block's properties (top-level or nested? hat predicate?)
         * @param {*} reportedValue Value eventually returned from the primitive.
         * @param {!Thread} thread Thread containing the primitive.
         */
        if (topLevel) {
            if (this._isHat) {
                // This is an edge-activated hat block. Handle the reported value by retiring the thread if the
                // hat predicate did not transition from false to true during the last tick.
                if (runtime.getIsEdgeActivatedHat(opcode)) {
                    this.handleReport = (reportedValue, thread) => {
                        // If this is an edge-activated hat, only proceed if the value is
                        // true and used to be false, or the stack was activated explicitly
                        // via stack click
                        if (!thread.stackClick) {
                            const hasOldEdgeValue = thread.target.hasEdgeActivatedValue(this.id);
                            const oldEdgeValue = thread.target.updateEdgeActivatedValue(this.id, reportedValue);

                            const edgeWasActivated = hasOldEdgeValue ? (!oldEdgeValue && reportedValue) : reportedValue;
                            if (!edgeWasActivated) {
                                thread.retire();
                            }
                        }
                    };
                } else {
                    // This is a non-edge-activated hat. Handle the reported value by retiring the thread if the hat
                    // predicate evaluated to false.
                    this.handleReport = (reportedValue, thread) => {
                        if (!reportedValue) {
                            thread.retire();
                        }
                    };
                }
            } else {
                // This is a top-level block, either for a monitor thread or for a block that the user activated by
                // clicking.
                this.handleReport = (reportedValue, thread) => {
                    if (typeof reportedValue === 'undefined' || reportedValue === null || !thread.atStackTop()) {
                        return;
                    }
                    // In a non-hat, report the value visually if necessary if
                    // at the top of the thread stack.
                    if (thread.stackClick) {
                        runtime.visualReport(this.id, reportedValue);
                    }
                    if (thread.updateMonitor) {
                        const targetId = runtime.monitorBlocks.getBlock(this.id).targetId;
                        if (targetId && !runtime.getTargetById(targetId)) {
                            // Target no longer exists
                            return;
                        }
                        runtime.requestUpdateMonitor(Map({
                            id: this.id,
                            spriteName: targetId ? runtime.getTargetById(targetId).getName() : null,
                            value: reportedValue
                        }));
                    }
                };
            }
        } else {
            // This is a reporter block nested within another block's input.
            // Handle the report by setting the parent's argument value to the result of evaluating this block.
            this.handleReport = reportedValue => {
                this._parentValues[this._parentKey] = reportedValue;
            };
        }
    }
}

/**
 * Initialize a BlockCached instance so its command/hat
 * block and reporters can be profiled during execution.
 * @param {Profiler} profiler - The profiler that is currently enabled.
 * @param {BlockCached} blockCached - The blockCached instance to profile.
 */
const _prepareBlockProfiling = function (profiler, blockCached) {
    blockCached._profiler = profiler;

    if (blockFunctionProfilerId === -1) {
        blockFunctionProfilerId = profiler.idByName(blockFunctionProfilerFrame);
    }

    const ops = blockCached._ops;
    for (let i = 0; i < ops.length; i++) {
        ops[i]._profilerFrame = profiler.frame(blockFunctionProfilerId, ops[i].opcode);
    }
};

/**
 * Execute a block.
 * @param {!Sequencer} sequencer Which sequencer is executing.
 * @param {!Thread} thread Thread which to read and execute.
 */
const execute = function (sequencer, thread) {
    const runtime = sequencer.runtime;

    // store sequencer and thread so block functions can access them through
    // convenience methods.
    blockUtility.sequencer = sequencer;
    blockUtility.thread = thread;

    // Current block to execute is the one on the top of the stack.
    const currentBlockId = thread.peekStack();

    /** @type {BlockCached} */
    const blockCached = BlocksExecuteCache.getCached(thread.blockContainer, currentBlockId, BlockCached, true);
    // Stop if block or target no longer exists.
    if (blockCached === null) {
        // No block found: stop the thread; script no longer exists.
        thread.retire();
        return;
    }

    // Indicate the block that is executing.
    thread.blockGlowInFrame = currentBlockId;

    const ops = blockCached._ops;
    const length = ops.length;
    let i = 0;

    // Just resolved a promise on this thread.
    if (thread.justResolved) {
        // Even if there were no reported values, thread.reported still exists, it's just empty
        const reported = thread.reported;
        // Reinstate all the previously-reported values since the BlockCached may have been re-created.
        for (let j = 0; j < reported.length; j++) {
            const {oldOpID, inputValue} = reported[j];

            const opCached = ops.find(op => op.id === oldOpID);

            // Copy the previously-reported values onto the parent block
            if (opCached) {
                opCached._parentValues[opCached._parentKey] = inputValue;
            }
        }

        // Find the last reported block that is still in the set of operations.
        // This way if the last operation was removed, we'll find the next
        // candidate. If an earlier block that was performed was removed then
        // we'll find the index where the last operation is now.
        for (let j = reported.length - 1; j >= 0; j--) {
            // Resume execution after the last reported block
            const opIndex = ops.findIndex(op => op.id === reported[j].oldOpID);
            if (opIndex !== -1) {
                i = opIndex + 1;
                break;
            }
        }

        // The reporting block must exist and must be the next one in the sequence of operations.
        if (i < length && ops[i].id === thread.reportingBlockId) {
            ops[i].handleReport(thread.resolvedValue, thread);

            // If this is the last operation, this sets i to the length of `ops`. This means that the below loop will
            // not execute, and we won't re-execute this block.
            i += 1;
        }

        thread.finishResuming();
    }

    const start = i;

    for (; i < length; i++) {
        const opCached = ops[i];

        const blockFunction = opCached._blockFunction;

        // Update values for arguments (inputs).
        const argValues = opCached._argValues;

        // Fields are set during opCached initialization.

        // Inputs are set during previous steps in the loop.

        const primitiveReportedValue = blockFunction(argValues, blockUtility);

        // If it's a promise, wait until promise resolves.
        if (isPromise(primitiveReportedValue)) {
            // Resume thread after the promise resolves
            const generation = thread.generation;
            primitiveReportedValue
                .then(resolvedValue => {
                    // The thread has either been stopped or restarted while we were waiting for the promise. Don't do
                    // anything since we're working with stale state.
                    if (thread.status === Thread.STATUS_DONE || thread.generation !== generation) return;

                    thread.resume(resolvedValue);
                }, rejectionReason => {
                    // Promise rejected: the primitive had some error.
                    // Log it and proceed.
                    log.warn('Primitive rejected promise: ', rejectionReason);
                    // Return an empty string
                    return '';
                });

            // Store the values from the blocks that we *did* run to completion. We store them by block ID because the
            // blockCached objects will be re-created if the block cache changes. When the promise resolves, we fill in
            // the parent block's inputs with these values.
            thread.pause(opCached.id, ops.slice(0, i).map(op => {
                const inputName = op._parentKey;
                const reportedValues = op._parentValues;

                return {
                    oldOpID: op.id,
                    inputValue: reportedValues[inputName]
                };
            }));

            // We are waiting for a promise. Stop running this set of operations
            // and continue them later after thawing the reported values.
            break;
        }

        if (thread.status === Thread.STATUS_RUNNING) {
            opCached.handleReport(primitiveReportedValue, thread);
        }
    }

    if (runtime.profiler !== null) {
        if (blockCached._profiler !== runtime.profiler) {
            _prepareBlockProfiling(runtime.profiler, blockCached);
        }
        // Determine the index that is after the last executed block. `i` is
        // currently the block that was just executed. `i + 1` will be the block
        // after that. `length` with the min call makes sure we don't try to
        // reference an operation outside of the set of operations.
        const end = Math.min(i + 1, length);
        for (let p = start; p < end; p++) {
            ops[p]._profilerFrame.count += 1;
        }
    }
};

module.exports = execute;
