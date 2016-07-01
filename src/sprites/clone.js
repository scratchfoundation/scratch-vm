var util = require('util');
var MathUtil = require('../util/math-util');
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

Clone.prototype.visible = true;

Clone.prototype.size = 100;

Clone.prototype.effects = {
    'color': 0,
    'fisheye': 0,
    'whirl': 0,
    'pixelate': 0,
    'mosaic': 0,
    'brightness': 0,
    'ghost': 0
};

Clone.prototype.setXY = function (x, y) {
    this.x = x;
    this.y = y;
    self.renderer.updateDrawableProperties(this.drawableID, {
        position: [this.x, this.y]
    });
};

Clone.prototype.setDirection = function (direction) {
    this.direction = MathUtil.wrapClamp(direction, -179, 180);
    self.renderer.updateDrawableProperties(this.drawableID, {
        direction: this.direction
    });
};

Clone.prototype.setVisible = function (visible) {
    this.visible = visible;
    // @todo: Until visibility is implemented in the renderer, use a ghost.
    if (this.visible) {
        this.setEffect('ghost', 0);
    } else {
        this.setEffect('ghost', 100);
    }
};

Clone.prototype.setSize = function (size) {
    this.size = MathUtil.clamp(size, 5, 535);
    self.renderer.updateDrawableProperties(this.drawableID, {
        scale: this.size
    });
};

Clone.prototype.setEffect = function (effectName, value) {
    this.effects[effectName] = value;
    var props = {};
    props[effectName] = this.effects[effectName];
    self.renderer.updateDrawableProperties(this.drawableID, props);
};

Clone.prototype.clearEffects = function () {
    for (var effectName in this.effects) {
        this.effects[effectName] = 0;
    }
    self.renderer.updateDrawableProperties(this.drawableID, this.effects);
};

module.exports = Clone;
