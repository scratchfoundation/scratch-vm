var util = require('util');
var MathUtil = require('../util/math-util');
var Target = require('../engine/target');

/**
 * Clone (instance) of a sprite.
 * @param {!Sprite} sprite Reference to the sprite.
 * @constructor
 */
function Clone(sprite) {
    Target.call(this, sprite.blocks);
    /**
     * Reference to the sprite that this is a clone of.
     * @type {!Sprite}
     */
    this.sprite = sprite;
    /**
     * Reference to the global renderer for this VM, if one exists.
     * @type {?RenderWebGLWorker}
     */
    this.renderer = null;
    // If this is not true, there is no renderer (e.g., running in a test env).
    if (typeof self !== 'undefined' && self.renderer) {
        // Pull from `self.renderer`.
        this.renderer = self.renderer;
    }
    /**
     * ID of the drawable for this clone returned by the renderer, if rendered.
     * @type {?Number}
     */
    this.drawableID = null;

    this.initDrawable();
}
util.inherits(Clone, Target);

/**
 * Create a clone's drawable with the this.renderer.
 */
Clone.prototype.initDrawable = function () {
    if (this.renderer) {
        var createPromise = this.renderer.createDrawable();
        var instance = this;
        createPromise.then(function (id) {
            instance.drawableID = id;
            // Once the drawable is created, send our current set of properties.
            instance.updateAllDrawableProperties();
        });
    }
};

// Clone-level properties.
/**
 * Whether this clone represents the Scratch stage.
 * @type {boolean}
 */
Clone.prototype.isStage = false;

/**
 * Scratch X coordinate. Currently should range from -240 to 240.
 * @type {Number}
 */
Clone.prototype.x = 0;

/**
 * Scratch Y coordinate. Currently should range from -180 to 180.
 * @type {number}
 */
Clone.prototype.y = 0;

/**
 * Scratch direction. Currently should range from -179 to 180.
 * @type {number}
 */
Clone.prototype.direction = 90;

/**
 * Whether the clone is currently visible.
 * @type {boolean}
 */
Clone.prototype.visible = true;

/**
 * Size of clone as a percent of costume size. Ranges from 5% to 535%.
 * @type {number}
 */
Clone.prototype.size = 100;

/**
 * Currently selected costume index.
 * @type {number}
 */
Clone.prototype.currentCostume = 0;

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
    if (this.isStage) {
        return;
    }
    this.x = x;
    this.y = y;
    if (this.renderer) {
        this.renderer.updateDrawableProperties(this.drawableID, {
            position: [this.x, this.y]
        });
    }
};

/**
 * Set the direction of a clone.
 * @param {!number} direction New direction of clone.
 */
Clone.prototype.setDirection = function (direction) {
    if (this.isStage) {
        return;
    }
    // Keep direction between -179 and +180.
    this.direction = MathUtil.wrapClamp(direction, -179, 180);
    if (this.renderer) {
        this.renderer.updateDrawableProperties(this.drawableID, {
            direction: this.direction
        });
    }
};

/**
 * Set a say bubble on this clone.
 * @param {?string} type Type of say bubble: "say", "think", or null.
 * @param {?string} message Message to put in say bubble.
 */
Clone.prototype.setSay = function (type, message) {
    if (this.isStage) {
        return;
    }
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
    if (this.isStage) {
        return;
    }
    this.visible = visible;
    if (this.renderer) {
        this.renderer.updateDrawableProperties(this.drawableID, {
            visible: this.visible
        });
    }
};

/**
 * Set size of the clone, as a percentage of the costume size.
 * @param {!number} size Size of clone, from 5 to 535.
 */
Clone.prototype.setSize = function (size) {
    if (this.isStage) {
        return;
    }
    // Keep size between 5% and 535%.
    this.size = MathUtil.clamp(size, 5, 535);
    if (this.renderer) {
        this.renderer.updateDrawableProperties(this.drawableID, {
            scale: [this.size, this.size]
        });
    }
};

/**
 * Set a particular graphic effect on this clone.
 * @param {!string} effectName Name of effect (see `Clone.prototype.effects`).
 * @param {!number} value Numerical magnitude of effect.
 */
Clone.prototype.setEffect = function (effectName, value) {
    this.effects[effectName] = value;
    if (this.renderer) {
        var props = {};
        props[effectName] = this.effects[effectName];
        this.renderer.updateDrawableProperties(this.drawableID, props);
    }
};

/**
 * Clear all graphic effects on this clone.
 */
Clone.prototype.clearEffects = function () {
    for (var effectName in this.effects) {
        this.effects[effectName] = 0;
    }
    if (this.renderer) {
        this.renderer.updateDrawableProperties(this.drawableID, this.effects);
    }
};

/**
 * Set the current costume of this clone.
 * @param {number} index New index of costume.
 */
Clone.prototype.setCostume = function (index) {
    // Keep the costume index within possible values.
    this.currentCostume = MathUtil.wrapClamp(
        index, 0, this.sprite.costumes.length - 1
    );
    if (this.renderer) {
        this.renderer.updateDrawableProperties(this.drawableID, {
            skin: this.sprite.costumes[this.currentCostume].skin
        });
    }
};

/**
 * Get a costume index of this clone, by name of the costume.
 * @param {?string} costumeName Name of a costume.
 * @return {number} Index of the named costume, or -1 if not present.
 */
Clone.prototype.getCostumeIndexByName = function (costumeName) {
    for (var i = 0; i < this.sprite.costumes.length; i++) {
        if (this.sprite.costumes[i].name == costumeName) {
            return i;
        }
    }
    return -1;
};

/**
 * Update all drawable properties for this clone.
 * Use when a batch has changed, e.g., when the drawable is first created.
 */
Clone.prototype.updateAllDrawableProperties = function () {
    if (this.renderer) {
        this.renderer.updateDrawableProperties(this.drawableID, {
            position: [this.x, this.y],
            direction: this.direction,
            scale: [this.size, this.size],
            visible: this.visible,
            skin: this.sprite.costumes[this.currentCostume].skin
        });
    }
};

/**
 * Return the human-readable name for this clone, i.e., the sprite's name.
 * @override
 * @returns {string} Human-readable name for the clone.
 */
Clone.prototype.getName = function () {
    return this.sprite.name;
};

module.exports = Clone;
