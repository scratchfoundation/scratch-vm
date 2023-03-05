const BlockUtility = require('./block-utility');
const BlocksExecuteCache = require('./blocks-execute-cache');
const log = require('../util/log');
const Thread = require('./thread');
const {Map} = require('immutable');
const cast = require('../util/cast');

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
 * Handle any reported value from the primitive, either directly returned
 * or after a promise resolves.
 * @param {*} resolvedValue Value eventually returned from the primitive.
 * @param {!Sequencer} sequencer Sequencer stepping the thread for the ran
 * primitive.
 * @param {!Thread} thread Thread containing the primitive.
 * @param {!string} currentBlockId Id of the block in its thread for value from
 * the primitive.
 * @param {!string} opcode opcode used to identify a block function primitive.
 * @param {!boolean} isHat Is the current block a hat?
 */
// @todo move this to callback attached to the thread when we have performance
// metrics (dd)
const handleReport = function (resolvedValue, sequencer, thread, blockCached) {
    const currentBlockId = blockCached.id;
    const opcode = blockCached.opcode;
    const isHat = blockCached._isHat;

    if (isHat) {
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
    } else if (typeof resolvedValue !== 'undefined' && resolvedValue !== null && thread.atStackTop()) {
        // In a non-hat, report the value visually if necessary if
        // at the top of the thread stack.
        if (thread.stackClick) {
            sequencer.runtime.visualReport(currentBlockId, resolvedValue);
        }
        if (thread.updateMonitor) {
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
    }
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
 */
class BlockCached {
    constructor (blockContainer, block) {
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

        // NOTE: because we modify `inputs` in-place, this relies on getNonBranchInputs returning a new object each
        // time it's called.
        const inputs = blockContainer.getNonBranchInputs(block);
        // Remove custom_block. It is not part of block execution.
        delete inputs.custom_block;

        if ('BROADCAST_INPUT' in inputs) {
            // BROADCAST_INPUT is called BROADCAST_OPTION in the args and is an
            // object with an unchanging shape.
            this._argValues.BROADCAST_OPTION = {
                id: null,
                name: null
            };

            // We can go ahead and compute BROADCAST_INPUT if it is a shadow
            // value.
            const broadcastInput = inputs.BROADCAST_INPUT;
            if (broadcastInput.block === broadcastInput.shadow) {
                // Shadow dropdown menu is being used.
                // Get the appropriate information out of it.
                const shadow = blockContainer.getBlock(broadcastInput.shadow);
                const broadcastField = shadow.fields.BROADCAST_OPTION;
                this._argValues.BROADCAST_OPTION.id = broadcastField.id;
                this._argValues.BROADCAST_OPTION.name = broadcastField.value;

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
            if (input.block) {
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

    let blockContainer = thread.blockContainer;
    let blockCached = BlocksExecuteCache.getCached(blockContainer, currentBlockId, BlockCached);
    if (blockCached === null) {
        blockContainer = runtime.flyoutBlocks;
        blockCached = BlocksExecuteCache.getCached(blockContainer, currentBlockId, BlockCached);
        // Stop if block or target no longer exists.
        if (blockCached === null) {
            // No block found: stop the thread; script no longer exists.
            sequencer.retireThread(thread);
            return;
        }
    }

    // Blocks should glow when a script is starting, not after it has finished
    // (see #1404). Only blocks in blockContainers that don't forceNoGlow should
    // request a glow.
    if (!blockContainer.forceNoGlow) {
        thread.requestScriptGlowInFrame = true;
        // Indicate the block that is executing.
        thread.blockGlowInFrame = currentBlockId;
    }

    const ops = blockCached._ops;
    const length = ops.length;
    let i = 0;

    // Just resolved a promise on this thread.
    if (thread.justResolved) {
        // Even if there were no reported values, thread.reported still exists, it's just empty
        const reported = thread.reported;
        // Reinstate all the previous values.
        for (let j = 0; j < reported.length; j++) {
            const {oldOpID, inputValue} = reported[j];

            const opCached = ops.find(op => op.id === oldOpID);

            if (opCached) {
                const inputName = opCached._parentKey;
                const argValues = opCached._parentValues;

                if (inputName === 'BROADCAST_INPUT') {
                    // Something is plugged into the broadcast input.
                    // Cast it to a string. We don't need an id here.
                    argValues.BROADCAST_OPTION.id = null;
                    argValues.BROADCAST_OPTION.name = cast.toString(inputValue);
                } else {
                    argValues[inputName] = inputValue;
                }
            }
        }

        // Find the last reported block that is still in the set of operations.
        // This way if the last operation was removed, we'll find the next
        // candidate. If an earlier block that was performed was removed then
        // we'll find the index where the last operation is now.
        if (reported.length > 0) {
            const lastExisting = reported.reverse().find(report => ops.find(op => op.id === report.oldOpID));
            if (lastExisting) {
                i = ops.findIndex(opCached => opCached.id === lastExisting.oldOpID) + 1;
            }
        }

        const lastOperation = i === length - 1;
        // The reporting block must exist and must be the next one in the sequence of operations.
        if (ops[i] && ops[i].id === thread.reportingBlockId) {
            const inputValue = thread.resolvedValue;
            const opCached = ops[i];

            thread.clearResolvedValue();

            if (lastOperation) {
                handleReport(inputValue, sequencer, thread, opCached);
            } else {
                const inputName = opCached._parentKey;
                const argValues = opCached._parentValues;

                if (inputName === 'BROADCAST_INPUT') {
                    // Something is plugged into the broadcast input.
                    // Cast it to a string. We don't need an id here.
                    argValues.BROADCAST_OPTION.id = null;
                    argValues.BROADCAST_OPTION.name = cast.toString(inputValue);
                } else {
                    argValues[inputName] = inputValue;
                }
            }

            // If this is the last operation, this sets i to the length of `ops`. This means that the below loop will
            // not execute, and we won't re-execute this block.
            i += 1;
        } else if (lastOperation) {
            throw new Error('Promise block seems to be missing its own op');
        }

        // We'll later set these again if we didn't finish. It's fine to assume earlier that thread.reported is not
        // null, because if it is, that's a logic bug.
        thread.reportingBlockId = null;
        thread.reported = null;
    }

    const start = i;

    for (; i < length; i++) {
        const lastOperation = i === length - 1;
        const opCached = ops[i];

        const blockFunction = opCached._blockFunction;

        // Update values for arguments (inputs).
        const argValues = opCached._argValues;

        // Fields are set during opCached initialization.

        // Inputs are set during previous steps in the loop.

        const primitiveReportedValue = blockFunction(argValues, blockUtility);

        // If it's a promise, wait until promise resolves.
        if (isPromise(primitiveReportedValue)) {
            // Primitive returned a promise; automatically yield thread.
            thread.status = Thread.STATUS_PROMISE_WAIT;
            // Resume thread after the promise resolves
            primitiveReportedValue
                .catch(rejectionReason => {
                    // Promise rejected: the primitive had some error.
                    // Log it and proceed.
                    log.warn('Primitive rejected promise: ', rejectionReason);
                    // Return an empty string
                    return '';
                }).then(resolvedValue => {
                    // A thread that is STATUS_DONE must stay STATUS_DONE
                    if (thread.status === Thread.STATUS_DONE) return;
                    thread.setResolvedValue(resolvedValue);
                    // Finished any yields.
                    thread.status = Thread.STATUS_RUNNING;
                });

            // Store the already reported values. They will be thawed into the
            // future versions of the same operations by block id. The reporting
            // operation if it is promise waiting will set its parent value at
            // that time.
            thread.clearResolvedValue();
            thread.reportingBlockId = ops[i].id;
            thread.reported = ops.slice(0, i).map(reportedCached => {
                const inputName = reportedCached._parentKey;
                const reportedValues = reportedCached._parentValues;

                if (inputName === 'BROADCAST_INPUT') {
                    return {
                        oldOpID: reportedCached.id,
                        inputValue: reportedValues[inputName].BROADCAST_OPTION.name
                    };
                }
                return {
                    oldOpID: reportedCached.id,
                    inputValue: reportedValues[inputName]
                };
            });

            // We are waiting for a promise. Stop running this set of operations
            // and continue them later after thawing the reported values.
            break;
        } else if (thread.status === Thread.STATUS_RUNNING) {
            if (lastOperation) {
                handleReport(primitiveReportedValue, sequencer, thread, opCached);
            } else {
                // By definition a block that is not last in the list has a
                // parent.
                const inputName = opCached._parentKey;
                const parentValues = opCached._parentValues;

                if (inputName === 'BROADCAST_INPUT') {
                    // Something is plugged into the broadcast input.
                    // Cast it to a string. We don't need an id here.
                    parentValues.BROADCAST_OPTION.id = null;
                    parentValues.BROADCAST_OPTION.name = cast.toString(primitiveReportedValue);
                } else {
                    parentValues[inputName] = primitiveReportedValue;
                }
            }
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
