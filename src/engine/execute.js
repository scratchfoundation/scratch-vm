var Thread = require('./thread');

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
    var fields = target.blocks.getFields(currentBlockId);
    for (var fieldName in fields) {
        argValues[fieldName] = fields[fieldName].value;
    }

    // Recursively evaluate input blocks.
    var inputs = target.blocks.getInputs(currentBlockId);
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

    var primitiveReportedValue = null;
    primitiveReportedValue = blockFunction(argValues, {
        yield: thread.yield.bind(thread),
        done: function() {
            sequencer.proceedThread(thread);
        },
        stackFrame: currentStackFrame.executionContext,
        startSubstack: function (substackNum) {
            sequencer.stepToSubstack(thread, substackNum);
        },
        target: target
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
            thread.pushReportedValue(resolvedValue);
            sequencer.proceedThread(thread);
        }, function(rejectionReason) {
            // Promise rejected: the primitive had some error.
            // Log it and proceed.
            console.warn('Primitive rejected promise: ', rejectionReason);
            sequencer.proceedThread(thread);
        });
    } else if (thread.status === Thread.STATUS_RUNNING) {
        thread.pushReportedValue(primitiveReportedValue);
    }
};

module.exports = execute;
