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
                // Finished with this thread - tell the runtime to clean it up.
                inactiveThreads.push(activeThread);
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
        // Refresh nextBlock in case it has changed during the yield.
        thread.nextBlock = instance.runtime._getNextBlock(currentBlock);
        instance.runtime.glowBlock(currentBlock, false);
    };

    /**
     * A callback for the primitive to set data on the block level.
     * @type {Function}
     */
    var blockDataSetCallback = function (key, value) {
        instance.runtime.setBlockExecutionData(currentBlock, key, value);
    };

    /**
     * A callback for the primitive to get data on the block level.
     * @type {Function}
     */
    var blockDataGetCallback = function (key) {
        return instance.runtime.getBlockExecutionData(currentBlock, key);
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
                    setData: blockDataSetCallback,
                    getData: blockDataGetCallback
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
                if (thread.status === Thread.STATUS_RUNNING) {
                    // Thread executed without yielding - move to done
                    thread.status = Thread.STATUS_DONE;
                    this.runtime.glowBlock(currentBlock, false);
                }
            }
        }
    }

};

module.exports = Sequencer;
