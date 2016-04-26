var Timer = require('../util/Timer');

function Sequencer () {
    /**
     * A list of threads that are currently running in the VM.
     * Threads are added when execution starts and pruned when execution ends.
     * @type {Array.<Thread>}
     */
    this.threads = [];

    /**
     * A utility timer for timing thread sequencing.
     * @type {!Timer}
     */
    this.timer = new Timer();
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
 */
Sequencer.prototype.stepThreads = function () {
    // Start counting toward WORK_TIME
    this.timer.start();
    // While there are still threads to run and we are within WORK_TIME,
    // continue executing threads.
    while (this.threads.length > 0 &&
           this.timer.timeElapsed() < Sequencer.WORK_TIME) {
        // New threads at the end of the iteration.
        var newThreads = [];
        // Attempt to run each thread one time
        for (var i = 0; i < this.threads.length; i++) {
            var activeThread = this.threads[i];
            this.stepThread(activeThread);
            if (activeThread.nextBlock !== null) {
                newThreads.push(activeThread);
            }
        }
        // Effectively filters out threads that have stopped.
        this.threads = newThreads;
    }
};

/**
 * Step the requested thread
 * @param {!Thread} thread Thread object to step
 */
Sequencer.protoype.stepThread = function (thread) {
    // @todo
};

module.exports = Sequencer;
