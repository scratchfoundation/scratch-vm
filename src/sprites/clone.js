var util = require('util');
var MathUtil = require('../util/math-util');
var Target = require('../engine/target');

/**
 * Clone (instance) of a sprite.
 * @param {!Blocks} spriteBlocks Reference to the sprite's blocks.
 * @constructor
 */
function Clone(spriteBlocks) {
    Target.call(this, spriteBlocks);
    this.drawableID = null;
    this.initDrawable();
}
util.inherits(Clone, Target);

/**
 * Create a clone's drawable with the renderer.
 */
Clone.prototype.initDrawable = function () {
    var createPromise = self.renderer.createDrawable();
    var instance = this;
    createPromise.then(function (id) {
        instance.drawableID = id;
    });
};

// Clone-level properties.
/**
 * Scratch X coordinate. Currently should range from -240 to 240.
 * @type {!number}
 */
Clone.prototype.x = 0;

/**
 * Scratch Y coordinate. Currently should range from -180 to 180.
 * @type {!number}
 */
Clone.prototype.y = 0;

/**
 * Scratch direction. Currently should range from -179 to 180.
 * @type {!number}
 */
Clone.prototype.direction = 90;

/**
 * Whether the clone is currently visible.
 * @type {!boolean}
 */
Clone.prototype.visible = true;

/**
 * Size of clone as a percent of costume size. Ranges from 5% to 535%.
 * @type {!number}
 */
Clone.prototype.size = 100;

/**
 * Map of current graphic effect values.
 * @type {!Object.<string, number>}
 */
Clone.prototype.effects = {
    'color': 0,
    'fisheye': 0,
    'whirl': 0,
    'pixelate': 0,
    'mosaic': 0,
    'brightness': 0,
    'ghost': 0
};
// End clone-level properties.

/**
 * Set the X and Y coordinates of a clone.
 * @param {!number} x New X coordinate of clone, in Scratch coordinates.
 * @param {!number} y New Y coordinate of clone, in Scratch coordinates.
 */
Clone.prototype.setXY = function (x, y) {
    this.x = x;
    this.y = y;
    self.renderer.updateDrawableProperties(this.drawableID, {
        position: [this.x, this.y]
    });
};

/**
 * Set the direction of a clone.
 * @param {!number} direction New direction of clone.
 */
Clone.prototype.setDirection = function (direction) {
    // Keep direction between -179 and +180.
    this.direction = MathUtil.wrapClamp(direction, -179, 180);
    self.renderer.updateDrawableProperties(this.drawableID, {
        direction: this.direction
    });
};

/**
 * Set a say bubble on this clone.
 * @param {?string} type Type of say bubble: "say", "think", or null.
 * @param {?string} message Message to put in say bubble.
 */
Clone.prototype.setSay = function (type, message) {
    // @todo: Render to stage.
    if (!type || !message) {
        console.log('Clearing say bubble');
        return;
    }
    console.log('Setting say bubble:', type, message);
};

/**
 * Set visibility of the clone; i.e., whether it's shown or hidden.
 * @param {!boolean} visible True if the sprite should be shown.
 */
Clone.prototype.setVisible = function (visible) {
    this.visible = visible;
    self.renderer.updateDrawableProperties(this.drawableID, {
        visible: this.visible
    });
};

/**
 * Set size of the clone, as a percentage of the costume size.
 * @param {!number} size Size of clone, from 5 to 535.
 */
Clone.prototype.setSize = function (size) {
    // Keep size between 5% and 535%.
    this.size = MathUtil.clamp(size, 5, 535);
    self.renderer.updateDrawableProperties(this.drawableID, {
        scale: this.size
    });
};

/**
 * Set a particular graphic effect on this clone.
 * @param {!string} effectName Name of effect (see `Clone.prototype.effects`).
 * @param {!number} value Numerical magnitude of effect.
 */
Clone.prototype.setEffect = function (effectName, value) {
    this.effects[effectName] = value;
    var props = {};
    props[effectName] = this.effects[effectName];
    self.renderer.updateDrawableProperties(this.drawableID, props);
};

/**
 * Clear all graphic effects on this clone.
 */
Clone.prototype.clearEffects = function () {
    for (var effectName in this.effects) {
        this.effects[effectName] = 0;
    }
    self.renderer.updateDrawableProperties(this.drawableID, this.effects);
};

module.exports = Clone;
