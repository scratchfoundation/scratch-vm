const BlockUtility = require('./block-utility');
const BlocksExecuteCache = require('./blocks-execute-cache');
const log = require('../util/log');
const Thread = require('./thread');

/**
 * Thread status value when it is actively running.
 * @const {number}
 */
const STATUS_RUNNING = Thread.STATUS_RUNNING;

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
        typeof value === 'object' &&
        value !== null &&
        typeof value.then === 'function'
    );
};

/**
 * Handle any reported value from the primitive, either directly returned
 * or after a promise resolves.
 * @param {*} reportedValue Value eventually returned from the primitive.
 * @param {!Thread} thread Thread containing the primitive.
 * @param {!string} blockCached cached block of data used by execute.
 */
const handlePromise = (reportedValue, thread, blockCached) => {
    if (thread.status === Thread.STATUS_RUNNING) {
        // Primitive returned a promise; automatically yield thread.
        thread.status = Thread.STATUS_PROMISE_WAIT;
    }

    // Promise handlers
    reportedValue.then(resolvedValue => {
        thread.pushReportedValue(resolvedValue);
        thread.status = Thread.STATUS_RUNNING;
        thread.pushStack('vm_reenter_promise');
    }, rejectionReason => {
        // Promise rejected: the primitive had some error. Log it and proceed.
        log.warn('Primitive rejected promise: ', rejectionReason);
        thread.status = Thread.STATUS_RUNNING;
        thread.popStack();
    });

    // Store the already reported values. They will be thawed into the
    // future versions of the same operations by block id. The reporting
    // operation if it is promise waiting will set its parent value at
    // that time.
    thread.justReported = null;
    const ops = blockCached._ops;
    thread.reporting = blockCached.id;
    thread.reported = ops.slice(0, ops.length - 1).map(reportedCached => {
        const inputName = reportedCached._parentKey;
        const reportedValues = reportedCached._parentValues;
        return {
            opCached: reportedCached.id,
            inputValue: reportedValues[inputName]
        };
    });
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
 * @param {object} cached default set of cached values
 */
class BlockCached {
    constructor (blockContainer, cached) {
        /**
         * Block id in its parent set of blocks.
         * @type {string}
         */
        this.id = cached.id;

        /**
         * Block operation code for this block.
         * @type {string}
         */
        this.opcode = cached.opcode;

        /**
         * Some opcodes (vm_*) should not be measured by the profiler.
         * @type {boolean}
         */
        this.profileOpcode = !cached.opcode.startsWith('vm_');

        /**
         * Original block object containing argument values for static fields.
         * @type {object}
         */
        this.fields = cached.fields;

        /**
         * Original block object containing argument values for executable inputs.
         * @type {object}
         */
        this.inputs = cached.inputs;

        /**
         * Procedure mutation.
         * @type {?object}
         */
        this.mutation = cached.mutation;

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
         * The block opcode function before being self-bound.
         * @type {?function}
         */
        this._blockFunctionUnbound = null;

        /**
         * The bound block opcode context.
         * @type {?object}
         */
        this._blockFunctionContext = null;

        /**
         * Is the block function defined for this opcode?
         * @type {boolean}
         */
        this._definedBlockFunction = false;

        /**
         * Is this block a block with no function but a static value to return.
         * @type {boolean}
         */
        this._isShadowBlock = false;

        /**
         * The static value of this block if it is a shadow block.
         * @type {?any}
         */
        this._shadowValue = null;

        /**
         * A copy of the block's fields that may be modified.
         * @type {object}
         */
        this._fields = Object.assign({}, this.fields);

        /**
         * A copy of the block's inputs that may be modified.
         * @type {object}
         */
        this._inputs = Object.assign({}, this.inputs);

        /**
         * An arguments object for block implementations. All executions of this
         * specific block will use this objecct.
         * @type {object}
         */
        this._argValues = {
            mutation: this.mutation
        };

        /**
         * The inputs key the parent refers to this BlockCached by.
         * @type {string}
         */
        this._parentKey = 'VALUE';

        /**
         * The target object where the parent wants the resulting value stored
         * with _parentKey as the key.
         * @type {object}
         */
        this._parentValues = {};

        /**
         * A sequence of shadow value operations that can be performed in any
         * order and are easier to perform given that they are static.
         * @type {Array<BlockCached>}
         */
        this._shadowOps = [];

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

        const {opcode, fields, inputs} = this;

        // Assign opcode isHat and blockFunction data to avoid dynamic lookups.
        this._isHat = runtime.getIsHat(opcode);
        this._blockFunction = runtime.getOpcodeFunction(opcode);
        this._definedBlockFunction = typeof this._blockFunction !== 'undefined';
        if (this._definedBlockFunction) {
            // If available, save the unbound function. It's faster to
            // unbound.call(context) than to call unbound.bind(context)().
            this._blockFunctionUnbound = this._blockFunction._function || this._blockFunction;
            this._blockFunctionContext = this._blockFunction._context;
        } else {
            this._blockFunctionUnbound = null;
            this._blockFunctionContext = null;
        }

        // Store the current shadow value if there is a shadow value.
        const fieldKeys = Object.keys(fields);
        this._isShadowBlock = (
            !this._definedBlockFunction &&
            fieldKeys.length === 1 &&
            Object.keys(inputs).length === 0
        );
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

        // Remove custom_block. It is not part of block execution.
        delete this._inputs.custom_block;

        if ('BROADCAST_INPUT' in this._inputs) {
            // BROADCAST_INPUT is called BROADCAST_OPTION in the args and is an
            // object with an unchanging shape.
            this._argValues.BROADCAST_OPTION = {
                id: null,
                name: null
            };

            // We can go ahead and compute BROADCAST_INPUT if it is a shadow
            // value.
            const broadcastInput = this._inputs.BROADCAST_INPUT;
            if (broadcastInput.block === broadcastInput.shadow) {
                // Shadow dropdown menu is being used.
                // Get the appropriate information out of it.
                const shadow = blockContainer.getBlock(broadcastInput.shadow);
                const broadcastField = shadow.fields.BROADCAST_OPTION;
                this._argValues.BROADCAST_OPTION.id = broadcastField.id;
                this._argValues.BROADCAST_OPTION.name = broadcastField.value;

                // Evaluating BROADCAST_INPUT here we do not need to do so
                // later.
                delete this._inputs.BROADCAST_INPUT;
            }
        }

        // Cache all input children blocks in the operation lists. The
        // operations can later be run in the order they appear in correctly
        // executing the operations quickly in a flat loop instead of needing to
        // recursivly iterate them.
        for (const inputName in this._inputs) {
            const input = this._inputs[inputName];
            if (input.block && inputName === 'BROADCAST_INPUT') {
                // We can use a vm_* block to cast to a string and save it where
                // it would normally be placed. This lets us produce this value
                // dynamically without having special case handling later in the
                // runtime execute function.
                const inputCached = new BlockCached(runtime.sequencer.blocks, {
                    id: 'vm_cast_string',
                    opcode: 'vm_cast_string',
                    fields: {},
                    inputs: {
                        VALUE: {
                            block: input.block,
                            shadow: null
                        }
                    },
                    mutation: null
                });

                this._shadowOps.push(...inputCached._shadowOps);
                this._ops.push(...inputCached._ops);
                inputCached._parentKey = 'name';
                inputCached._parentValues = this._argValues.BROADCAST_OPTION;
            } else if (input.block) {
                const inputCached = BlocksExecuteCache.getCached(blockContainer, input.block, BlockCached);

                if (inputCached._isHat) {
                    continue;
                }

                this._shadowOps.push(...inputCached._shadowOps);
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
        if (!this._isHat && this._isShadowBlock) {
            this._shadowOps.push(this);
        } else if (this._definedBlockFunction) {
            this._ops.push(this);

            if (this._isHat) {
                const reportCached = new BlockCached(null, {
                    id: 'vm_report_hat',
                    opcode: 'vm_report_hat',
                    fields: {},
                    inputs: {},
                    mutation: null
                });

                this._ops = [...this._ops, ...reportCached._ops];
                this._parentKey = 'VALUE';
                this._parentValues = reportCached._argValues;
            }
        }

        this._allOps = this._ops;

        if (this.opcode !== 'vm_may_continue') {
            const nextId = blockContainer ?
                blockContainer.getNextBlock(this.id) :
                null;
            const nextCached = blockContainer ? BlocksExecuteCache.getCached(
                blockContainer, nextId, BlockCached
            ) : null;

            this._next = nextCached;

            if (nextCached) {
                if (!nextCached._next) {
                    // If we step the thread with a block we must step the
                    // thread in every following thread including the last in
                    // the sequence. The last block doesn't know though if it is
                    // last or if it is a reporter so the block before it will
                    // finish its configuration. If the last block is alone in
                    // the stack, the normal step behaviour outside of the block
                    // sequence will step us.
                    const mayStepFromLastCached = new BlockCached(null, {
                        id: 'vm_may_continue',
                        opcode: 'vm_may_continue',
                        fields: {},
                        inputs: {},
                        mutation: null
                    });

                    mayStepFromLastCached._argValues = {
                        EXPECT_STACK: nextCached.id,
                        NEXT_STACK: null
                    };

                    nextCached._ops.push(mayStepFromLastCached);
                }

                const mayContinueCached = new BlockCached(null, {
                    id: 'vm_may_continue',
                    opcode: 'vm_may_continue',
                    fields: {},
                    inputs: {},
                    mutation: null
                });

                mayContinueCached._argValues = {
                    EXPECT_STACK: this.id,
                    NEXT_STACK: nextId
                };

                this._ops.push(mayContinueCached);
                this._allOps = [
                    ...this._ops,
                    ...nextCached._allOps
                ];
            }
        }
    }
}

/**
 * Execute a block.
 * @param {!Sequencer} sequencer Which sequencer is executing.
 * @param {!Thread} thread Thread which to read and execute.
 */
const execute = function (sequencer, thread) {
    const runtime = sequencer.runtime;

    // Blocks should glow when a script is starting, not after it has finished
    // (see #1404). Only blocks in blockContainers that don't forceNoGlow should
    // request a glow.
    if (!thread.blockContainer.forceNoGlow) {
        thread.requestScriptGlowInFrame = true;
    }

    let currentBlockId;

    // Store old sequencer and thread and reset them after execution.
    const _lastSequencer = blockUtility.sequencer;
    const _lastThread = blockUtility.thread;

    // store sequencer and thread so block functions can access them through
    // convenience methods.
    blockUtility.sequencer = sequencer;
    blockUtility.thread = thread;

    do {
        // On a second iteration, step the thread if it has not experienced
        // control flow.
        if (thread.pointer === currentBlockId) {
            thread.goToNextBlock();
        }

        // Current block to execute is the one on the top of the stack.
        currentBlockId = thread.pointer || thread.stackFrame.endBlockId;

        const blockCached = (
            BlocksExecuteCache.getCached(thread.blockContainer, currentBlockId, BlockCached) ||
            BlocksExecuteCache.getCached(sequencer.blocks, currentBlockId, BlockCached) ||
            BlocksExecuteCache.getCached(runtime.flyoutBlocks, currentBlockId, BlockCached)
        );
        if (blockCached === null) {
            // No block found: stop the thread; script no longer exists.
            sequencer.retireThread(thread);
            break;
        }

        const isNotProfiling = runtime.profiler === null || !blockCached.profileOpcode;

        const ops = blockCached._allOps;
        const length = ops.length;
        let i = 0;

        let reportedValue;
        let opCached;

        for (; i < length && thread.status === STATUS_RUNNING; i++) {
            opCached = ops[i];

            if (isNotProfiling) {
                opCached._parentValues[opCached._parentKey] = reportedValue =
                    opCached._blockFunctionUnbound.call(
                        opCached._blockFunctionContext,
                        opCached._argValues, blockUtility
                    );
            } else {
                const {profiler} = runtime;

                if (blockFunctionProfilerId === -1) {
                    blockFunctionProfilerId = profiler.idByName(blockFunctionProfilerFrame);
                }

                const opcode = opCached.opcode;
                // The method commented below has its code inlined
                // underneath to reduce the bias recorded for the profiler's
                // calls in this time sensitive execute function.
                //
                // profiler.start(blockFunctionProfilerId, opcode);
                profiler.records.push(
                    profiler.START, blockFunctionProfilerId, opcode, 0);

                opCached._parentValues[opCached._parentKey] = reportedValue =
                    opCached._blockFunctionUnbound.call(
                        opCached._blockFunctionContext,
                        opCached._argValues, blockUtility
                    );

                // profiler.stop(blockFunctionProfilerId);
                profiler.records.push(profiler.STOP, 0);
            }

            // If it's a promise, wait until promise resolves.
            if (isPromise(reportedValue)) {
                // We are waiting for a promise. Set the status to a non-running
                // state and store the arg values for the executed operations.
                handlePromise(reportedValue, thread, opCached);
            }
        }

        if (thread.status === Thread.STATUS_INTERRUPT) {
            thread.status = STATUS_RUNNING;
        }
    } while (thread.continuous && thread.status === STATUS_RUNNING);

    thread.blockGlowInFrame = thread.pointer;

    blockUtility.sequencer = _lastSequencer;
    blockUtility.thread = _lastThread;
};

module.exports = execute;
