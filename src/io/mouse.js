const MathUtil = require('../util/math-util');

class Mouse {
    constructor (runtime) {
        this._x = 0;
        this._y = 0;
        this._isDown = false;
        /**
         * Reference to the owning Runtime.
         * Can be used, for example, to activate hats.
         * @type{!Runtime}
         */
        this.runtime = runtime;
    }

    /**
     * Activate "event_whenthisspriteclicked" hats if needed.
     * @param  {number} x X position to be sent to the renderer.
     * @param  {number} y Y position to be sent to the renderer.
     * @param  {?bool} wasDragged Whether the click event was the result of
     * a drag end.
     * @private
     */
    _activateClickHats (x, y, wasDragged) {
        if (this.runtime.renderer) {
            const drawableID = this.runtime.renderer.pick(x, y);
            for (let i = 0; i < this.runtime.targets.length; i++) {
                const target = this.runtime.targets[i];
                if (target.hasOwnProperty('drawableID') &&
                    target.drawableID === drawableID) {
                    // only activate click hat if the mouse up event wasn't
                    // the result of a drag ending
                    if (!wasDragged) {
                        // Activate both "this sprite clicked" and "stage clicked"
                        // They were separated into two opcodes for labeling,
                        // but should act the same way.
                        // Intentionally not checking isStage to make it work when sharing blocks.
                        // @todo the blocks should be converted from one to another when shared
                        this.runtime.startHats('event_whenthisspriteclicked',
                            null, target);
                        this.runtime.startHats('event_whenstageclicked',
                            null, target);
                    }
                    return;
                }
            }
            // If haven't returned, activate click hats for stage.
            // Still using both blocks for sharing compatibility.
            this.runtime.startHats('event_whenthisspriteclicked',
                null, this.runtime.getTargetForStage());
            this.runtime.startHats('event_whenstageclicked',
                null, this.runtime.getTargetForStage());
        }
    }

    /**
     * Mouse DOM event handler.
     * @param  {object} data Data from DOM event.
     */
    postData (data) {
        if (data.x) {
            this._clientX = data.x;
            this._scratchX = MathUtil.clamp(
                480 * ((data.x / data.canvasWidth) - 0.5),
                -240,
                240
            );
        }
        if (data.y) {
            this._clientY = data.y;
            this._scratchY = MathUtil.clamp(
                -360 * ((data.y / data.canvasHeight) - 0.5),
                -180,
                180
            );
        }
        if (typeof data.isDown !== 'undefined') {
            this._isDown = data.isDown;
            // Make sure click is within the canvas bounds to activate click hats
            if (!this._isDown &&
                data.x > 0 && data.x < data.canvasWidth &&
                data.y > 0 && data.y < data.canvasHeight) {
                this._activateClickHats(data.x, data.y, data.wasDragged);
            }
        }
    }

    /**
     * Get the X position of the mouse in client coordinates.
     * @return {number} Non-clamped X position of the mouse cursor.
     */
    getClientX () {
        return this._clientX;
    }

    /**
     * Get the Y position of the mouse in client coordinates.
     * @return {number} Non-clamped Y position of the mouse cursor.
     */
    getClientY () {
        return this._clientY;
    }

    /**
     * Get the X position of the mouse in scratch coordinates.
     * @return {number} Clamped X position of the mouse cursor.
     */
    getScratchX () {
        return this._scratchX;
    }

    /**
     * Get the Y position of the mouse in scratch coordinates.
     * @return {number} Clamped Y position of the mouse cursor.
     */
    getScratchY () {
        return this._scratchY;
    }

    /**
     * Get the down state of the mouse.
     * @return {boolean} Is the mouse down?
     */
    getIsDown () {
        return this._isDown;
    }
}

module.exports = Mouse;
