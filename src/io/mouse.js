var MathUtil = require('../util/math-util');

function Mouse () {
    this._x = 0;
    this._y = 0;
    this._isDown = false;
}

Mouse.prototype.postData = function(data) {
    if (data.x) {
        this._x = data.x;
    }
    if (data.y) {
        this._y = data.y;
    }
    if (typeof data.isDown !== 'undefined') {
        this._isDown = data.isDown;
    }
};

Mouse.prototype.getX = function () {
    return MathUtil.clamp(this._x, -240, 240);
};

Mouse.prototype.getY = function () {
    return MathUtil.clamp(-this._y, -180, 180);
};

Mouse.prototype.getIsDown = function () {
    return this._isDown;
};

module.exports = Mouse;
