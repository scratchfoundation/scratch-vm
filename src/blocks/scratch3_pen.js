const ArgumentType = require('../extension-support/argument-type');
const BlockType = require('../extension-support/block-type');
const Cast = require('../util/cast');
const Clone = require('../util/clone');
const Color = require('../util/color');
const MathUtil = require('../util/math-util');
const RenderedTarget = require('../sprites/rendered-target');

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
class Scratch3PenBlocks {
    constructor (runtime) {
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

        this._onTargetCreated = this._onTargetCreated.bind(this);
        this._onTargetMoved = this._onTargetMoved.bind(this);

        runtime.on('targetWasCreated', this._onTargetCreated);
    }

    /**
     * The default pen state, to be used when a target has no existing pen state.
     * @type {PenState}
     */
    static get DEFAULT_PEN_STATE () {
        return {
            penDown: false,
            hue: 120,
            shade: 50,
            transparency: 0,
            penAttributes: {
                color4f: [0, 0, 1, 1],
                diameter: 1
            }
        };
    }

    /**
     * Place the pen layer in front of the backdrop but behind everything else.
     * We should probably handle this somewhere else... somewhere central that knows about pen, backdrop, video, etc.
     * Maybe it should be in the GUI?
     * @type {int}
     */
    static get PEN_ORDER () {
        return 1;
    }

    /**
     * The minimum and maximum allowed pen size.
     * @type {{min: number, max: number}}
     */
    static get PEN_SIZE_RANGE () {
        return {min: 1, max: 255};
    }

    /**
     * The key to load & store a target's pen-related state.
     * @type {string}
     */
    static get STATE_KEY () {
        return 'Scratch.pen';
    }

    /**
     * Clamp a pen size value to the range allowed by the pen.
     * @param {number} requestedSize - the requested pen size.
     * @returns {number} the clamped size.
     * @private
     */
    _clampPenSize (requestedSize) {
        return MathUtil.clamp(
            requestedSize,
            Scratch3PenBlocks.PEN_SIZE_RANGE.min,
            Scratch3PenBlocks.PEN_SIZE_RANGE.max
        );
    }

    /**
     * Retrieve the ID of the renderer "Skin" corresponding to the pen layer. If
     * the pen Skin doesn't yet exist, create it.
     * @returns {int} the Skin ID of the pen layer, or -1 on failure.
     * @private
     */
    _getPenLayerID () {
        if (this._penSkinId < 0 && this.runtime.renderer) {
            this._penSkinId = this.runtime.renderer.createPenSkin();
            this._penDrawableId = this.runtime.renderer.createDrawable();
            this.runtime.renderer.setDrawableOrder(this._penDrawableId, Scratch3PenBlocks.PEN_ORDER);
            this.runtime.renderer.updateDrawableProperties(this._penDrawableId, {skinId: this._penSkinId});
        }
        return this._penSkinId;
    }

    /**
     * @param {Target} target - collect pen state for this target. Probably, but not necessarily, a RenderedTarget.
     * @returns {PenState} the mutable pen state associated with that target. This will be created if necessary.
     * @private
     */
    _getPenState (target) {
        let penState = target.getCustomState(Scratch3PenBlocks.STATE_KEY);
        if (!penState) {
            penState = Clone.simple(Scratch3PenBlocks.DEFAULT_PEN_STATE);
            target.setCustomState(Scratch3PenBlocks.STATE_KEY, penState);
        }
        return penState;
    }

    /**
     * When a pen-using Target is cloned, clone the pen state.
     * @param {Target} newTarget - the newly created target.
     * @param {Target} [sourceTarget] - the target used as a source for the new clone, if any.
     * @listens Runtime#event:targetWasCreated
     * @private
     */
    _onTargetCreated (newTarget, sourceTarget) {
        if (sourceTarget) {
            const penState = sourceTarget.getCustomState(Scratch3PenBlocks.STATE_KEY);
            if (penState) {
                newTarget.setCustomState(Scratch3PenBlocks.STATE_KEY, Clone.simple(penState));
                if (penState.penDown) {
                    newTarget.addListener(RenderedTarget.EVENT_TARGET_MOVED, this._onTargetMoved);
                }
            }
        }
    }

    /**
     * Handle a target which has moved. This only fires when the pen is down.
     * @param {RenderedTarget} target - the target which has moved.
     * @param {number} oldX - the previous X position.
     * @param {number} oldY - the previous Y position.
     * @private
     */
    _onTargetMoved (target, oldX, oldY) {
        const penSkinId = this._getPenLayerID();
        if (penSkinId >= 0) {
            const penState = this._getPenState(target);
            this.runtime.renderer.penLine(penSkinId, penState.penAttributes, oldX, oldY, target.x, target.y);
            this.runtime.requestRedraw();
        }
    }

    /**
     * Update the cached color from the hue, shade and transparency values in the provided
     * PenState object.
     * @param {PenState} penState - the pen state to update.
     * @private
     */
    _updatePenColor (penState) {
        let rgb = Color.hsvToRgb({h: penState.hue * 180 / 100, s: 1, v: 1});
        const shade = (penState.shade > 100) ? 200 - penState.shade : penState.shade;
        if (shade < 50) {
            rgb = Color.mixRgb(Color.RGB_BLACK, rgb, (10 + shade) / 60);
        } else {
            rgb = Color.mixRgb(rgb, Color.RGB_WHITE, (shade - 50) / 60);
        }
        penState.penAttributes.color4f[0] = rgb.r / 255.0;
        penState.penAttributes.color4f[1] = rgb.g / 255.0;
        penState.penAttributes.color4f[2] = rgb.b / 255.0;
        penState.penAttributes.color4f[3] = this._transparencyToAlpha(penState.transparency);
    }

    /**
     * Wrap a pen hue or shade values to the range (0,200).
     * @param {number} value - the pen hue or shade value to the proper range.
     * @returns {number} the wrapped value.
     * @private
     */
    _wrapHueOrShade (value) {
        value = value % 200;
        if (value < 0) value += 200;
        return value;
    }

    /**
     * Clamp a pen transparency value to the range (0,100).
     * @param {number} value - the pen transparency value to be clamped.
     * @returns {number} the clamped value.
     * @private
     */
    _clampTransparency (value) {
        return MathUtil.clamp(value, 0, 100);
    }

    /**
     * Convert an alpha value to a pen transparency value.
     * Alpha ranges from 0 to 1, where 0 is transparent and 1 is opaque.
     * Transparency ranges from 0 to 100, where 0 is opaque and 100 is transparent.
     * @param {number} alpha - the input alpha value.
     * @returns {number} the transparency value.
     * @private
     */
    _alphaToTransparency (alpha) {
        return (1.0 - alpha) * 100.0;
    }

    /**
     * Convert a pen transparency value to an alpha value.
     * Alpha ranges from 0 to 1, where 0 is transparent and 1 is opaque.
     * Transparency ranges from 0 to 100, where 0 is opaque and 100 is transparent.
     * @param {number} transparency - the input transparency value.
     * @returns {number} the alpha value.
     * @private
     */
    _transparencyToAlpha (transparency) {
        return 1.0 - (transparency / 100.0);
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: 'pen',
            name: 'Pen',
            blocks: [
                {
                    opcode: 'clear',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        NUM1: {
                            type: ArgumentType.NUMBER
                        },
                        NUM2: {
                            type: ArgumentType.NUMBER
                        }
                    }
                },
                {
                    opcode: 'stamp',
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'penDown',
                    blockType: BlockType.COMMAND,
                    text: 'pen down'
                },
                {
                    opcode: 'penUp',
                    blockType: BlockType.COMMAND,
                    text: 'pen up'
                },
                {
                    opcode: 'setPenColorToColor',
                    blockType: BlockType.COMMAND,
                    text: 'set pen color to [COLOR]',
                    arguments: {
                        COLOR: {
                            type: ArgumentType.COLOR
                        }
                    }
                },
                {
                    opcode: 'changePenHueBy',
                    blockType: BlockType.COMMAND,
                    text: 'change pen color by [COLOR]',
                    arguments: {
                        COLOR: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 10
                        }
                    }
                },
                {
                    opcode: 'setPenHueToNumber',
                    blockType: BlockType.COMMAND,
                    text: 'set pen color to [COLOR]',
                    arguments: {
                        COLOR: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: 'changePenShadeBy',
                    blockType: BlockType.COMMAND,
                    text: 'change pen shade by [SHADE]',
                    arguments: {
                        SHADE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 10
                        }
                    }
                },
                {
                    opcode: 'setPenShadeToNumber',
                    blockType: BlockType.COMMAND,
                    text: 'set pen shade to [SHADE]',
                    arguments: {
                        SHADE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 50
                        }
                    }
                },
                {
                    opcode: 'changePenSizeBy',
                    blockType: BlockType.COMMAND,
                    text: 'change pen size by [SIZE]',
                    arguments: {
                        SIZE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'setPenSizeTo',
                    blockType: BlockType.COMMAND,
                    text: 'set pen size to [SIZE]',
                    arguments: {
                        SIZE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                }
            ]
        };
    }

    /**
     * The pen "clear" block clears the pen layer's contents.
     */
    clear () {
        const penSkinId = this._getPenLayerID();
        if (penSkinId >= 0) {
            this.runtime.renderer.penClear(penSkinId);
            this.runtime.requestRedraw();
        }
    }

    /**
     * The pen "stamp" block stamps the current drawable's image onto the pen layer.
     * @param {object} args - the block arguments.
     * @param {object} util - utility object provided by the runtime.
     */
    stamp (args, util) {
        const penSkinId = this._getPenLayerID();
        if (penSkinId >= 0) {
            const target = util.target;
            this.runtime.renderer.penStamp(penSkinId, target.drawableID);
            this.runtime.requestRedraw();
        }
    }

    /**
     * The pen "pen down" block causes the target to leave pen trails on future motion.
     * @param {object} args - the block arguments.
     * @param {object} util - utility object provided by the runtime.
     */
    penDown (args, util) {
        const target = util.target;
        const penState = this._getPenState(target);

        if (!penState.penDown) {
            penState.penDown = true;
            target.addListener(RenderedTarget.EVENT_TARGET_MOVED, this._onTargetMoved);
        }

        const penSkinId = this._getPenLayerID();
        if (penSkinId >= 0) {
            this.runtime.renderer.penPoint(penSkinId, penState.penAttributes, target.x, target.y);
            this.runtime.requestRedraw();
        }
    }

    /**
     * The pen "pen up" block stops the target from leaving pen trails.
     * @param {object} args - the block arguments.
     * @param {object} util - utility object provided by the runtime.
     */
    penUp (args, util) {
        const target = util.target;
        const penState = this._getPenState(target);

        if (penState.penDown) {
            penState.penDown = false;
            target.removeListener(RenderedTarget.EVENT_TARGET_MOVED, this._onTargetMoved);
        }
    }

    /**
     * The pen "set pen color to {color}" block sets the pen to a particular RGB color.
     * @param {object} args - the block arguments.
     *  @property {int} COLOR - the color to set, expressed as a 24-bit RGB value (0xRRGGBB).
     * @param {object} util - utility object provided by the runtime.
     */
    setPenColorToColor (args, util) {
        const penState = this._getPenState(util.target);
        const rgb = Cast.toRgbColorObject(args.COLOR);
        const hsv = Color.rgbToHsv(rgb);

        penState.hue = 200 * hsv.h / 360;
        penState.shade = 50 * hsv.v;
        penState.penAttributes.color4f[0] = rgb.r / 255.0;
        penState.penAttributes.color4f[1] = rgb.g / 255.0;
        penState.penAttributes.color4f[2] = rgb.b / 255.0;
        if (rgb.hasOwnProperty('a')) { // Will there always be an 'a'?
            penState.penAttributes.color4f[3] = rgb.a / 255.0;
        } else {
            penState.penAttributes.color4f[3] = 1;
        }
        penState.transparency = this._alphaToTransparency(penState.penAttributes.color4f[3]);
    }

    /**
     * The pen "change pen color by {number}" block rotates the hue of the pen by the given amount.
     * @param {object} args - the block arguments.
     *  @property {number} COLOR - the amount of desired hue rotation.
     * @param {object} util - utility object provided by the runtime.
     */
    changePenHueBy (args, util) {
        const penState = this._getPenState(util.target);
        penState.hue = this._wrapHueOrShade(penState.hue + Cast.toNumber(args.COLOR));
        this._updatePenColor(penState);
    }

    /**
     * The pen "set pen color to {number}" block sets the hue of the pen.
     * @param {object} args - the block arguments.
     *  @property {number} COLOR - the desired hue.
     * @param {object} util - utility object provided by the runtime.
     */
    setPenHueToNumber (args, util) {
        const penState = this._getPenState(util.target);
        penState.hue = this._wrapHueOrShade(Cast.toNumber(args.COLOR));
        this._updatePenColor(penState);
    }

    /**
     * The pen "change pen shade by {number}" block changes the "shade" of the pen, related to the HSV value.
     * @param {object} args - the block arguments.
     *  @property {number} SHADE - the amount of desired shade change.
     * @param {object} util - utility object provided by the runtime.
     */
    changePenShadeBy (args, util) {
        const penState = this._getPenState(util.target);
        penState.shade = this._wrapHueOrShade(penState.shade + Cast.toNumber(args.SHADE));
        this._updatePenColor(penState);
    }

    /**
     * The pen "set pen shade to {number}" block sets the "shade" of the pen, related to the HSV value.
     * @param {object} args - the block arguments.
     *  @property {number} SHADE - the amount of desired shade change.
     * @param {object} util - utility object provided by the runtime.
     */
    setPenShadeToNumber (args, util) {
        const penState = this._getPenState(util.target);
        penState.shade = this._wrapHueOrShade(Cast.toNumber(args.SHADE));
        this._updatePenColor(penState);
    }

    /**
     * The pen "change pen size by {number}" block changes the pen size by the given amount.
     * @param {object} args - the block arguments.
     *  @property {number} SIZE - the amount of desired size change.
     * @param {object} util - utility object provided by the runtime.
     */
    changePenSizeBy (args, util) {
        const penAttributes = this._getPenState(util.target).penAttributes;
        penAttributes.diameter = this._clampPenSize(penAttributes.diameter + Cast.toNumber(args.SIZE));
    }

    /**
     * The pen "set pen size to {number}" block sets the pen size to the given amount.
     * @param {object} args - the block arguments.
     *  @property {number} SIZE - the amount of desired size change.
     * @param {object} util - utility object provided by the runtime.
     */
    setPenSizeTo (args, util) {
        const penAttributes = this._getPenState(util.target).penAttributes;
        penAttributes.diameter = this._clampPenSize(Cast.toNumber(args.SIZE));
    }

    /**
     * The pen "change pen transparency by {number}" block changes the RGBA "transparency" of the pen.
     * @param {object} args - the block arguments.
     *  @property {number} TRANSPARENCY - the amount of desired transparency change.
     * @param {object} util - utility object provided by the runtime.
     */
    changePenTransparencyBy (args, util) {
        const penState = this._getPenState(util.target);
        penState.transparency = this._clampTransparency(penState.transparency + Cast.toNumber(args.TRANSPARENCY));
        this._updatePenColor(penState);
    }

    /**
     * The pen "set pen transparency to {number}" block sets the RGBA "transparency" of the pen.
     * @param {object} args - the block arguments.
     *  @property {number} TRANSPARENCY - the amount of desired transparency change.
     * @param {object} util - utility object provided by the runtime.
     */
    setPenTransparencyTo (args, util) {
        const penState = this._getPenState(util.target);
        penState.transparency = this._clampTransparency(Cast.toNumber(args.TRANSPARENCY));
        this._updatePenColor(penState);
    }
}

module.exports = Scratch3PenBlocks;
