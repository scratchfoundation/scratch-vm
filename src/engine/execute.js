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
    var target = runtime.targetForThread(thread);

    // Current block to execute is the one on the top of the stack.
    var currentBlockId = thread.peekStack();
    var currentStackFrame = thread.peekStackFrame();

    // Query info about the block.
    var opcode = target.blocks.getOpcode(currentBlockId);
    var blockFunction = runtime.getOpcodeFunction(opcode);
    var isHat = runtime.getIsHat(opcode);
    var fields = target.blocks.getFields(currentBlockId);
    var inputs = target.blocks.getInputs(currentBlockId);

    if (!opcode) {
        console.warn('Could not get opcode for block: ' + currentBlockId);
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
            thread.setStatus(Thread.STATUS_RUNNING);
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
            if (Object.keys(fields).length == 1 &&
                Object.keys(inputs).length == 0) {
                // One field and no inputs - treat as arg.
                for (var fieldKey in fields) { // One iteration.
                    handleReport(fields[fieldKey].value);
                }
            } else {
                console.warn('Could not get implementation for opcode: ' +
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
        if (typeof currentStackFrame.reported[inputName] === 'undefined') {
            // If there's not, we need to evaluate the block.
            var reporterYielded = (
                sequencer.stepToReporter(thread, inputBlockId, inputName)
            );
            // If the reporter yielded, return immediately;
            // it needs time to finish and report its value.
            if (reporterYielded) {
                return;
            }
        }
        argValues[inputName] = currentStackFrame.reported[inputName];
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
        yield: function() {
            thread.setStatus(Thread.STATUS_YIELD);
        },
        yieldFrame: function() {
            thread.setStatus(Thread.STATUS_YIELD_FRAME);
        },
        done: function() {
            thread.setStatus(Thread.STATUS_RUNNING);
            sequencer.proceedThread(thread);
        },
        startBranch: function (branchNum) {
            sequencer.stepToBranch(thread, branchNum);
        },
        startHats: function(requestedHat, opt_matchFields, opt_target) {
            return (
                runtime.startHats(requestedHat, opt_matchFields, opt_target)
            );
        },
        ioQuery: function (device, func, args) {
            // Find the I/O device and execute the query/function call.
            if (runtime.ioDevices[device] && runtime.ioDevices[device][func]) {
                var devObject = runtime.ioDevices[device];
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
            thread.setStatus(Thread.STATUS_YIELD);
        }
        // Promise handlers
        primitiveReportedValue.then(function(resolvedValue) {
            handleReport(resolvedValue);
            sequencer.proceedThread(thread);
        }, function(rejectionReason) {
            // Promise rejected: the primitive had some error.
            // Log it and proceed.
            console.warn('Primitive rejected promise: ', rejectionReason);
            thread.setStatus(Thread.STATUS_RUNNING);
            sequencer.proceedThread(thread);
        });
    } else if (thread.status === Thread.STATUS_RUNNING) {
        handleReport(primitiveReportedValue);
    }
};

module.exports = execute;
