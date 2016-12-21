var Timer = require('../util/timer');

var Clock = function (runtime) {
    this._projectTimer = new Timer();
    this._projectTimer.start();
    this._pausedTime = null;
    this._paused = false;
    /**
     * Reference to the owning Runtime.
     * @type{!Runtime}
     */
    this.runtime = runtime;
};

Clock.prototype.projectTimer = function () {
    if (this._paused) {
        return this._pausedTime / 1000;
    }
    return this._projectTimer.timeElapsed() / 1000;
};

Clock.prototype.pause = function () {
    this._paused = true;
    this._pausedTime = this._projectTimer.timeElapsed();
};

Clock.prototype.resume = function () {
    this._paused = false;
    var dt = this._projectTimer.timeElapsed() - this._pausedTime;
    this._projectTimer.startTime += dt;
};

Clock.prototype.resetProjectTimer = function () {
    this._projectTimer.start();
};

module.exports = Clock;
