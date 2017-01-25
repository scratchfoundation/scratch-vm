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

    // Stop if block or target no longer exists.
    if (!target) {
        // No block found: stop the thread; script no longer exists.
        sequencer.retireThread(thread);
        return;
    }

    // Current block to execute is the one on the top of the stack.
    var currentBlockId = thread.peekStack();
    var currentStackFrame = thread.peekStackFrame();

    var blockContainer;
    var block = target.blocks.getBlock(currentBlockId);
    if (typeof block !== 'undefined') {
        blockContainer = target.blocks;
    } else {
        block = runtime.flyoutBlocks.getBlock(currentBlockId);
        // Stop if block or target no longer exists.
        if (typeof block == 'undefined') {
            // No block found: stop the thread; script no longer exists.
            sequencer.retireThread(thread);
            return;
        }
        
        blockContainer = runtime.flyoutBlocks;
    }
    
//    var block = blockContainer.getBlock(currentBlockId);
    var opcode = block.opcode; // blockContainer.getOpcode(currentBlockId);
    var fields = block.fields; // blockContainer.getFields(currentBlockId);
    var inputs = blockContainer.getInputs(currentBlockId);
    var blockFunction = runtime.getOpcodeFunction(opcode);
    var isHat = runtime.getIsHat(opcode);


    if (!opcode) {
        log.warn('Could not get opcode for block: ' + currentBlockId);
        return;
    }

	var callThing = new CallThing(sequencer, runtime, thread, blockContainer, currentStackFrame.executionContext, target, opcode, currentBlockId, isHat);

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
                    callThing.handleReport(fields[fieldKey].value);
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

    var primitiveReportedValue;

    primitiveReportedValue = blockFunction(argValues, callThing);

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
            callThing.handleReport(resolvedValue);
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
        callThing.handleReport(primitiveReportedValue);
    }
};

/**
 * Object constructor to avoid recreating entire function call util array each time 
 * @param sequencer
 * @param runtime
 * @param thread
 * @param blockContainer
 * @param stackFrame
 * @param target
 * @param opcode
 * @param currentBlockId
 * @param isHat
 * @constructor
 */
var CallThing = function (sequencer, runtime, thread, blockContainer, stackFrame, target, opcode, currentBlockId, isHat) {
    this.sequencer = sequencer;
    this.runtime = runtime;
    this.thread = thread;
    this.blockContainer = blockContainer;
    this.stackFrame = stackFrame;
    this.target = target;
    this.opcode = opcode;
    this.currentBlockId = currentBlockId;
    this.isHat = isHat;
};

CallThing.prototype.yield = function () {
    this.thread.status = Thread.STATUS_YIELD;
};
CallThing.prototype.startBranch = function (branchNum, isLoop) {
    this.sequencer.stepToBranch(this.thread, branchNum, isLoop);
};
CallThing.prototype.stopAll = function () {
    this.runtime.stopAll();
};
CallThing.prototype.stopOtherTargetThreads = function () {
    this.runtime.stopForTarget(this.target, this.thread);
};
CallThing.prototype.stopThread = function () {
    this.sequencer.retireThread(this.thread);
};
CallThing.prototype.startProcedure = function (procedureCode) {
    this.sequencer.stepToProcedure(this.thread, procedureCode);
};
CallThing.prototype.getProcedureParamNames = function (procedureCode) {
    return this.blockContainer.getProcedureParamNames(procedureCode);
};
CallThing.prototype.pushParam = function (paramName, paramValue) {
    this.thread.pushParam(paramName, paramValue);
};
CallThing.prototype.getParam = function (paramName) {
    return this.thread.getParam(paramName);
};
CallThing.prototype.startHats = function (requestedHat, optMatchFields, optTarget) {
    return (
        this.runtime.startHats(requestedHat, optMatchFields, optTarget)
    );
};
CallThing.prototype.ioQuery = function (device, func, args) {
    // Find the I/O device and execute the query/function call.
    if (this.runtime.ioDevices[device] && this.runtime.ioDevices[device][func]) {
        var devObject = this.runtime.ioDevices[device];
        // @todo Figure out why eslint complains about no-useless-call
        // no-useless-call can't tell if the call is useless for dynamic
        // expressions... or something. Not exactly sure why it
        // complains here.
        // eslint-disable-next-line no-useless-call
        return devObject[func].call(devObject, args);
    }
};

/**
 * Handle any reported value from the primitive, either directly returned
 * or after a promise resolves.
 * @param {*} resolvedValue Value eventually returned from the primitive.
 */
CallThing.prototype.handleReport = function (resolvedValue) {

    this.thread.pushReportedValue(resolvedValue);
    if (this.isHat) {
        // Hat predicate was evaluated.
        if (this.runtime.getIsEdgeActivatedHat(this.opcode)) {
            // If this is an edge-activated hat, only proceed if
            // the value is true and used to be false.
            var oldEdgeValue = this.runtime.updateEdgeActivatedValue(
                this.currentBlockId,
                resolvedValue
            );
            var edgeWasActivated = !oldEdgeValue && resolvedValue;
            if (!edgeWasActivated) {
                this.sequencer.retireThread(this.thread);
            }
        } else {
            // Not an edge-activated hat: retire the thread
            // if predicate was false.
            if (!resolvedValue) {
                this.sequencer.retireThread(this.thread);
            }
        }
    } else {
        // In a non-hat, report the value visually if necessary if
        // at the top of the thread stack.
        if (typeof resolvedValue !== 'undefined' && this.thread.atStackTop()) {
            this.runtime.visualReport(this.currentBlockId, resolvedValue);
        }
        // Finished any yields.
        this.thread.status = Thread.STATUS_RUNNING;
    }
};

module.exports = execute;
