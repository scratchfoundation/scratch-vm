var YieldTimers = require('../util/yieldtimers.js');

/**
 * If set, block calls, args, and return values will be logged to the console.
 * @const {boolean}
 */
var DEBUG_BLOCK_CALLS = true;

var execute = function (sequencer, thread) {
    var runtime = sequencer.runtime;

    // Current block to execute is the one on the top of the stack.
    var currentBlockId = thread.peekStack();
    var currentStackFrame = thread.peekStackFrame();

    // Save the yield timer ID, in case a primitive makes a new one
    // @todo hack - perhaps patch this to allow more than one timer per
    // primitive, for example...
    var oldYieldTimerId = YieldTimers.timerId;

    var opcode = runtime.blocks.getOpcode(currentBlockId);

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
        // Push to the stack to evaluate this input.
        thread.pushStack(inputBlockId);
        var result = execute(sequencer, thread);
        thread.popStack();
        argValues[input.name] = result;
    }

    if (!opcode) {
        console.warn('Could not get opcode for block: ' + currentBlockId);
        return;
    }

    var blockFunction = runtime.getOpcodeFunction(opcode);
    if (!blockFunction) {
        console.warn('Could not get implementation for opcode: ' + opcode);
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
                sequencer.proceedThread(thread);
            },
            timeout: YieldTimers.timeout,
            stackFrame: currentStackFrame,
            startSubstack: function (substackNum) {
                sequencer.stepToSubstack(thread, substackNum);
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
        return primitiveReturnValue;
    }
};

module.exports = execute;
