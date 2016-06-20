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
            // Push to the stack to evaluate this input.
            thread.pushStack(inputBlockId);
            if (DEBUG_BLOCK_CALLS) {
                console.time('Reporter evaluation');
            }
            runtime.glowBlock(inputBlockId, true);
            // Save name of input for `Thread.pushReportedValue`.
            currentStackFrame.waitingReporter = inputName;
            execute(sequencer, thread);
            if (thread.status === Thread.STATUS_YIELD) {
                // Reporter yielded; don't pop stack and wait for it to unyield.
                // The value will be populated once the reporter unyields,
                // and passed up to the currentStackFrame on next execution.
                return;
            } else {
                // Reporter finished right away; pop the stack.
                runtime.glowBlock(inputBlockId, false);
                thread.popStack();
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
    var primitiveReturnValue = null;
    primitiveReturnValue = blockFunction(argValues, {
        yield: thread.yield.bind(thread),
        done: function() {
            sequencer.proceedThread(thread);
        },
        report: function(reportedValue) {
            if (DEBUG_BLOCK_CALLS) {
                console.log('Reported: ', reportedValue);
                console.timeEnd('Yielding reporter evaluation');
            }
            thread.pushReportedValue(reportedValue);
            sequencer.proceedThread(thread);
        },
        timeout: thread.addTimeout.bind(thread),
        stackFrame: currentStackFrame.executionContext,
        startSubstack: function (substackNum) {
            sequencer.stepToSubstack(thread, substackNum);
        }
    });
    if (thread.status === Thread.STATUS_RUNNING) {
        if (DEBUG_BLOCK_CALLS) {
            console.log('reporting value: ', primitiveReturnValue);
        }
        thread.pushReportedValue(primitiveReturnValue);
    }
    if (DEBUG_BLOCK_CALLS) {
        console.log('ending stack frame: ', currentStackFrame);
        console.groupEnd();
    }
};

module.exports = execute;
