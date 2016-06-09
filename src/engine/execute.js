var Thread = require('./thread');
var YieldTimers = require('../util/yieldtimers.js');

var execute = function (sequencer, thread, blockId, isInput) {
    var runtime = sequencer.runtime;

    // Save the yield timer ID, in case a primitive makes a new one
    // @todo hack - perhaps patch this to allow more than one timer per
    // primitive, for example...
    var oldYieldTimerId = YieldTimers.timerId;

    var opcode = runtime.blocks.getOpcode(blockId);

    // Push the current block to the stack
    thread.stack.push(blockId);
    // Push an empty stack frame, if we need one.
    // Might not, if we just popped the stack.
    if (thread.stack.length > thread.stackFrames.length) {
        thread.stackFrames.push({});
    }
    var currentStackFrame = thread.stackFrames[thread.stackFrames.length - 1];

    /**
     * A callback for the primitive to indicate its thread should yield.
     * @type {Function}
     */
    var threadYieldCallback = function () {
        thread.status = Thread.STATUS_YIELD;
    };

    /**
     * A callback for the primitive to indicate its thread is finished
     * @type {Function}
     */
    var threadDoneCallback = function () {
        // Pop the stack and stack frame
        thread.stack.pop();
        thread.stackFrames.pop();
        // If we're not executing an input sub-block,
        // mark the thread as done and proceed to the next block.
        if (!isInput) {
            thread.status = Thread.STATUS_DONE;
            // Refresh nextBlock in case it has changed during a yield.
            thread.nextBlock = runtime.blocks.getNextBlock(blockId);
        }
        // Stop showing run feedback in the editor.
        runtime.glowBlock(blockId, false);
    };

    /**
     * A callback for the primitive to start hats.
     * @todo very hacked...
     * Provide a callback that is passed in a block and returns true
     * if it is a hat that should be triggered.
     * @param {Function} callback Provided callback.
     */
    var startHats = function(callback) {
        var stacks = runtime.blocks.getStacks();
        for (var i = 0; i < stacks.length; i++) {
            var stack = stacks[i];
            var stackBlock = runtime.blocks.getBlock(stack);
            var result = callback(stackBlock);
            if (result) {
                // Check if the stack is already running
                var stackRunning = false;

                for (var j = 0; j < runtime.threads.length; j++) {
                    if (runtime.threads[j].topBlock == stack) {
                        stackRunning = true;
                        break;
                    }
                }
                if (!stackRunning) {
                    runtime._pushThread(stack);
                }
            }
        }
    };

    /**
     * Record whether we have switched stack,
     * to avoid proceeding the thread automatically.
     * @type {boolean}
     */
    var switchedStack = false;
    /**
     * A callback for a primitive to start a substack.
     * @type {Function}
     */
    var threadStartSubstack = function () {
        // Set nextBlock to the start of the substack
        var substack = runtime.blocks.getSubstack(blockId);
        if (substack && substack.value) {
            thread.nextBlock = substack.value;
        } else {
            thread.nextBlock = null;
        }
        switchedStack = true;
    };

    // Generate values for arguments (inputs).
    var argValues = {};

    // Add all fields on this block to the argValues.
    var fields = runtime.blocks.getFields(blockId);
    for (var fieldName in fields) {
        argValues[fieldName] = fields[fieldName];
    }

    // Recursively evaluate input blocks.
    var inputs = runtime.blocks.getInputs(blockId);
    for (var inputName in inputs) {
        var input = inputs[inputName];
        var inputBlockId = input.block;
        var result = execute(sequencer, thread, inputBlockId, true);
        argValues[input.name] = result;
    }

    // Start showing run feedback in the editor.
    runtime.glowBlock(blockId, true);

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

    if (sequencer.DEBUG_BLOCK_CALLS) {
        console.groupCollapsed('Executing: ' + opcode);
        console.log('with arguments: ', argValues);
        console.log('and stack frame: ', currentStackFrame);
    }
    var blockFunctionReturnValue = null;
    try {
        // @todo deal with the return value
        blockFunctionReturnValue = blockFunction(argValues, {
            yield: threadYieldCallback,
            done: threadDoneCallback,
            timeout: YieldTimers.timeout,
            stackFrame: currentStackFrame,
            startSubstack: threadStartSubstack,
            startHats: startHats
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
        if (thread.status === Thread.STATUS_RUNNING && !switchedStack) {
            // Thread executed without yielding - move to done
            threadDoneCallback();
        }
        if (sequencer.DEBUG_BLOCK_CALLS) {
            console.log('ending stack frame: ', currentStackFrame);
            console.log('returned: ', blockFunctionReturnValue);
            console.groupEnd();
        }
    }
};

module.exports = execute;
