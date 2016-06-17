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
 * @return {?Any} Reported value, if available immediately.
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
        // Is there a value for this input waiting in the stack frame?
        if (!currentStackFrame.reported[inputName]) {
            // Otherwise, we need to evaluate the block.
            // Push to the stack to evaluate this input.
            thread.pushStack(inputBlockId);
            if (DEBUG_BLOCK_CALLS) {
                console.time('Yielding reporter evaluation');
            }
            runtime.glowBlock(inputBlockId, true);
            var result = execute(sequencer, thread);
            // Did the reporter yield?
            currentStackFrame.waitingReporter = inputName;
            if (thread.status === Thread.STATUS_YIELD) {
                // Reporter yielded; don't pop stack and wait for it to unyield.
                // The value will be populated once the reporter unyields,
                // and passed up to the currentStackFrame on next execution.
                // Save name of this input to be filled by child `util.report`.
                return;
            }
            runtime.glowBlock(inputBlockId, false);
            thread.pushReportedValue(result);
            argValues[inputName] = result;
            thread.popStack();
        }
        argValues[inputName] = currentStackFrame.reported[inputName];
    }

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
    if (DEBUG_BLOCK_CALLS) {
        console.log('ending stack frame: ', currentStackFrame);
        console.log('returned immediately: ', primitiveReturnValue);
        console.groupEnd();
    }
    return primitiveReturnValue;
};

module.exports = execute;
