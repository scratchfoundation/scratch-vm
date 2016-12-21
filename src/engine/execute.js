var log = require('../util/log');
var Thread = require('./thread');

/**
 * Utility function to determine if a value is a Promise.
 * @param {*} value Value to check for a Promise.
 * @return {Boolean} True if the value appears to be a Promise.
 */
var isPromise = function (value) {
    return value && value.then && typeof value.then === 'function';
};

/**
 * Execute a block.
 * @param {!Sequencer} sequencer Which sequencer is executing.
 * @param {!Thread} thread Thread which to read and execute.
 */
var execute = function (sequencer, thread) {
    var runtime = sequencer.runtime;
    var target = thread.target;

    // Current block to execute is the one on the top of the stack.
    var currentBlockId = thread.peekStack();
    var currentStackFrame = thread.peekStackFrame();

    // Check where the block lives: target blocks or flyout blocks.
    var targetHasBlock = (
        typeof target.blocks.getBlock(currentBlockId) !== 'undefined'
    );
    var flyoutHasBlock = (
        typeof runtime.flyoutBlocks.getBlock(currentBlockId) !== 'undefined'
    );

    // Stop if block or target no longer exists.
    if (!target || (!targetHasBlock && !flyoutHasBlock)) {
        // No block found: stop the thread; script no longer exists.
        sequencer.retireThread(thread);
        return;
    }

    // Query info about the block.
    var blockContainer = null;
    if (targetHasBlock) {
        blockContainer = target.blocks;
    } else {
        blockContainer = runtime.flyoutBlocks;
    }
    var opcode = blockContainer.getOpcode(currentBlockId);
    var fields = blockContainer.getFields(currentBlockId);
    var inputs = blockContainer.getInputs(currentBlockId);
    var blockFunction = runtime.getOpcodeFunction(opcode);
    var isHat = runtime.getIsHat(opcode);


    if (!opcode) {
        log.warn('Could not get opcode for block: ' + currentBlockId);
        return;
    }

    /**
     * Handle any reported value from the primitive, either directly returned
     * or after a promise resolves.
     * @param {*} resolvedValue Value eventually returned from the primitive.
     */
    var handleReport = function (resolvedValue) {
        thread.pushReportedValue(resolvedValue);
        if (isHat) {
            // Hat predicate was evaluated.
            if (runtime.getIsEdgeActivatedHat(opcode)) {
                // If this is an edge-activated hat, only proceed if
                // the value is true and used to be false.
                var oldEdgeValue = runtime.updateEdgeActivatedValue(
                    currentBlockId,
                    resolvedValue
                );
                var edgeWasActivated = !oldEdgeValue && resolvedValue;
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
                runtime.visualReport(currentBlockId, resolvedValue);
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
    if (!blockFunction) {
        if (isHat) {
            // Skip through the block (hat with no predicate).
            return;
        } else {
            if (Object.keys(fields).length === 1 &&
                Object.keys(inputs).length === 0) {
                // One field and no inputs - treat as arg.
                for (var fieldKey in fields) { // One iteration.
                    handleReport(fields[fieldKey].value);
                }
            } else {
                log.warn('Could not get implementation for opcode: ' +
                    opcode);
            }
            thread.requestScriptGlowInFrame = true;
            return;
        }
    }

    // Generate values for arguments (inputs).
    var argValues = {};

    // Add all fields on this block to the argValues.
    for (var fieldName in fields) {
        argValues[fieldName] = fields[fieldName].value;
    }

    // Recursively evaluate input blocks.
    for (var inputName in inputs) {
        var input = inputs[inputName];
        var inputBlockId = input.block;
        // Is there no value for this input waiting in the stack frame?
        if (typeof currentStackFrame.reported[inputName] === 'undefined' &&
            inputBlockId) {
            // If there's not, we need to evaluate the block.
            // Push to the stack to evaluate the reporter block.
            thread.pushStack(inputBlockId);
            // Save name of input for `Thread.pushReportedValue`.
            currentStackFrame.waitingReporter = inputName;
            // Actually execute the block.
            execute(sequencer, thread);
            if (thread.status === Thread.STATUS_PROMISE_WAIT) {
                return;
            } else {
                // Execution returned immediately,
                // and presumably a value was reported, so pop the stack.
                currentStackFrame.waitingReporter = null;
                thread.popStack();
            }
        }
        argValues[inputName] = currentStackFrame.reported[inputName];
    }

    // Add any mutation to args (e.g., for procedures).
    var mutation = blockContainer.getMutation(currentBlockId);
    if (mutation) {
        argValues.mutation = mutation;
    }

    // If we've gotten this far, all of the input blocks are evaluated,
    // and `argValues` is fully populated. So, execute the block primitive.
    // First, clear `currentStackFrame.reported`, so any subsequent execution
    // (e.g., on return from a branch) gets fresh inputs.
    currentStackFrame.reported = {};

    var primitiveReportedValue = null;
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
        stopThread: function () {
            sequencer.retireThread(thread);
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
                var devObject = runtime.ioDevices[device];
                // @todo Figure out why eslint complains about no-useless-call
                // no-useless-call can't tell if the call is useless for dynamic
                // expressions... or something. Not exactly sure why it
                // complains here.
                // eslint-disable-next-line no-useless-call
                return devObject[func].call(devObject, args);
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
        primitiveReportedValue.then(function (resolvedValue) {
            handleReport(resolvedValue);
            if (typeof resolvedValue === 'undefined') {
                var popped = thread.popStack();
                var nextBlockId = thread.target.blocks.getNextBlock(popped);
                thread.pushStack(nextBlockId);
            } else {
                thread.popStack();
            }
        }, function (rejectionReason) {
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
