var Cast = require('../util/cast');
var Clone = require('../util/clone');
var Color = require('../util/color');
var MathUtil = require('../util/math-util');
var RenderedTarget = require('../sprites/rendered-target');

/**
 * @typedef {object} PenState - the pen state associated with a particular target.
 * @property {Boolean} penDown - tracks whether the pen should draw for this target.
 * @property {number} hue - the current hue of the pen.
 * @property {number} shade - the current shade of the pen.
 * @property {PenAttributes} penAttributes - cached pen attributes for the renderer. This is the authoritative value for
 *   diameter but not for pen color.
 */

/**
 * Host for the Pen-related blocks in Scratch 3.0
 * @param {Runtime} runtime - the runtime instantiating this block package.
 * @constructor
 */
var Scratch3PenBlocks = function (runtime) {
    /**
     * The runtime instantiating this block package.
     * @type {Runtime}
     */
    this.runtime = runtime;

    /**
     * The ID of the renderer Drawable corresponding to the pen layer.
     * @type {int}
     * @private
     */
    this._penDrawableId = -1;

    /**
     * The ID of the renderer Skin corresponding to the pen layer.
     * @type {int}
     * @private
     */
    this._penSkinId = -1;

    this._onTargetMoved = this._onTargetMoved.bind(this);
};

/**
 * The default pen state, to be used when a target has no existing pen state.
 * @type {PenState}
 */
Scratch3PenBlocks.DEFAULT_PEN_STATE = {
    penDown: false,
    hue: 120,
    shade: 50,
    penAttributes: {
        color4f: [0, 0, 1, 1],
        diameter: 1
    }
};

/**
 * Place the pen layer in front of the backdrop but behind everything else.
 * We should probably handle this somewhere else... somewhere central that knows about pen, backdrop, video, etc.
 * Maybe it should be in the GUI?
 * @type {int}
 */
Scratch3PenBlocks.PEN_ORDER = 1;

/**
 * The minimum and maximum allowed pen size.
 * @type {{min: number, max: number}}
 */
Scratch3PenBlocks.PEN_SIZE_RANGE = {min: 1, max: 255};

/**
 * The key to load & store a target's pen-related state.
 * @type {string}
 */
Scratch3PenBlocks.STATE_KEY = 'Scratch.pen';

/**
 * Clamp a pen size value to the range allowed by the pen.
 * @param {number} requestedSize - the requested pen size.
 * @returns {number} the clamped size.
 * @private
 */
Scratch3PenBlocks.prototype._clampPenSize = function (requestedSize) {
    return MathUtil.clamp(requestedSize, Scratch3PenBlocks.PEN_SIZE_RANGE.min, Scratch3PenBlocks.PEN_SIZE_RANGE.max);
};

/**
 * Retrieve the ID of the renderer "Skin" corresponding to the pen layer. If the pen Skin doesn't yet exist, create it.
 * @returns {int} the Skin ID of the pen layer, or -1 on failure.
 * @private
 */
Scratch3PenBlocks.prototype._getPenLayerID = function () {
    if (this._penSkinId < 0 && this.runtime.renderer) {
        this._penSkinId = this.runtime.renderer.createPenSkin();
        this._penDrawableId = this.runtime.renderer.createDrawable();
        this.runtime.renderer.setDrawableOrder(this._penDrawableId, Scratch3PenBlocks.PEN_ORDER);
        this.runtime.renderer.updateDrawableProperties(this._penDrawableId, {skinId: this._penSkinId});
    }
    return this._penSkinId;
};

/**
 * @param {Target} target - collect pen state for this target. Probably, but not necessarily, a RenderedTarget.
 * @returns {PenState} the mutable pen state associated with that target. This will be created if necessary.
 * @private
 */
Scratch3PenBlocks.prototype._getPenState = function (target) {
    var penState = target.getCustomState(Scratch3PenBlocks.STATE_KEY);
    if (!penState) {
        penState = Clone.simple(Scratch3PenBlocks.DEFAULT_PEN_STATE);
        target.setCustomState(Scratch3PenBlocks.STATE_KEY, penState);
    }
    return penState;
};

/**
 * Handle a target which has moved. This only fires when the pen is down.
 * @param {RenderedTarget} target - the target which has moved.
 * @param {number} oldX - the previous X position.
 * @param {number} oldY - the previous Y position.
 * @private
 */
Scratch3PenBlocks.prototype._onTargetMoved = function (target, oldX, oldY) {
    var penSkinId = this._getPenLayerID();
    if (penSkinId >= 0) {
        var penState = this._getPenState(target);
        this.runtime.renderer.penLine(penSkinId, penState.penAttributes, oldX, oldY, target.x, target.y);
        this.runtime.requestRedraw();
    }
};

/**
 * Update the cached RGB color from the hue & shade values in the provided PenState object.
 * @param {PenState} penState - the pen state to update.
 * @private
 */
Scratch3PenBlocks.prototype._updatePenColor = function (penState) {
    var rgb = Color.hsvToRgb({h: penState.hue * 180 / 100, s: 1, v: 1});
    var shade = (penState.shade > 100) ? 200 - penState.shade : penState.shade;
    if (shade < 50) {
        rgb = Color.mixRgb(Color.RGB_BLACK, rgb, (10 + shade) / 60);
    } else {
        rgb = Color.mixRgb(rgb, Color.RGB_WHITE, (shade - 50) / 60);
    }
    penState.penAttributes.color4f[0] = rgb.r / 255.0;
    penState.penAttributes.color4f[1] = rgb.g / 255.0;
    penState.penAttributes.color4f[2] = rgb.b / 255.0;
};

/**
 * Wrap a pen hue or shade values to the range [0,200).
 * @param {number} value - the pen hue or shade value to the proper range.
 * @returns {number} the wrapped value.
 * @private
 */
Scratch3PenBlocks.prototype._wrapHueOrShade = function (value) {
    value = value % 200;
    if (value < 0) value += 200;
    return value;
};

/**
 * Retrieve the block primitives implemented by this package.
 * @return {object.<string, Function>} Mapping of opcode to Function.
 */
Scratch3PenBlocks.prototype.getPrimitives = function () {
    return {
        pen_clear: this.clear,
        pen_stamp: this.stamp,
        pen_pendown: this.penDown,
        pen_penup: this.penUp,
        pen_setpencolortocolor: this.setPenColorToColor,
        pen_changepencolorby: this.changePenHueBy,
        pen_setpencolortonum: this.setPenHueToNumber,
        pen_changepenshadeby: this.changePenShadeBy,
        pen_setpenshadeto: this.setPenShadeToNumber,
        pen_changepensizeby: this.changePenSizeBy,
        pen_setpensizeto: this.setPenSizeTo
    };
};

/**
 * The pen "clear" block clears the pen layer's contents.
 */
Scratch3PenBlocks.prototype.clear = function () {
    var penSkinId = this._getPenLayerID();
    if (penSkinId >= 0) {
        this.runtime.renderer.penClear(penSkinId);
        this.runtime.requestRedraw();
    }
};

/**
 * The pen "stamp" block stamps the current drawable's image onto the pen layer.
 * @param {object} args - the block arguments.
 * @param {object} util - utility object provided by the runtime.
 */
Scratch3PenBlocks.prototype.stamp = function (args, util) {
    var penSkinId = this._getPenLayerID();
    if (penSkinId >= 0) {
        var target = util.target;
        this.runtime.renderer.penStamp(penSkinId, target.drawableID);
        this.runtime.requestRedraw();
    }
};

/**
 * The pen "pen down" block causes the target to leave pen trails on future motion.
 * @param {object} args - the block arguments.
 * @param {object} util - utility object provided by the runtime.
 */
Scratch3PenBlocks.prototype.penDown = function (args, util) {
    var target = util.target;
    var penState = this._getPenState(target);

    if (!penState.penDown) {
        penState.penDown = true;
        target.addListener(RenderedTarget.EVENT_TARGET_MOVED, this._onTargetMoved);
    }

    var penSkinId = this._getPenLayerID();
    if (penSkinId >= 0) {
        this.runtime.renderer.penPoint(penSkinId, penState.penAttributes, target.x, target.y);
        this.runtime.requestRedraw();
    }
};

/**
 * The pen "pen up" block stops the target from leaving pen trails.
 * @param {object} args - the block arguments.
 * @param {object} util - utility object provided by the runtime.
 */
Scratch3PenBlocks.prototype.penUp = function (args, util) {
    var target = util.target;
    var penState = this._getPenState(target);

    if (penState.penDown) {
        penState.penDown = false;
        target.removeListener(RenderedTarget.EVENT_TARGET_MOVED, this._onTargetMoved);
    }
};

/**
 * The pen "set pen color to {color}" block sets the pen to a particular RGB color.
 * @param {object} args - the block arguments.
 *  @property {int} COLOR - the color to set, expressed as a 24-bit RGB value (0xRRGGBB).
 * @param {object} util - utility object provided by the runtime.
 */
Scratch3PenBlocks.prototype.setPenColorToColor = function (args, util) {
    var penState = this._getPenState(util.target);
    var rgb = Cast.toRgbColorObject(args.COLOR);
    var hsv = Color.rgbToHsv(rgb);

    penState.hue = 200 * hsv.h / 360;
    penState.shade = 50 * hsv.v;
    penState.penAttributes.color4f[0] = rgb.r / 255.0;
    penState.penAttributes.color4f[1] = rgb.g / 255.0;
    penState.penAttributes.color4f[2] = rgb.b / 255.0;
    if (rgb.hasOwnProperty('a')) {  // Will there always be an 'a'?
        penState.penAttributes.color4f[3] = rgb.a / 255.0;
    }
};

/**
 * The pen "change pen color by {number}" block rotates the hue of the pen by the given amount.
 * @param {object} args - the block arguments.
 *  @property {number} COLOR - the amount of desired hue rotation.
 * @param {object} util - utility object provided by the runtime.
 */
Scratch3PenBlocks.prototype.changePenHueBy = function (args, util) {
    var penState = this._getPenState(util.target);
    penState.hue = this._wrapHueOrShade(penState.hue + Cast.toNumber(args.COLOR));
    this._updatePenColor(penState);
};

/**
 * The pen "set pen color to {number}" block sets the hue of the pen.
 * @param {object} args - the block arguments.
 *  @property {number} COLOR - the desired hue.
 * @param {object} util - utility object provided by the runtime.
 */
Scratch3PenBlocks.prototype.setPenHueToNumber = function (args, util) {
    var penState = this._getPenState(util.target);
    penState.hue = this._wrapHueOrShade(Cast.toNumber(args.COLOR));
    this._updatePenColor(penState);
};

/**
 * The pen "change pen shade by {number}" block changes the "shade" of the pen, related to the HSV value.
 * @param {object} args - the block arguments.
 *  @property {number} SHADE - the amount of desired shade change.
 * @param {object} util - utility object provided by the runtime.
 */
Scratch3PenBlocks.prototype.changePenShadeBy = function (args, util) {
    var penState = this._getPenState(util.target);
    penState.shade = this._wrapHueOrShade(penState.shade + Cast.toNumber(args.SHADE));
    this._updatePenColor(penState);
};

/**
 * The pen "set pen shade to {number}" block sets the "shade" of the pen, related to the HSV value.
 * @param {object} args - the block arguments.
 *  @property {number} SHADE - the amount of desired shade change.
 * @param {object} util - utility object provided by the runtime.
 */
Scratch3PenBlocks.prototype.setPenShadeToNumber = function (args, util) {
    var penState = this._getPenState(util.target);
    penState.shade = this._wrapHueOrShade(Cast.toNumber(args.SHADE));
    this._updatePenColor(penState);
};

/**
 * The pen "change pen size by {number}" block changes the pen size by the given amount.
 * @param {object} args - the block arguments.
 *  @property {number} SIZE - the amount of desired size change.
 * @param {object} util - utility object provided by the runtime.
 */
Scratch3PenBlocks.prototype.changePenSizeBy = function (args, util) {
    var penAttributes = this._getPenState(util.target).penAttributes;
    penAttributes.diameter = this._clampPenSize(penAttributes.diameter + Cast.toNumber(args.SIZE));
};

/**
 * The pen "set pen size to {number}" block sets the pen size to the given amount.
 * @param {object} args - the block arguments.
 *  @property {number} SIZE - the amount of desired size change.
 * @param {object} util - utility object provided by the runtime.
 */
Scratch3PenBlocks.prototype.setPenSizeTo = function (args, util) {
    var penAttributes = this._getPenState(util.target).penAttributes;
    penAttributes.diameter = this._clampPenSize(Cast.toNumber(args.SIZE));
};

module.exports = Scratch3PenBlocks;
