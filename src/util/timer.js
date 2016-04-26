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

Timer.prototype.stop = function () {
    return this.startTime - this.time();
};

module.exports = Timer;
