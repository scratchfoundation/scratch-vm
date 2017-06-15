const log = require('../util/log');
const Thread = require('./thread');
const {Map} = require('immutable');

/**
 * Utility function to determine if a value is a Promise.
 * @param {*} value Value to check for a Promise.
 * @return {boolean} True if the value appears to be a Promise.
 */
const isPromise = function (value) {
    return value && value.then && typeof value.then === 'function';
};

/**
 * Execute a block.
 * @param {!Sequencer} sequencer Which sequencer is executing.
 * @param {!Thread} thread Thread which to read and execute.
 */
const execute = function (sequencer, thread) {
    const runtime = sequencer.runtime;
    const target = thread.target;

    // Stop if block or target no longer exists.
    if (target === null) {
        // No block found: stop the thread; script no longer exists.
        sequencer.retireThread(thread);
        return;
    }

    // Current block to execute is the one on the top of the stack.
    const currentBlockId = thread.peekStack();
    const currentStackFrame = thread.peekStackFrame();

    let blockContainer;
    if (thread.updateMonitor) {
        blockContainer = runtime.monitorBlocks;
    } else {
        blockContainer = target.blocks;
    }
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

    const opcode = blockContainer.getOpcode(block);
    const fields = blockContainer.getFields(block);
    const inputs = blockContainer.getInputs(block);
    const blockFunction = runtime.getOpcodeFunction(opcode);
    const isHat = runtime.getIsHat(opcode);


    if (!opcode) {
        log.warn(`Could not get opcode for block: ${currentBlockId}`);
        return;
    }

    /**
     * Handle any reported value from the primitive, either directly returned
     * or after a promise resolves.
     * @param {*} resolvedValue Value eventually returned from the primitive.
     */
     // @todo move this to callback attached to the thread when we have performance
     // metrics (dd)
    const handleReport = function (resolvedValue) {
        thread.pushReportedValue(resolvedValue);
        if (isHat) {
            // Hat predicate was evaluated.
            if (runtime.getIsEdgeActivatedHat(opcode)) {
                // If this is an edge-activated hat, only proceed if
                // the value is true and used to be false.
                const oldEdgeValue = runtime.updateEdgeActivatedValue(
                    currentBlockId,
                    resolvedValue
                );
                const edgeWasActivated = !oldEdgeValue && resolvedValue;
                if (!edgeWasActivated) {
                    sequencer.retireThread(thread);
                }
            } else {
                // Not an edge-activated hat: retire the thread
                // if predicate was false.
                if (!resolvedValue) {
                    sequencer.retireThread(thread);
                }
            }
        } else {
            // In a non-hat, report the value visually if necessary if
            // at the top of the thread stack.
            if (typeof resolvedValue !== 'undefined' && thread.atStackTop()) {
                if (thread.showVisualReport) {
                    runtime.visualReport(currentBlockId, resolvedValue);
                }
                if (thread.updateMonitor) {
                    runtime.requestUpdateMonitor(Map({
                        id: currentBlockId,
                        value: String(resolvedValue)
                    }));
                }
            }
            // Finished any yields.
            thread.status = Thread.STATUS_RUNNING;
        }
    };

    // Hats and single-field shadows are implemented slightly differently
    // from regular blocks.
    // For hats: if they have an associated block function,
    // it's treated as a predicate; if not, execution will proceed as a no-op.
    // For single-field shadows: If the block has a single field, and no inputs,
    // immediately return the value of the field.
    if (typeof blockFunction === 'undefined') {
        if (isHat) {
            // Skip through the block (hat with no predicate).
            return;
        }
        const keys = Object.keys(fields);
        if (keys.length === 1 && Object.keys(inputs).length === 0) {
            // One field and no inputs - treat as arg.
            handleReport(fields[keys[0]].value);
        } else {
            log.warn(`Could not get implementation for opcode: ${opcode}`);
        }
        thread.requestScriptGlowInFrame = true;
        return;
    }

    // Generate values for arguments (inputs).
    const argValues = {};

    // Add all fields on this block to the argValues.
    for (const fieldName in fields) {
        if (!fields.hasOwnProperty(fieldName)) continue;
        if (fieldName === 'VARIABLE') {
            argValues[fieldName] = fields[fieldName].id;
        } else {
            argValues[fieldName] = fields[fieldName].value;
        }
    }

    // Recursively evaluate input blocks.
    for (const inputName in inputs) {
        if (!inputs.hasOwnProperty(inputName)) continue;
        const input = inputs[inputName];
        const inputBlockId = input.block;
        // Is there no value for this input waiting in the stack frame?
        if (inputBlockId !== null && typeof currentStackFrame.reported[inputName] === 'undefined') {
            // If there's not, we need to evaluate the block.
            // Push to the stack to evaluate the reporter block.
            thread.pushStack(inputBlockId);
            // Save name of input for `Thread.pushReportedValue`.
            currentStackFrame.waitingReporter = inputName;
            // Actually execute the block.
            execute(sequencer, thread);
            if (thread.status === Thread.STATUS_PROMISE_WAIT) {
                return;
            }

            // Execution returned immediately,
            // and presumably a value was reported, so pop the stack.
            currentStackFrame.waitingReporter = null;
            thread.popStack();
        }
        argValues[inputName] = currentStackFrame.reported[inputName];
    }

    // Add any mutation to args (e.g., for procedures).
    const mutation = blockContainer.getMutation(block);
    if (mutation !== null) {
        argValues.mutation = mutation;
    }

    // If we've gotten this far, all of the input blocks are evaluated,
    // and `argValues` is fully populated. So, execute the block primitive.
    // First, clear `currentStackFrame.reported`, so any subsequent execution
    // (e.g., on return from a branch) gets fresh inputs.
    currentStackFrame.reported = {};

    let primitiveReportedValue = null;
    primitiveReportedValue = blockFunction(argValues, {
        stackFrame: currentStackFrame.executionContext,
        target: target,
        yield: function () {
            thread.status = Thread.STATUS_YIELD;
        },
        startBranch: function (branchNum, isLoop) {
            sequencer.stepToBranch(thread, branchNum, isLoop);
        },
        stopAll: function () {
            runtime.stopAll();
        },
        stopOtherTargetThreads: function () {
            runtime.stopForTarget(target, thread);
        },
        stopThisScript: function () {
            thread.stopThisScript();
        },
        startProcedure: function (procedureCode) {
            sequencer.stepToProcedure(thread, procedureCode);
        },
        getProcedureParamNames: function (procedureCode) {
            return blockContainer.getProcedureParamNames(procedureCode);
        },
        pushParam: function (paramName, paramValue) {
            thread.pushParam(paramName, paramValue);
        },
        getParam: function (paramName) {
            return thread.getParam(paramName);
        },
        startHats: function (requestedHat, optMatchFields, optTarget) {
            return (
                runtime.startHats(requestedHat, optMatchFields, optTarget)
            );
        },
        ioQuery: function (device, func, args) {
            // Find the I/O device and execute the query/function call.
            if (runtime.ioDevices[device] && runtime.ioDevices[device][func]) {
                const devObject = runtime.ioDevices[device];
                return devObject[func].apply(devObject, args);
            }
        }
    });

    if (typeof primitiveReportedValue === 'undefined') {
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
            handleReport(resolvedValue);
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
        handleReport(primitiveReportedValue);
    }
};

module.exports = execute;
