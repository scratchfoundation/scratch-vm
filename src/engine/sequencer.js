var Timer = require('../util/timer');

/**
 * Constructor
 */
function Sequencer (runtime) {
    // Bi-directional binding for runtime
    this.runtime = runtime;

    // State
    this.runningThreads = [];
    this.workTime = 30;
    this.timer = new Timer();
    this.currentTime = 0;
}

Sequencer.prototype.stepAllThreads = function () {

};

Sequencer.prototype.stepThread = function (thread) {

};

Sequencer.prototype.startSubstack = function (thread) {

};

module.exports = Sequencer;
