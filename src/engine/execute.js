var Thread = require('./thread');

/**
 * If set, block calls, args, and return values will be logged to the console.
 * @const {boolean}
 */
var DEBUG_BLOCK_CALLS = true;

/**
 * Execute a block.
 * @param {!Sequencer} sequencer Which sequencer is executing.
 * @param {!Thread} thread Thread which to read and execute.
 */
var execute = function (sequencer, thread) {
    var runtime = sequencer.runtime;

    // Current block to execute is the one on the top of the stack.
    var currentBlockId = thread.peekStack();
    var currentStackFrame = thread.peekStackFrame();

    var opcode = runtime.blocks.getOpcode(currentBlockId);

    if (!opcode) {
        console.warn('Could not get opcode for block: ' + currentBlockId);
        return;
    }

    var blockFunction = runtime.getOpcodeFunction(opcode);
    if (!blockFunction) {
        console.warn('Could not get implementation for opcode: ' + opcode);
        return;
    }

    // Generate values for arguments (inputs).
    var argValues = {};

    // Add all fields on this block to the argValues.
    var fields = runtime.blocks.getFields(currentBlockId);
    for (var fieldName in fields) {
        argValues[fieldName] = fields[fieldName].value;
    }

    // Recursively evaluate input blocks.
    var inputs = runtime.blocks.getInputs(currentBlockId);
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
    // (e.g., on return from a substack) gets fresh inputs.
    currentStackFrame.reported = {};

    if (DEBUG_BLOCK_CALLS) {
        console.groupCollapsed('Executing: ' + opcode);
        console.log('with arguments: ', argValues);
        console.log('and stack frame: ', currentStackFrame);
    }
    var primitiveReportedValue = null;
    primitiveReportedValue = blockFunction(argValues, {
        yield: thread.yield.bind(thread),
        done: function() {
            sequencer.proceedThread(thread);
        },
        stackFrame: currentStackFrame.executionContext,
        startSubstack: function (substackNum) {
            sequencer.stepToSubstack(thread, substackNum);
        }
    });

    // Deal with any reported value.
    // If it's a promise, wait until promise resolves.
    var isPromise = (
        primitiveReportedValue &&
        primitiveReportedValue.then &&
        typeof primitiveReportedValue.then === 'function'
    );
    if (isPromise) {
        if (thread.status === Thread.STATUS_RUNNING) {
            // Primitive returned a promise; automatically yield thread.
            thread.status = Thread.STATUS_YIELD;
        }
        // Promise handlers
        primitiveReportedValue.then(function(resolvedValue) {
            // Promise resolved: the primitive reported a value.
            if (DEBUG_BLOCK_CALLS) {
                console.log('reporting value: ', resolvedValue);
            }
            thread.pushReportedValue(resolvedValue);
            sequencer.proceedThread(thread);
        }, function(rejectionReason) {
            // Promise rejected: the primitive had some error.
            // Log it and proceed.
            if (DEBUG_BLOCK_CALLS) {
                console.warn('primitive rejected promise: ', rejectionReason);
            }
            sequencer.proceedThread(thread);
        });
    } else if (thread.status === Thread.STATUS_RUNNING) {
        if (DEBUG_BLOCK_CALLS) {
            console.log('reporting value: ', primitiveReportedValue);
        }
        thread.pushReportedValue(primitiveReportedValue);
    }
    if (DEBUG_BLOCK_CALLS) {
        console.log('ending stack frame: ', currentStackFrame);
        console.groupEnd();
    }
};

module.exports = execute;
