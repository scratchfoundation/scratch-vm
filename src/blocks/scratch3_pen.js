var Cast = require('../util/cast');
var Color = require('../util/color');
var MathUtil = require('../util/math-util');
var RenderedTarget = require('../sprites/rendered-target');

// Place the pen layer in front of the backdrop but behind everything else
// We should probably handle this somewhere else... somewhere central that knows about pen, backdrop, video, etc.
// Maybe it should be in the GUI?
var penOrder = 1;

var stateKey = 'Scratch.pen';

/**
 * @typedef {object} PenState - the pen state associated with a particular target.
 * @property {Boolean} penDown - tracks whether the pen should draw for this target.
 * @property {number} hue - the current hue of the pen.
 * @property {number} shade - the current shade of the pen.
 * @property {PenAttributes} penAttributes - cached pen attributes for the renderer. This is the authoritative value for
 *   diameter but not for pen color.
 */

/**
 * The default pen state, to be used when a target has no existing pen state.
 * @type {PenState}
 */
var defaultPenState = {
    penDown: false,
    hue: 120,
    shade: 50,
    penAttributes: {
        color4f: [0, 0, 1, 1],
        diameter: 1
    }
};

var Scratch3PenBlocks = function (runtime) {
    /**
     * The runtime instantiating this block package.
     * @type {Runtime}
     */
    this.runtime = runtime;

    this._penSkinId = -1;

    this._onTargetMoved = this._onTargetMoved.bind(this);
};

/**
 * Clamp a pen size value to the range allowed by the pen.
 * @param {number} requestedSize - the requested pen size.
 * @returns {number} the clamped size.
 * @private
 */
Scratch3PenBlocks.prototype._clampPenSize = function (requestedSize) {
    return MathUtil.clamp(requestedSize, 1, 255);
};

Scratch3PenBlocks.prototype._getPenLayerID = function () {
    if (this._penSkinId < 0) {
        this._penSkinId = this.runtime.renderer.createPenSkin();
        this._penDrawableId = this.runtime.renderer.createDrawable();
        this.runtime.renderer.setDrawableOrder(this._penDrawableId, penOrder);
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
    var penState = target.getCustomState(stateKey);
    if (!penState) {
        penState = JSON.parse(JSON.stringify(defaultPenState));
        target.setCustomState(stateKey, penState);
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
    var penState = this._getPenState(target);
    var penSkinId = this._getPenLayerID();
    this.runtime.renderer.penLine(penSkinId, penState.penAttributes, oldX, oldY, target.x, target.y);
    this.runtime.requestRedraw();
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
 * @return {Object.<string, Function>} Mapping of opcode to Function.
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

Scratch3PenBlocks.prototype.clear = function () {
    var penSkinId = this._getPenLayerID();
    this.runtime.renderer.penClear(penSkinId);
    this.runtime.requestRedraw();
};

Scratch3PenBlocks.prototype.stamp = function (args, util) {
    var penSkinId = this._getPenLayerID();
    var target = util.target;
    this.runtime.renderer.penStamp(penSkinId, target.drawableID);
    this.runtime.requestRedraw();
};

Scratch3PenBlocks.prototype.penDown = function (args, util) {
    var target = util.target;
    var penState = this._getPenState(target);

    if (!penState.penDown) {
        penState.penDown = true;
        target.addListener(RenderedTarget.EVENT_TARGET_MOVED, this._onTargetMoved);
    }

    var penSkinId = this._getPenLayerID();
    this.runtime.renderer.penPoint(penSkinId, penState.penAttributes, target.x, target.y);
    this.runtime.requestRedraw();
};

Scratch3PenBlocks.prototype.penUp = function (args, util) {
    var target = util.target;
    var penState = this._getPenState(target);

    if (penState.penDown) {
        penState.penDown = false;
        target.removeListener(RenderedTarget.EVENT_TARGET_MOVED, this._onTargetMoved);
    }
};

Scratch3PenBlocks.prototype.setPenColorToColor = function (args, util) {
    var penState = this._getPenState(util.target);
    var rgb = Cast.toRgbColorObject(args.COLOR);
    var hsv = Color.rgbToHsv(rgb);

    penState.hue = 200 * hsv.h / 360;
    penState.shade = 50 * hsv.v;
    penState.penAttributes.color4f[0] = rgb.r / 255.0;
    penState.penAttributes.color4f[1] = rgb.g / 255.0;
    penState.penAttributes.color4f[2] = rgb.b / 255.0;

    return rgb;
};

Scratch3PenBlocks.prototype.changePenHueBy = function (args, util) {
    var penState = this._getPenState(util.target);
    penState.hue = this._wrapHueOrShade(penState.hue + Cast.toNumber(args.COLOR));
    this._updatePenColor(penState);
};

Scratch3PenBlocks.prototype.setPenHueToNumber = function (args, util) {
    var penState = this._getPenState(util.target);
    penState.hue = this._wrapHueOrShade(Cast.toNumber(args.COLOR));
    this._updatePenColor(penState);
};

Scratch3PenBlocks.prototype.changePenShadeBy = function (args, util) {
    var penState = this._getPenState(util.target);
    penState.shade = this._wrapHueOrShade(penState.shade + Cast.toNumber(args.SHADE));
    this._updatePenColor(penState);
};

Scratch3PenBlocks.prototype.setPenShadeToNumber = function (args, util) {
    var penState = this._getPenState(util.target);
    penState.shade = this._wrapHueOrShade(Cast.toNumber(args.SHADE));
    this._updatePenColor(penState);
};

Scratch3PenBlocks.prototype.changePenSizeBy = function (args, util) {
    var penAttributes = this._getPenState(util.target).penAttributes;
    penAttributes.diameter = this._clampPenSize(penAttributes.diameter + Cast.toNumber(args.SIZE));
};

Scratch3PenBlocks.prototype.setPenSizeTo = function (args, util) {
    var penAttributes = this._getPenState(util.target).penAttributes;
    penAttributes.diameter = this._clampPenSize(Cast.toNumber(args.SIZE));
};

module.exports = Scratch3PenBlocks;
