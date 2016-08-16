var Timer = require('../util/timer');

function Clock () {
    this._projectTimer = new Timer();
    this._projectTimer.start();
}

Clock.prototype.projectTimer = function () {
    return this._projectTimer.timeElapsed() / 1000;
};

Clock.prototype.resetProjectTimer = function () {
    this._projectTimer.start();
};

module.exports = Clock;
