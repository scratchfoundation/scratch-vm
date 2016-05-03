var Timer = require('../util/timer');
var Thread = require('./thread');
var YieldTimers = require('../util/yieldtimers.js');

function Sequencer (runtime) {
    /**
     * A utility timer for timing thread sequencing.
     * @type {!Timer}
     */
    this.timer = new Timer();

    /**
     * Reference to the runtime owning this sequencer.
     * @type {!Runtime}
     */
    this.runtime = runtime;
}

/**
 * The sequencer does as much work as it can within WORK_TIME milliseconds,
 * then yields. This is essentially a rate-limiter for blocks.
 * In Scratch 2.0, this is set to 75% of the target stage frame-rate (30fps).
 * @const {!number}
 */
Sequencer.WORK_TIME = 1000 / 60;

/**
 * Step through all threads in `this.threads`, running them in order.
 * @return {Array.<Thread>} All threads which have finished in this iteration.
 */
Sequencer.prototype.stepThreads = function (threads) {
    // Start counting toward WORK_TIME
    this.timer.start();
    // List of threads which have been killed by this step.
    var inactiveThreads = [];
    // If all of the threads are yielding, we should yield.
    var numYieldingThreads = 0;
    // While there are still threads to run and we are within WORK_TIME,
    // continue executing threads.
    while (threads.length > 0 &&
           threads.length > numYieldingThreads &&
           this.timer.timeElapsed() < Sequencer.WORK_TIME) {
        // New threads at the end of the iteration.
        var newThreads = [];
        // Attempt to run each thread one time
        for (var i = 0; i < threads.length; i++) {
            var activeThread = threads[i];
            if (activeThread.status === Thread.STATUS_RUNNING) {
                // Normal-mode thread: step.
                this.stepThread(activeThread);
            } else if (activeThread.status === Thread.STATUS_YIELD) {
                // Yield-mode thread: check if the time has passed.
                YieldTimers.resolve(activeThread.yieldTimerId);
                numYieldingThreads++;
            } else if (activeThread.status === Thread.STATUS_DONE) {
                // Moved to a done state - finish up
                activeThread.status = Thread.STATUS_RUNNING;
                // @todo Deal with the return value
            }
            if (activeThread.nextBlock === null &&
                activeThread.status === Thread.STATUS_DONE) {
                // First attempt to pop from the stack
                if (activeThread.stack.length > 0
                       && activeThread.nextBlock === null) {
                    activeThread.nextBlock = activeThread.stack.pop();
                    // Don't pop stack frame - we need the data.
                    // A new one won't be created when we execute. 
                }
                if (activeThread.nextBlock === null) {
                    // No more on the stack
                    // Finished with this thread - tell runtime to clean it up.
                    inactiveThreads.push(activeThread);
                }
            } else {
                // Keep this thead in the loop.
                newThreads.push(activeThread);
            }
        }
        // Effectively filters out threads that have stopped.
        threads = newThreads;
    }
    return inactiveThreads;
};

/**
 * Step the requested thread
 * @param {!Thread} thread Thread object to step
 */
Sequencer.prototype.stepThread = function (thread) {
    // Save the yield timer ID, in case a primitive makes a new one
    // @todo hack - perhaps patch this to allow more than one timer per
    // primitive, for example...
    var oldYieldTimerId = YieldTimers.timerId;

    // Save the current block and set the nextBlock.
    // If the primitive would like to do control flow,
    // it can overwrite nextBlock.
    var currentBlock = thread.nextBlock;
    thread.nextBlock = this.runtime._getNextBlock(currentBlock);

    var opcode = this.runtime._getOpcode(currentBlock);

    // Push the current block to the stack
    thread.stack.push(currentBlock);
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
    var instance = this;
    var threadDoneCallback = function () {
        thread.status = Thread.STATUS_DONE;
        // Refresh nextBlock in case it has changed during a yield.
        thread.nextBlock = instance.runtime._getNextBlock(currentBlock);
        instance.runtime.glowBlock(currentBlock, false);
        // Pop the stack and stack frame
        thread.stack.pop();
        thread.stackFrames.pop();
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
        thread.nextBlock = instance.runtime._getSubstack(currentBlock).value;
        instance.runtime.glowBlock(currentBlock, false);
        switchedStack = true;
    };

    // @todo
    var argValues = [];

    if (!opcode) {
        console.warn('Could not get opcode for block: ' + currentBlock);
    }
    else {
        var blockFunction = this.runtime.getOpcodeFunction(opcode);
        if (!blockFunction) {
            console.warn('Could not get implementation for opcode: ' + opcode);
        }
        else {
            try {
                this.runtime.glowBlock(currentBlock, true);
                // @todo deal with the return value
                blockFunction(argValues, {
                    yield: threadYieldCallback,
                    done: threadDoneCallback,
                    timeout: YieldTimers.timeout,
                    stackFrame: currentStackFrame,
                    startSubstack: threadStartSubstack
                });
            }
            catch(e) {
                console.error('Exception calling block function',
                    {opcode: opcode, exception: e});
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
            }
        }
    }

};

module.exports = Sequencer;
