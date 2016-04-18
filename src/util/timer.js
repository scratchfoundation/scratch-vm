/**
 * Constructor
 * @todo Swap out Date.now() with microtime module that works in node & browsers
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
