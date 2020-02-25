const BlockType = require('../../extension-support/block-type');
const Clone = require('../../util/clone');
const RenderedTarget = require('../../sprites/rendered-target');
const StageLayering = require('../../engine/stage-layering');

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/png;base64,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';

class Scratch3VizBlocks {
    constructor (runtime) {
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
    }

    /**
     * The key to load & store a target's pen-related state.
     * @type {string}
     */
    static get STATE_KEY () {
        return 'Scratch.pen';
    }

    /**
     * The default pen state, to be used when a target has no existing pen state.
     * @type {PenState}
     */
    static get DEFAULT_PEN_STATE () {
        return {
            penDown: true,
            color: 66.66,
            saturation: 100,
            brightness: 100,
            transparency: 0,
            _shade: 50, // Used only for legacy `change shade by` blocks
            penAttributes: {
                color4f: [0, 0, 1, 1],
                diameter: 1
            }
        };
    }

    getInfo () {
        return {
            id: 'vizblocks',
            name: 'VizBlocks',
            blockIconURI: blockIconURI,
            blocks: [
                {
                    opcode: 'drawXAxis',
                    blockType: BlockType.COMMAND,
                    text: 'Draw x-axis'
                }
            ]
        };
    }

    drawXAxis (args, util) {
        const target = util.target;
        const penState = this._getPenState(target);
        target.addListener(RenderedTarget.EVENT_TARGET_MOVED, this._onTargetMoved);

        const penSkinId = this._getPenLayerID();
        if (penSkinId >= 0) {
            this.runtime.renderer.penPoint(penSkinId, penState.penAttributes, target.x, target.y);
            this.runtime.requestRedraw();
        }

        // TODO: Handle the value dynamically
        util.target.setXY(util.target.x + 150, util.target.y);
    }

    /**
     * Handle a target which has moved. This only fires when the pen is down.
     * @param {RenderedTarget} target - the target which has moved.
     * @param {number} oldX - the previous X position.
     * @param {number} oldY - the previous Y position.
     * @param {boolean} isForce - whether the movement was forced.
     * @private
     */
    _onTargetMoved (target, oldX, oldY, isForce) {
        // Only move the pen if the movement isn't forced (ie. dragged).
        if (!isForce) {
            const penSkinId = this._getPenLayerID();
            if (penSkinId >= 0) {
                const penState = this._getPenState(target);
                this.runtime.renderer.penLine(penSkinId, penState.penAttributes, oldX, oldY, target.x, target.y);
                this.runtime.requestRedraw();
            }
        }
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
            this._penDrawableId = this.runtime.renderer.createDrawable(StageLayering.PEN_LAYER);
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
        let penState = target.getCustomState(Scratch3VizBlocks.STATE_KEY);
        if (!penState) {
            penState = Clone.simple(Scratch3VizBlocks.DEFAULT_PEN_STATE);
            target.setCustomState(Scratch3VizBlocks.STATE_KEY, penState);
        }
        return penState;
    }
}

module.exports = Scratch3VizBlocks;
