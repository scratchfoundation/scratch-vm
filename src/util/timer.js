/**
 * Constructor
 */
function Timer () {
    this.startTime = 0;
}

Timer.prototype.time = function () {
    return Date.now();
};

Timer.prototype.start = function () {
    this.startTime = this.time();
};

Timer.prototype.timeElapsed = function () {
    return this.time() - this.startTime;
};

module.exports = Timer;
