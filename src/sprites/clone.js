var util = require('util');
var Target = require('../engine/target');

function Clone(spriteBlocks) {
    Target.call(this, spriteBlocks);
    this.drawableID = null;
    this.initDrawable();
}
util.inherits(Clone, Target);

Clone.prototype.initDrawable = function () {
    var createPromise = self.renderer.createDrawable();
    var instance = this;
    createPromise.then(function (id) {
        instance.drawableID = id;
    });
};

// Clone-level properties
Clone.prototype.x = 0;

Clone.prototype.y = 0;

Clone.prototype.direction = 90;

Clone.prototype.setXY = function (x, y) {
    this.x = x;
    this.y = y;
    self.renderer.updateDrawableProperties(this.drawableID, {
        position: [this.x, this.y]
    });
};

Clone.prototype.setDirection = function (direction) {
    this.direction = direction;
    self.renderer.updateDrawableProperties(this.drawableID, {
        direction: this.direction
    });
};

module.exports = Clone;
