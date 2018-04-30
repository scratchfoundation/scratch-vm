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
const handleReport = function (
    resolvedValue, sequencer, thread, currentBlockId, opcode, isHat) {
    thread.pushReportedValue(resolvedValue);
    if (isHat) {
        // Hat predicate was evaluated.
        if (sequencer.runtime.getIsEdgeActivatedHat(opcode)) {
            // If this is an edge-activated hat, only proceed if the value is
            // true and used to be false, or the stack was activated explicitly
            // via stack click
            if (!thread.stackClick) {
                const oldEdgeValue = sequencer.runtime.updateEdgeActivatedValue(
                    currentBlockId,
                    resolvedValue
                );
                const edgeWasActivated = !oldEdgeValue && resolvedValue;
                if (!edgeWasActivated) {
                    sequencer.retireThread(thread);
                }
            }
        } else if (!resolvedValue) {
            // Not an edge-activated hat: retire the thread
            // if predicate was false.
            sequencer.retireThread(thread);
        }
    } else {
        // In a non-hat, report the value visually if necessary if
        // at the top of the thread stack.
        if (typeof resolvedValue !== 'undefined' && thread.atStackTop()) {
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
                    value: String(resolvedValue)
                }));
            }
        }
        // Finished any yields.
        thread.status = Thread.STATUS_RUNNING;
    }
};

/**
 * A convenience constant to help make use of the recursiveCall argument easier
 * to read.
 * @const {boolean}
 */
const RECURSIVE = true;

/**
 * A simple description of the kind of information held in the fields of a block.
 * @enum {string}
 */
const FieldKind = {
    NONE: 'NONE',
    VARIABLE: 'VARIABLE',
    LIST: 'LIST',
    BROADCAST_OPTION: 'BROADCAST_OPTION',
    DYNAMIC: 'DYNAMIC'
};

/**
 * Execute a block.
 * @param {!Sequencer} sequencer Which sequencer is executing.
 * @param {!Thread} thread Thread which to read and execute.
 * @param {boolean} recursiveCall is execute called from another execute call?
 */
const execute = function (sequencer, thread, recursiveCall) {
    const runtime = sequencer.runtime;

    // Current block to execute is the one on the top of the stack.
    const currentBlockId = thread.peekStack();
    const currentStackFrame = thread.peekStackFrame();

    let blockContainer = thread.blockContainer;
    let block = blockContainer.getBlock(currentBlockId);
    if (typeof block === 'undefined') {
        blockContainer = runtime.flyoutBlocks;
        block = blockContainer.getBlock(currentBlockId);
        // Stop if block or target no longer exists.
        if (typeof block === 'undefined') {
            // No block found: stop the thread; script no longer exists.
            sequencer.retireThread(thread);
            return;
        }
    }

    // With the help of the Blocks class create a cached copy of values from
    // Blocks and the derived values execute needs. These values can be produced
    // one time during the first execution of a block so that later executions
    // are faster by using these cached values. This helps turn most costly
    // javascript operations like testing if the fields for a block has a
    // certain key like VARIABLE into a test that done once is saved on the
    // cache object to _isFieldVariable. This reduces the cost later in execute
    // when that will determine how execute creates the argValues for the
    // blockFunction.
    //
    // With Blocks providing this private function for execute to use, any time
    // Blocks is modified in the editor these cached objects will be cleaned up
    // and new cached copies can be created. This lets us optimize this critical
    // path while keeping up to date with editor changes to a project.
    const blockCached = BlocksExecuteCache.getCached(blockContainer, currentBlockId);
    if (blockCached._initialized !== true) {
        const {opcode, fields, inputs} = blockCached;

        // Assign opcode isHat and blockFunction data to avoid dynamic lookups.
        blockCached._isHat = runtime.getIsHat(opcode);
        blockCached._blockFunction = runtime.getOpcodeFunction(opcode);
        blockCached._definedBlockFunction = typeof blockCached._blockFunction !== 'undefined';

        const fieldKeys = Object.keys(fields);

        // Store the current shadow value if there is a shadow value.
        blockCached._isShadowBlock = fieldKeys.length === 1 && Object.keys(inputs).length === 0;
        blockCached._shadowValue = blockCached._isShadowBlock && fields[fieldKeys[0]].value;

        // Store a fields copy. If fields is a VARIABLE, LIST, or
        // BROADCAST_OPTION, store the created values so fields assignment to
        // argValues does not iterate over fields.
        blockCached._fields = Object.assign({}, blockCached.fields);
        blockCached._fieldKind = fieldKeys.length > 0 ? FieldKind.DYNAMIC : FieldKind.NONE;
        if (fieldKeys.length === 1 && fieldKeys.includes('VARIABLE')) {
            blockCached._fieldKind = FieldKind.VARIABLE;
            blockCached._fieldVariable = {
                id: fields.VARIABLE.id,
                name: fields.VARIABLE.value
            };
        } else if (fieldKeys.length === 1 && fieldKeys.includes('LIST')) {
            blockCached._fieldKind = FieldKind.LIST;
            blockCached._fieldList = {
                id: fields.LIST.id,
                name: fields.LIST.value
            };
        } else if (fieldKeys.length === 1 && fieldKeys.includes('BROADCAST_OPTION')) {
            blockCached._fieldKind = FieldKind.BROADCAST_OPTION;
            blockCached._fieldBroadcastOption = {
                id: fields.BROADCAST_OPTION.id,
                name: fields.BROADCAST_OPTION.value
            };
        }

        // Store a modified inputs. This assures the keys are its own properties
        // and that custom_block will not be evaluated.
        blockCached._inputs = Object.assign({}, blockCached.inputs);
        delete blockCached._inputs.custom_block;

        blockCached._initialized = true;
    }

    const opcode = blockCached.opcode;
    const fields = blockCached._fields;
    const inputs = blockCached._inputs;
    const mutation = blockCached.mutation;
    const blockFunction = blockCached._blockFunction;
    const isHat = blockCached._isHat;

    // Hats and single-field shadows are implemented slightly differently
    // from regular blocks.
    // For hats: if they have an associated block function, it's treated as a
    // predicate; if not, execution will proceed as a no-op. For single-field
    // shadows: If the block has a single field, and no inputs, immediately
    // return the value of the field.
    if (!blockCached._definedBlockFunction) {
        if (!opcode) {
            log.warn(`Could not get opcode for block: ${currentBlockId}`);
            return;
        }

        if (recursiveCall === RECURSIVE && blockCached._isShadowBlock) {
            // One field and no inputs - treat as arg.
            thread.pushReportedValue(blockCached._shadowValue);
            thread.status = Thread.STATUS_RUNNING;
        } else if (isHat) {
            // Skip through the block (hat with no predicate).
            return;
        } else {
            log.warn(`Could not get implementation for opcode: ${opcode}`);
        }
        thread.requestScriptGlowInFrame = true;
        return;
    }

    // Generate values for arguments (inputs).
    const argValues = {};

    // Add all fields on this block to the argValues. Some known fields may
    // appear by themselves and can be set to argValues quicker by setting them
    // explicitly.
    if (blockCached._fieldKind !== FieldKind.NONE) {
        switch (blockCached._fieldKind) {
        case FieldKind.VARIABLE:
            argValues.VARIABLE = blockCached._fieldVariable;
            break;
        case FieldKind.LIST:
            argValues.LIST = blockCached._fieldList;
            break;
        case FieldKind.BROADCAST_OPTION:
            argValues.BROADCAST_OPTION = blockCached._fieldBroadcastOption;
            break;
        default:
            for (const fieldName in fields) {
                argValues[fieldName] = fields[fieldName].value;
            }
        }
    }

    // Recursively evaluate input blocks.
    for (const inputName in inputs) {
        const input = inputs[inputName];
        const inputBlockId = input.block;
        // Is there no value for this input waiting in the stack frame?
        if (inputBlockId !== null && currentStackFrame.waitingReporter === null) {
            // If there's not, we need to evaluate the block.
            // Push to the stack to evaluate the reporter block.
            thread.pushStack(inputBlockId);
            // Save name of input for `Thread.pushReportedValue`.
            currentStackFrame.waitingReporter = inputName;
            // Actually execute the block.
            execute(sequencer, thread, RECURSIVE);
            if (thread.status === Thread.STATUS_PROMISE_WAIT) {
                // Waiting for the block to resolve, store the current argValues
                // onto a member of the currentStackFrame that can be used once
                // the nested block resolves to rebuild argValues up to this
                // point.
                for (const _inputName in inputs) {
                    // We are waiting on the nested block at inputName so we
                    // don't need to store any more inputs.
                    if (_inputName === inputName) break;
                    if (_inputName === 'BROADCAST_INPUT') {
                        currentStackFrame.reported[_inputName] = argValues.BROADCAST_OPTION.name;
                    } else {
                        currentStackFrame.reported[_inputName] = argValues[_inputName];
                    }
                }
                return;
            }

            // Execution returned immediately,
            // and presumably a value was reported, so pop the stack.
            currentStackFrame.waitingReporter = null;
            thread.popStack();
        }

        let inputValue;
        if (currentStackFrame.waitingReporter === null) {
            inputValue = currentStackFrame.justReported;
            currentStackFrame.justReported = null;
        } else if (currentStackFrame.waitingReporter === inputName) {
            inputValue = currentStackFrame.justReported;
            currentStackFrame.waitingReporter = null;
            currentStackFrame.justReported = null;
            // We have rebuilt argValues with all the stored values in the
            // currentStackFrame from the nested block's promise resolving.
            // Using the reported value from the block we waited on, reset the
            // storage member of currentStackFrame so the next execute call at
            // this level can use it in a clean state.
            currentStackFrame.reported = {};
        } else if (typeof currentStackFrame.reported[inputName] !== 'undefined') {
            inputValue = currentStackFrame.reported[inputName];
        }
        if (inputName === 'BROADCAST_INPUT') {
            const broadcastInput = inputs[inputName];
            // Check if something is plugged into the broadcast block, or
            // if the shadow dropdown menu is being used.
            if (broadcastInput.block === broadcastInput.shadow) {
                // Shadow dropdown menu is being used.
                // Get the appropriate information out of it.
                const shadow = blockContainer.getBlock(broadcastInput.shadow);
                const broadcastField = shadow.fields.BROADCAST_OPTION;
                argValues.BROADCAST_OPTION = {
                    id: broadcastField.id,
                    name: broadcastField.value
                };
            } else {
                // Something is plugged into the broadcast input.
                // Cast it to a string. We don't need an id here.
                argValues.BROADCAST_OPTION = {
                    name: cast.toString(inputValue)
                };
            }
        } else {
            argValues[inputName] = inputValue;
        }
    }

    // Add any mutation to args (e.g., for procedures).
    argValues.mutation = mutation;

    let primitiveReportedValue = null;
    blockUtility.sequencer = sequencer;
    blockUtility.thread = thread;
    if (runtime.profiler !== null) {
        if (blockFunctionProfilerId === -1) {
            blockFunctionProfilerId = runtime.profiler.idByName(blockFunctionProfilerFrame);
        }
        // The method commented below has its code inlined underneath to reduce
        // the bias recorded for the profiler's calls in this time sensitive
        // execute function.
        //
        // runtime.profiler.start(blockFunctionProfilerId, opcode);
        runtime.profiler.records.push(
            runtime.profiler.START, blockFunctionProfilerId, opcode, performance.now());
    }
    primitiveReportedValue = blockFunction(argValues, blockUtility);
    if (runtime.profiler !== null) {
        // runtime.profiler.stop(blockFunctionProfilerId);
        runtime.profiler.records.push(runtime.profiler.STOP, performance.now());
    }

    if (recursiveCall !== RECURSIVE && typeof primitiveReportedValue === 'undefined') {
        // No value reported - potentially a command block.
        // Edge-activated hats don't request a glow; all commands do.
        thread.requestScriptGlowInFrame = true;
    }

    // If it's a promise, wait until promise resolves.
    if (isPromise(primitiveReportedValue)) {
        if (thread.status === Thread.STATUS_RUNNING) {
            // Primitive returned a promise; automatically yield thread.
            thread.status = Thread.STATUS_PROMISE_WAIT;
        }
        // Promise handlers
        primitiveReportedValue.then(resolvedValue => {
            handleReport(resolvedValue, sequencer, thread, currentBlockId, opcode, isHat);
            if (typeof resolvedValue === 'undefined') {
                let stackFrame;
                let nextBlockId;
                do {
                    // In the case that the promise is the last block in the current thread stack
                    // We need to pop out repeatedly until we find the next block.
                    const popped = thread.popStack();
                    if (popped === null) {
                        return;
                    }
                    nextBlockId = thread.target.blocks.getNextBlock(popped);
                    if (nextBlockId !== null) {
                        // A next block exists so break out this loop
                        break;
                    }
                    // Investigate the next block and if not in a loop,
                    // then repeat and pop the next item off the stack frame
                    stackFrame = thread.peekStackFrame();
                } while (stackFrame !== null && !stackFrame.isLoop);

                thread.pushStack(nextBlockId);
            } else {
                thread.popStack();
            }
        }, rejectionReason => {
            // Promise rejected: the primitive had some error.
            // Log it and proceed.
            log.warn('Primitive rejected promise: ', rejectionReason);
            thread.status = Thread.STATUS_RUNNING;
            thread.popStack();
        });
    } else if (thread.status === Thread.STATUS_RUNNING) {
        if (recursiveCall === RECURSIVE) {
            // In recursive calls (where execute calls execute) handleReport
            // simplifies to just calling thread.pushReportedValue.
            thread.pushReportedValue(primitiveReportedValue);
        } else {
            handleReport(primitiveReportedValue, sequencer, thread, currentBlockId, opcode, isHat);
        }
    }
};

module.exports = execute;
