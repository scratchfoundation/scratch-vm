var YieldTimers = require('../util/yieldtimers.js');

/**
 * If set, block calls, args, and return values will be logged to the console.
 * @const {boolean}
 */
var DEBUG_BLOCK_CALLS = true;

var execute = function (sequencer, thread, blockId) {
    var runtime = sequencer.runtime;

    // Save the yield timer ID, in case a primitive makes a new one
    // @todo hack - perhaps patch this to allow more than one timer per
    // primitive, for example...
    var oldYieldTimerId = YieldTimers.timerId;

    var opcode = runtime.blocks.getOpcode(blockId);

    // Push the current block to the stack
    thread.pushStack(blockId);
    var currentStackFrame = thread.getLastStackFrame();

    // Generate values for arguments (inputs).
    var argValues = {};

    // Add all fields on this block to the argValues.
    var fields = runtime.blocks.getFields(blockId);
    for (var fieldName in fields) {
        argValues[fieldName] = fields[fieldName].value;
    }

    // Recursively evaluate input blocks.
    var inputs = runtime.blocks.getInputs(blockId);
    for (var inputName in inputs) {
        var input = inputs[inputName];
        var inputBlockId = input.block;
        var result = execute(sequencer, thread, inputBlockId);
        argValues[input.name] = result;
    }

    if (!opcode) {
        console.warn('Could not get opcode for block: ' + blockId);
        console.groupEnd();
        return;
    }

    var blockFunction = runtime.getOpcodeFunction(opcode);
    if (!blockFunction) {
        console.warn('Could not get implementation for opcode: ' + opcode);
        console.groupEnd();
        return;
    }

    if (DEBUG_BLOCK_CALLS) {
        console.groupCollapsed('Executing: ' + opcode);
        console.log('with arguments: ', argValues);
        console.log('and stack frame: ', currentStackFrame);
    }
    var primitiveReturnValue = null;
    try {
        // @todo deal with the return value
        primitiveReturnValue = blockFunction(argValues, {
            yield: thread.yield.bind(thread),
            done: function() {
                sequencer.proceedThread(thread, blockId);
            },
            timeout: YieldTimers.timeout,
            stackFrame: currentStackFrame,
            startSubstack: function () {
                sequencer.stepToSubstack(thread, blockId);
            }
        });
    }
    catch(e) {
        console.error(
            'Exception calling block function for opcode: ' +
            opcode + '\n' + e);
    } finally {
        // Update if the thread has set a yield timer ID
        // @todo hack
        if (YieldTimers.timerId > oldYieldTimerId) {
            thread.yieldTimerId = YieldTimers.timerId;
        }
        if (DEBUG_BLOCK_CALLS) {
            console.log('ending stack frame: ', currentStackFrame);
            console.log('returned: ', primitiveReturnValue);
            console.groupEnd();
        }
        // Pop the stack and stack frame
        thread.popStack();
        return primitiveReturnValue;
    }
};

module.exports = execute;
