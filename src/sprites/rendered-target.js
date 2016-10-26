var util = require('util');

var log = require('../util/log');
var MathUtil = require('../util/math-util');
var Target = require('../engine/target');

/**
 * Rendered target: instance of a sprite (clone), or the stage.
 * @param {!Sprite} sprite Reference to the parent sprite.
 * @param {Runtime} runtime Reference to the runtime.
 * @constructor
 */
var RenderedTarget = function (sprite, runtime) {
    Target.call(this, sprite.blocks);
    this.runtime = runtime;
    /**
     * Reference to the sprite that this is a render of.
     * @type {!Sprite}
     */
    this.sprite = sprite;
    /**
     * Reference to the global renderer for this VM, if one exists.
     * @type {?RenderWebGLWorker}
     */
    this.renderer = null;
    if (this.runtime) {
        this.renderer = this.runtime.renderer;
    }
    /**
     * ID of the drawable for this rendered target,
     * returned by the renderer, if rendered.
     * @type {?Number}
     */
    this.drawableID = null;

    /**
     * Map of current graphic effect values.
     * @type {!Object.<string, number>}
     */
    this.effects = {
        color: 0,
        fisheye: 0,
        whirl: 0,
        pixelate: 0,
        mosaic: 0,
        brightness: 0,
        ghost: 0
    };
};
util.inherits(RenderedTarget, Target);

/**
 * Create a drawable with the this.renderer.
 */
RenderedTarget.prototype.initDrawable = function () {
    if (this.renderer) {
        this.drawableID = this.renderer.createDrawable();
    }
    // If we're a clone, start the hats.
    if (!this.isOriginal) {
        this.runtime.startHats(
            'control_start_as_clone', null, this
        );
    }
};

/**
 * Whether this represents an "original" non-clone rendered-target for a sprite,
 * i.e., created by the editor and not clone blocks.
 * @type {boolean}
 */
RenderedTarget.prototype.isOriginal = true;

/**
 * Whether this rendered target represents the Scratch stage.
 * @type {boolean}
 */
RenderedTarget.prototype.isStage = false;

/**
 * Scratch X coordinate. Currently should range from -240 to 240.
 * @type {Number}
 */
RenderedTarget.prototype.x = 0;

/**
 * Scratch Y coordinate. Currently should range from -180 to 180.
 * @type {number}
 */
RenderedTarget.prototype.y = 0;

/**
 * Scratch direction. Currently should range from -179 to 180.
 * @type {number}
 */
RenderedTarget.prototype.direction = 90;

/**
 * Whether the rendered target is currently visible.
 * @type {boolean}
 */
RenderedTarget.prototype.visible = true;

/**
 * Size of rendered target as a percent of costume size.
 * @type {number}
 */
RenderedTarget.prototype.size = 100;

/**
 * Currently selected costume index.
 * @type {number}
 */
RenderedTarget.prototype.currentCostume = 0;

/**
 * Rotation style for "all around"/spinning.
 * @enum
 */
RenderedTarget.ROTATION_STYLE_ALL_AROUND = 'all around';

/**
 * Rotation style for "left-right"/flipping.
 * @enum
 */
RenderedTarget.ROTATION_STYLE_LEFT_RIGHT = 'left-right';

/**
 * Rotation style for "no rotation."
 * @enum
 */
RenderedTarget.ROTATION_STYLE_NONE = 'don\'t rotate';

/**
 * Current rotation style.
 * @type {!string}
 */
RenderedTarget.prototype.rotationStyle = (
    RenderedTarget.ROTATION_STYLE_ALL_AROUND
);

/**
 * Set the X and Y coordinates.
 * @param {!number} x New X coordinate, in Scratch coordinates.
 * @param {!number} y New Y coordinate, in Scratch coordinates.
 */
RenderedTarget.prototype.setXY = function (x, y) {
    if (this.isStage) {
        return;
    }
    this.x = x;
    this.y = y;
    if (this.renderer) {
        this.renderer.updateDrawableProperties(this.drawableID, {
            position: [this.x, this.y]
        });
        if (this.visible) {
            this.runtime.requestRedraw();
        }
    }
    this.runtime.spriteInfoReport(this);
};

/**
 * Get the rendered direction and scale, after applying rotation style.
 * @return {Object<string, number>} Direction and scale to render.
 */
RenderedTarget.prototype._getRenderedDirectionAndScale = function () {
    // Default: no changes to `this.direction` or `this.scale`.
    var finalDirection = this.direction;
    var finalScale = [this.size, this.size];
    if (this.rotationStyle === RenderedTarget.ROTATION_STYLE_NONE) {
        // Force rendered direction to be 90.
        finalDirection = 90;
    } else if (this.rotationStyle === RenderedTarget.ROTATION_STYLE_LEFT_RIGHT) {
        // Force rendered direction to be 90, and flip drawable if needed.
        finalDirection = 90;
        var scaleFlip = (this.direction < 0) ? -1 : 1;
        finalScale = [scaleFlip * this.size, this.size];
    }
    return {direction: finalDirection, scale: finalScale};
};

/**
 * Set the direction.
 * @param {!number} direction New direction.
 */
RenderedTarget.prototype.setDirection = function (direction) {
    if (this.isStage) {
        return;
    }
    // Keep direction between -179 and +180.
    this.direction = MathUtil.wrapClamp(direction, -179, 180);
    if (this.renderer) {
        var renderedDirectionScale = this._getRenderedDirectionAndScale();
        this.renderer.updateDrawableProperties(this.drawableID, {
            direction: renderedDirectionScale.direction,
            scale: renderedDirectionScale.scale
        });
        if (this.visible) {
            this.runtime.requestRedraw();
        }
    }
    this.runtime.spriteInfoReport(this);
};

/**
 * Set a say bubble.
 * @param {?string} type Type of say bubble: "say", "think", or null.
 * @param {?string} message Message to put in say bubble.
 */
RenderedTarget.prototype.setSay = function (type, message) {
    if (this.isStage) {
        return;
    }
    // @todo: Render to stage.
    if (!type || !message) {
        log.info('Clearing say bubble');
        return;
    }
    log.info('Setting say bubble:', type, message);
};

/**
 * Set visibility; i.e., whether it's shown or hidden.
 * @param {!boolean} visible True if should be shown.
 */
RenderedTarget.prototype.setVisible = function (visible) {
    if (this.isStage) {
        return;
    }
    this.visible = !!visible;
    if (this.renderer) {
        this.renderer.updateDrawableProperties(this.drawableID, {
            visible: this.visible
        });
        if (this.visible) {
            this.runtime.requestRedraw();
        }
    }
    this.runtime.spriteInfoReport(this);
};

/**
 * Set size, as a percentage of the costume size.
 * @param {!number} size Size of rendered target, as % of costume size.
 */
RenderedTarget.prototype.setSize = function (size) {
    if (this.isStage) {
        return;
    }
    // Keep size between 5% and 535%.
    this.size = MathUtil.clamp(size, 5, 535);
    if (this.renderer) {
        var renderedDirectionScale = this._getRenderedDirectionAndScale();
        this.renderer.updateDrawableProperties(this.drawableID, {
            direction: renderedDirectionScale.direction,
            scale: renderedDirectionScale.scale
        });
        if (this.visible) {
            this.runtime.requestRedraw();
        }
    }
};

/**
 * Set a particular graphic effect value.
 * @param {!string} effectName Name of effect (see `RenderedTarget.prototype.effects`).
 * @param {!number} value Numerical magnitude of effect.
 */
RenderedTarget.prototype.setEffect = function (effectName, value) {
    if (!this.effects.hasOwnProperty(effectName)) return;
    this.effects[effectName] = value;
    if (this.renderer) {
        var props = {};
        props[effectName] = this.effects[effectName];
        this.renderer.updateDrawableProperties(this.drawableID, props);
        if (this.visible) {
            this.runtime.requestRedraw();
        }
    }
};

/**
 * Clear all graphic effects on this rendered target.
 */
RenderedTarget.prototype.clearEffects = function () {
    for (var effectName in this.effects) {
        this.effects[effectName] = 0;
    }
    if (this.renderer) {
        this.renderer.updateDrawableProperties(this.drawableID, this.effects);
        if (this.visible) {
            this.runtime.requestRedraw();
        }
    }
};

/**
 * Set the current costume.
 * @param {number} index New index of costume.
 */
RenderedTarget.prototype.setCostume = function (index) {
    // Keep the costume index within possible values.
    index = Math.round(index);
    this.currentCostume = MathUtil.wrapClamp(
        index, 0, this.sprite.costumes.length - 1
    );
    if (this.renderer) {
        var costume = this.sprite.costumes[this.currentCostume];
        this.renderer.updateDrawableProperties(this.drawableID, {
            skin: costume.skin,
            costumeResolution: costume.bitmapResolution,
            rotationCenter: [
                costume.rotationCenterX / costume.bitmapResolution,
                costume.rotationCenterY / costume.bitmapResolution
            ]
        });
        if (this.visible) {
            this.runtime.requestRedraw();
        }
    }
};

/**
 * Update the rotation style.
 * @param {!string} rotationStyle New rotation style.
 */
RenderedTarget.prototype.setRotationStyle = function (rotationStyle) {
    if (rotationStyle === RenderedTarget.ROTATION_STYLE_NONE) {
        this.rotationStyle = RenderedTarget.ROTATION_STYLE_NONE;
    } else if (rotationStyle === RenderedTarget.ROTATION_STYLE_ALL_AROUND) {
        this.rotationStyle = RenderedTarget.ROTATION_STYLE_ALL_AROUND;
    } else if (rotationStyle === RenderedTarget.ROTATION_STYLE_LEFT_RIGHT) {
        this.rotationStyle = RenderedTarget.ROTATION_STYLE_LEFT_RIGHT;
    }
    if (this.renderer) {
        var renderedDirectionScale = this._getRenderedDirectionAndScale();
        this.renderer.updateDrawableProperties(this.drawableID, {
            direction: renderedDirectionScale.direction,
            scale: renderedDirectionScale.scale
        });
        if (this.visible) {
            this.runtime.requestRedraw();
        }
    }
    this.runtime.spriteInfoReport(this);
};

/**
 * Get a costume index of this rendered target, by name of the costume.
 * @param {?string} costumeName Name of a costume.
 * @return {number} Index of the named costume, or -1 if not present.
 */
RenderedTarget.prototype.getCostumeIndexByName = function (costumeName) {
    for (var i = 0; i < this.sprite.costumes.length; i++) {
        if (this.sprite.costumes[i].name === costumeName) {
            return i;
        }
    }
    return -1;
};

/**
 * Update all drawable properties for this rendered target.
 * Use when a batch has changed, e.g., when the drawable is first created.
 */
RenderedTarget.prototype.updateAllDrawableProperties = function () {
    if (this.renderer) {
        var renderedDirectionScale = this._getRenderedDirectionAndScale();
        var costume = this.sprite.costumes[this.currentCostume];
        this.renderer.updateDrawableProperties(this.drawableID, {
            position: [this.x, this.y],
            direction: renderedDirectionScale.direction,
            scale: renderedDirectionScale.scale,
            visible: this.visible,
            skin: costume.skin,
            costumeResolution: costume.bitmapResolution,
            rotationCenter: [
                costume.rotationCenterX / costume.bitmapResolution,
                costume.rotationCenterY / costume.bitmapResolution
            ]
        });
        if (this.visible) {
            this.runtime.requestRedraw();
        }
    }
    this.runtime.spriteInfoReport(this);
};

/**
 * Return the human-readable name for this rendered target, e.g., the sprite's name.
 * @override
 * @returns {string} Human-readable name.
 */
RenderedTarget.prototype.getName = function () {
    return this.sprite.name;
};

/**
 * Return whether this rendered target is a sprite (not a clone, not the stage).
 * @return {boolean} True if not a clone and not the stage.
 */
RenderedTarget.prototype.isSprite = function () {
    return !this.isStage && this.isOriginal;
};

/**
 * Return the rendered target's tight bounding box.
 * Includes top, left, bottom, right attributes in Scratch coordinates.
 * @return {?Object} Tight bounding box, or null.
 */
RenderedTarget.prototype.getBounds = function () {
    if (this.renderer) {
        return this.runtime.renderer.getBounds(this.drawableID);
    }
    return null;
};

/**
 * Return whether touching a point.
 * @param {number} x X coordinate of test point.
 * @param {number} y Y coordinate of test point.
 * @return {Boolean} True iff the rendered target is touching the point.
 */
RenderedTarget.prototype.isTouchingPoint = function (x, y) {
    if (this.renderer) {
        // @todo: Update once pick is in Scratch coordinates.
        // Limits test to this Drawable, so this will return true
        // even if the clone is obscured by another Drawable.
        var pickResult = this.runtime.renderer.pick(
            x + (this.runtime.constructor.STAGE_WIDTH / 2),
            -y + (this.runtime.constructor.STAGE_HEIGHT / 2),
            null, null,
            [this.drawableID]
        );
        return pickResult === this.drawableID;
    }
    return false;
};

/**
 * Return whether touching a stage edge.
 * @return {Boolean} True iff the rendered target is touching the stage edge.
 */
RenderedTarget.prototype.isTouchingEdge = function () {
    if (this.renderer) {
        var stageWidth = this.runtime.constructor.STAGE_WIDTH;
        var stageHeight = this.runtime.constructor.STAGE_HEIGHT;
        var bounds = this.getBounds();
        if (bounds.left < -stageWidth / 2 ||
            bounds.right > stageWidth / 2 ||
            bounds.top > stageHeight / 2 ||
            bounds.bottom < -stageHeight / 2) {
            return true;
        }
    }
    return false;
};

/**
 * Return whether touching any of a named sprite's clones.
 * @param {string} spriteName Name of the sprite.
 * @return {Boolean} True iff touching a clone of the sprite.
 */
RenderedTarget.prototype.isTouchingSprite = function (spriteName) {
    var firstClone = this.runtime.getSpriteTargetByName(spriteName);
    if (!firstClone || !this.renderer) {
        return false;
    }
    var drawableCandidates = firstClone.sprite.clones.map(function (clone) {
        return clone.drawableID;
    });
    return this.renderer.isTouchingDrawables(
        this.drawableID, drawableCandidates);
};

/**
 * Return whether touching a color.
 * @param {Array.<number>} rgb [r,g,b], values between 0-255.
 * @return {Promise.<Boolean>} True iff the rendered target is touching the color.
 */
RenderedTarget.prototype.isTouchingColor = function (rgb) {
    if (this.renderer) {
        return this.renderer.isTouchingColor(this.drawableID, rgb);
    }
    return false;
};

/**
 * Return whether rendered target's color is touching a color.
 * @param {Object} targetRgb {Array.<number>} [r,g,b], values between 0-255.
 * @param {Object} maskRgb {Array.<number>} [r,g,b], values between 0-255.
 * @return {Promise.<Boolean>} True iff the color is touching the color.
 */
RenderedTarget.prototype.colorIsTouchingColor = function (targetRgb, maskRgb) {
    if (this.renderer) {
        return this.renderer.isTouchingColor(
            this.drawableID,
            targetRgb,
            maskRgb
        );
    }
    return false;
};

/**
 * Move to the front layer.
 */
RenderedTarget.prototype.goToFront = function () {
    if (this.renderer) {
        this.renderer.setDrawableOrder(this.drawableID, Infinity);
    }
};

/**
 * Move back a number of layers.
 * @param {number} nLayers How many layers to go back.
 */
RenderedTarget.prototype.goBackLayers = function (nLayers) {
    if (this.renderer) {
        this.renderer.setDrawableOrder(this.drawableID, -nLayers, true, 1);
    }
};

/**
 * Move behind some other rendered target.
 * @param {!Clone} other Other rendered target to move behind.
 */
RenderedTarget.prototype.goBehindOther = function (other) {
    if (this.renderer) {
        var otherLayer = this.renderer.setDrawableOrder(
            other.drawableID, 0, true);
        this.renderer.setDrawableOrder(this.drawableID, otherLayer);
    }
};

/**
 * Keep a desired position within a fence.
 * @param {number} newX New desired X position.
 * @param {number} newY New desired Y position.
 * @param {Object=} optFence Optional fence with left, right, top bottom.
 * @return {Array.<number>} Fenced X and Y coordinates.
 */
RenderedTarget.prototype.keepInFence = function (newX, newY, optFence) {
    var fence = optFence;
    if (!fence) {
        fence = {
            left: -this.runtime.constructor.STAGE_WIDTH / 2,
            right: this.runtime.constructor.STAGE_WIDTH / 2,
            top: this.runtime.constructor.STAGE_HEIGHT / 2,
            bottom: -this.runtime.constructor.STAGE_HEIGHT / 2
        };
    }
    var bounds = this.getBounds();
    if (!bounds) return;
    // Adjust the known bounds to the target position.
    bounds.left += (newX - this.x);
    bounds.right += (newX - this.x);
    bounds.top += (newY - this.y);
    bounds.bottom += (newY - this.y);
    // Find how far we need to move the target position.
    var dx = 0;
    var dy = 0;
    if (bounds.left < fence.left) {
        dx += fence.left - bounds.left;
    }
    if (bounds.right > fence.right) {
        dx += fence.right - bounds.right;
    }
    if (bounds.top > fence.top) {
        dy += fence.top - bounds.top;
    }
    if (bounds.bottom < fence.bottom) {
        dy += fence.bottom - bounds.bottom;
    }
    return [newX + dx, newY + dy];
};

/**
 * Make a clone, copying any run-time properties.
 * If we've hit the global clone limit, returns null.
 * @return {!RenderedTarget} New clone.
 */
RenderedTarget.prototype.makeClone = function () {
    if (!this.runtime.clonesAvailable() || this.isStage) {
        return; // Hit max clone limit, or this is the stage.
    }
    this.runtime.changeCloneCounter(1);
    var newClone = this.sprite.createClone();
    // Copy all properties.
    newClone.x = this.x;
    newClone.y = this.y;
    newClone.direction = this.direction;
    newClone.visible = this.visible;
    newClone.size = this.size;
    newClone.currentCostume = this.currentCostume;
    newClone.rotationStyle = this.rotationStyle;
    newClone.effects = JSON.parse(JSON.stringify(this.effects));
    newClone.variables = JSON.parse(JSON.stringify(this.variables));
    newClone.lists = JSON.parse(JSON.stringify(this.lists));
    newClone.initDrawable();
    newClone.updateAllDrawableProperties();
    // Place behind the current target.
    newClone.goBehindOther(this);
    return newClone;
};

/**
 * Called when the project receives a "green flag."
 * For a rendered target, this clears graphic effects.
 */
RenderedTarget.prototype.onGreenFlag = function () {
    this.clearEffects();
};

/**
 * Post/edit sprite info.
 * @param {object} data An object with sprite info data to set.
 */
RenderedTarget.prototype.postSpriteInfo = function (data) {
    if (data.hasOwnProperty('x')) {
        this.setXY(data.x, this.y);
    }
    if (data.hasOwnProperty('y')) {
        this.setXY(this.x, data.y);
    }
    if (data.hasOwnProperty('direction')) {
        this.setDirection(data.direction);
    }
    if (data.hasOwnProperty('rotationStyle')) {
        this.setRotationStyle(data.rotationStyle);
    }
    if (data.hasOwnProperty('visible')) {
        this.setVisible(data.visible);
    }
};

/**
 * Dispose, destroying any run-time properties.
 */
RenderedTarget.prototype.dispose = function () {
    this.runtime.changeCloneCounter(-1);
    if (this.renderer && this.drawableID !== null) {
        this.renderer.destroyDrawable(this.drawableID);
        if (this.visible) {
            this.runtime.requestRedraw();
        }
    }
};

module.exports = RenderedTarget;
