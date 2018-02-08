const Cast = require('../util/cast');
const Clone = require('../util/clone');
const RenderedTarget = require('../sprites/rendered-target');

/**
 * @typedef {object} BubbleState - the bubble state associated with a particular target.
 * @property {Boolean} onSpriteRight - tracks whether the bubble is right or left of the sprite.
 * @property {?int} drawableId - the ID of the associated bubble Drawable, null if none.
 * @property {Boolean} drawableVisible - false if drawable has been hidden by blank text.
 *      See _renderBubble for explanation of this optimization.
 * @property {string} text - the text of the bubble.
 * @property {string} type - the type of the bubble, "say" or "think"
 */

class Scratch3LooksBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        this._onTargetMoved = this._onTargetMoved.bind(this);
        this._onResetBubbles = this._onResetBubbles.bind(this);
        this._onTargetWillExit = this._onTargetWillExit.bind(this);
        this._updateBubble = this._updateBubble.bind(this);

        // Reset all bubbles on start/stop
        this.runtime.on('PROJECT_STOP_ALL', this._onResetBubbles);
        this.runtime.on('targetWasRemoved', this._onTargetWillExit);

        // Enable other blocks to use bubbles like ask/answer
        this.runtime.on('SAY', this._updateBubble);
    }

    /**
     * The default bubble state, to be used when a target has no existing bubble state.
     * @type {BubbleState}
     */
    static get DEFAULT_BUBBLE_STATE () {
        return {
            drawableId: null,
            drawableVisible: true,
            onSpriteRight: true,
            skinId: null,
            text: '',
            type: 'say'
        };
    }

    /**
     * The key to load & store a target's bubble-related state.
     * @type {string}
     */
    static get STATE_KEY () {
        return 'Scratch.looks';
    }

    /**
     * @param {Target} target - collect bubble state for this target. Probably, but not necessarily, a RenderedTarget.
     * @returns {BubbleState} the mutable bubble state associated with that target. This will be created if necessary.
     * @private
     */
    _getBubbleState (target) {
        let bubbleState = target.getCustomState(Scratch3LooksBlocks.STATE_KEY);
        if (!bubbleState) {
            bubbleState = Clone.simple(Scratch3LooksBlocks.DEFAULT_BUBBLE_STATE);
            target.setCustomState(Scratch3LooksBlocks.STATE_KEY, bubbleState);
        }
        return bubbleState;
    }

    /**
     * Handle a target which has moved.
     * @param {RenderedTarget} target - the target which has moved.
     * @private
     */
    _onTargetMoved (target) {
        const bubbleState = this._getBubbleState(target);
        if (bubbleState.drawableId) {
            this._positionBubble(target);
        }
    }

    /**
     * Handle a target which is exiting.
     * @param {RenderedTarget} target - the target.
     * @private
     */
    _onTargetWillExit (target) {
        const bubbleState = this._getBubbleState(target);
        if (bubbleState.drawableId && bubbleState.skinId) {
            this.runtime.renderer.destroyDrawable(bubbleState.drawableId);
            this.runtime.renderer.destroySkin(bubbleState.skinId);
            bubbleState.drawableId = null;
            bubbleState.skinId = null;
            bubbleState.drawableVisible = true; // Reset back to default value
            this.runtime.requestRedraw();
        }
        target.removeListener(RenderedTarget.EVENT_TARGET_MOVED, this._onTargetMoved);
    }

    /**
     * Handle project start/stop by clearing all visible bubbles.
     * @private
     */
    _onResetBubbles () {
        for (let n = 0; n < this.runtime.targets.length; n++) {
            this._onTargetWillExit(this.runtime.targets[n]);
        }
        clearTimeout(this._bubbleTimeout);
    }

    /**
     * Position the bubble of a target. If it doesn't fit on the specified side, flip and rerender.
     * @param {!Target} target Target whose bubble needs positioning.
     * @private
     */
    _positionBubble (target) {
        const bubbleState = this._getBubbleState(target);
        const [bubbleWidth, bubbleHeight] = this.runtime.renderer.getSkinSize(bubbleState.drawableId);
        const targetBounds = target.getBounds();
        const stageBounds = this.runtime.getTargetForStage().getBounds();
        if (bubbleState.onSpriteRight && bubbleWidth + targetBounds.right > stageBounds.right &&
            (targetBounds.left - bubbleWidth > stageBounds.left)) { // Only flip if it would fit
            bubbleState.onSpriteRight = false;
            this._renderBubble(target);
        } else if (!bubbleState.onSpriteRight && targetBounds.left - bubbleWidth < stageBounds.left &&
            (bubbleWidth + targetBounds.right < stageBounds.right)) { // Only flip if it would fit
            bubbleState.onSpriteRight = true;
            this._renderBubble(target);
        } else {
            this.runtime.renderer.updateDrawableProperties(bubbleState.drawableId, {
                position: [
                    bubbleState.onSpriteRight ? (
                        Math.min(stageBounds.right - bubbleWidth, targetBounds.right)
                    ) : (
                        Math.max(stageBounds.left, targetBounds.left - bubbleWidth)
                    ),
                    Math.min(stageBounds.top, targetBounds.top + bubbleHeight)
                ]
            });
            this.runtime.requestRedraw();
        }
    }

    /**
     * Create a visible bubble for a target. If a bubble exists for the target,
     * just set it to visible and update the type/text. Otherwise create a new
     * bubble and update the relevant custom state.
     * @param {!Target} target Target who needs a bubble.
     * @return {undefined} Early return if text is empty string.
     * @private
     */
    _renderBubble (target) {
        const bubbleState = this._getBubbleState(target);
        const {drawableVisible, type, text, onSpriteRight} = bubbleState;

        // Remove the bubble if target is not visible, or text is being set to blank
        // without being initialized. See comment below about blank text optimization.
        if (!target.visible || (text === '' && !bubbleState.skinId)) {
            return this._onTargetWillExit(target);
        }

        if (bubbleState.skinId) {
            // Optimization: if text is set to blank, hide the drawable instead of
            // getting rid of it. This prevents flickering in "typewriter" projects
            if ((text === '' && drawableVisible) || (text !== '' && !drawableVisible)) {
                bubbleState.drawableVisible = text !== '';
                this.runtime.renderer.updateDrawableProperties(bubbleState.drawableId, {
                    visible: bubbleState.drawableVisible
                });
            }
            if (bubbleState.drawableVisible) {
                this.runtime.renderer.updateTextSkin(bubbleState.skinId, type, text, onSpriteRight, [0, 0]);
            }
        } else {
            target.addListener(RenderedTarget.EVENT_TARGET_MOVED, this._onTargetMoved);

            // TODO is there a way to figure out before rendering whether to default left or right?
            const targetBounds = target.getBounds();
            const stageBounds = this.runtime.getTargetForStage().getBounds();
            if (targetBounds.right + 170 > stageBounds.right) {
                bubbleState.onSpriteRight = false;
            }

            bubbleState.drawableId = this.runtime.renderer.createDrawable();
            bubbleState.skinId = this.runtime.renderer.createTextSkin(type, text, bubbleState.onSpriteRight, [0, 0]);

            this.runtime.renderer.setDrawableOrder(bubbleState.drawableId, Infinity);
            this.runtime.renderer.updateDrawableProperties(bubbleState.drawableId, {
                skinId: bubbleState.skinId
            });
        }

        this._positionBubble(target);
    }

    /**
     * The entry point for say/think blocks. Clears existing bubble if the text is empty.
     * Set the bubble custom state and then call _renderBubble.
     * @param {!Target} target Target that say/think blocks are being called on.
     * @param {!string} type Either "say" or "think"
     * @param {!string} text The text for the bubble, empty string clears the bubble.
     * @private
     */
    _updateBubble (target, type, text) {
        const bubbleState = this._getBubbleState(target);
        bubbleState.type = type;
        bubbleState.text = text;
        this._renderBubble(target);
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            looks_say: this.say,
            looks_sayforsecs: this.sayforsecs,
            looks_think: this.think,
            looks_thinkforsecs: this.thinkforsecs,
            looks_show: this.show,
            looks_hide: this.hide,
            looks_switchcostumeto: this.switchCostume,
            looks_switchbackdropto: this.switchBackdrop,
            looks_switchbackdroptoandwait: this.switchBackdropAndWait,
            looks_nextcostume: this.nextCostume,
            looks_nextbackdrop: this.nextBackdrop,
            looks_changeeffectby: this.changeEffect,
            looks_seteffectto: this.setEffect,
            looks_cleargraphiceffects: this.clearEffects,
            looks_changesizeby: this.changeSize,
            looks_setsizeto: this.setSize,
            looks_gotofrontback: this.goToFrontBack,
            looks_goforwardbackwardlayers: this.goForwardBackwardLayers,
            looks_size: this.getSize,
            looks_costumenumbername: this.getCostumeNumberName,
            looks_backdropnumbername: this.getBackdropNumberName
        };
    }

    getMonitored () {
        return {
            looks_size: {isSpriteSpecific: true},
            looks_costumenumbername: {isSpriteSpecific: true},
            looks_backdropnumbername: {}
        };
    }

    say (args, util) {
        // @TODO in 2.0 calling say/think resets the right/left bias of the bubble
        let message = args.MESSAGE;
        if (typeof message === 'number') {
            message = message.toFixed(2);
        }
        message = String(message);
        this.runtime.emit('SAY', util.target, 'say', message);
    }

    sayforsecs (args, util) {
        this.say(args, util);
        const _target = util.target;
        return new Promise(resolve => {
            this._bubbleTimeout = setTimeout(() => {
                this._bubbleTimeout = null;
                // Clear say bubble and proceed.
                this._updateBubble(_target, 'say', '');
                resolve();
            }, 1000 * args.SECS);
        });
    }

    think (args, util) {
        this._updateBubble(util.target, 'think', String(args.MESSAGE));
    }

    thinkforsecs (args, util) {
        this.think(args, util);
        const _target = util.target;
        return new Promise(resolve => {
            this._bubbleTimeout = setTimeout(() => {
                this._bubbleTimeout = null;
                // Clear say bubble and proceed.
                this._updateBubble(_target, 'think', '');
                resolve();
            }, 1000 * args.SECS);
        });
    }

    show (args, util) {
        util.target.setVisible(true);
        this._renderBubble(util.target);
    }

    hide (args, util) {
        util.target.setVisible(false);
        this._renderBubble(util.target);
    }

    /**
     * Utility function to set the costume or backdrop of a target.
     * Matches the behavior of Scratch 2.0 for different types of arguments.
     * @param {!Target} target Target to set costume/backdrop to.
     * @param {Any} requestedCostume Costume requested, e.g., 0, 'name', etc.
     * @param {boolean=} optZeroIndex Set to zero-index the requestedCostume.
     * @return {Array.<!Thread>} Any threads started by this switch.
     */
    _setCostumeOrBackdrop (target,
        requestedCostume, optZeroIndex) {
        if (typeof requestedCostume === 'number') {
            target.setCostume(optZeroIndex ?
                requestedCostume : requestedCostume - 1);
        } else {
            const costumeIndex = target.getCostumeIndexByName(requestedCostume);
            if (costumeIndex > -1) {
                target.setCostume(costumeIndex);
            } else if (requestedCostume === 'previous costume' ||
                       requestedCostume === 'previous backdrop') {
                target.setCostume(target.currentCostume - 1);
            } else if (requestedCostume === 'next costume' ||
                       requestedCostume === 'next backdrop') {
                target.setCostume(target.currentCostume + 1);
            } else {
                const forcedNumber = Number(requestedCostume);
                if (!isNaN(forcedNumber)) {
                    target.setCostume(optZeroIndex ?
                        forcedNumber : forcedNumber - 1);
                }
            }
        }
        if (target === this.runtime.getTargetForStage()) {
            // Target is the stage - start hats.
            const newName = target.sprite.costumes[target.currentCostume].name;
            return this.runtime.startHats('event_whenbackdropswitchesto', {
                BACKDROP: newName
            });
        }
        return [];
    }

    switchCostume (args, util) {
        this._setCostumeOrBackdrop(util.target, args.COSTUME);
    }

    nextCostume (args, util) {
        this._setCostumeOrBackdrop(
            util.target, util.target.currentCostume + 1, true
        );
    }

    switchBackdrop (args) {
        this._setCostumeOrBackdrop(this.runtime.getTargetForStage(), args.BACKDROP);
    }

    switchBackdropAndWait (args, util) {
        // Have we run before, starting threads?
        if (!util.stackFrame.startedThreads) {
            // No - switch the backdrop.
            util.stackFrame.startedThreads = (
                this._setCostumeOrBackdrop(
                    this.runtime.getTargetForStage(),
                    args.BACKDROP
                )
            );
            if (util.stackFrame.startedThreads.length === 0) {
                // Nothing was started.
                return;
            }
        }
        // We've run before; check if the wait is still going on.
        const instance = this;
        const waiting = util.stackFrame.startedThreads.some(thread => instance.runtime.isActiveThread(thread));
        if (waiting) {
            util.yield();
        }
    }

    nextBackdrop () {
        const stage = this.runtime.getTargetForStage();
        this._setCostumeOrBackdrop(
            stage, stage.currentCostume + 1, true
        );
    }

    changeEffect (args, util) {
        const effect = Cast.toString(args.EFFECT).toLowerCase();
        const change = Cast.toNumber(args.CHANGE);
        if (!util.target.effects.hasOwnProperty(effect)) return;
        const newValue = change + util.target.effects[effect];
        util.target.setEffect(effect, newValue);
    }

    setEffect (args, util) {
        const effect = Cast.toString(args.EFFECT).toLowerCase();
        const value = Cast.toNumber(args.VALUE);
        util.target.setEffect(effect, value);
    }

    clearEffects (args, util) {
        util.target.clearEffects();
    }

    changeSize (args, util) {
        const change = Cast.toNumber(args.CHANGE);
        util.target.setSize(util.target.size + change);
    }

    setSize (args, util) {
        const size = Cast.toNumber(args.SIZE);
        util.target.setSize(size);
    }

    goToFrontBack (args, util) {
        if (!util.target.isStage) {
            if (args.FRONT_BACK === 'front') {
                util.target.goToFront();
            } else {
                util.target.goToBack();
            }
        }
    }

    goForwardBackwardLayers (args, util) {
        if (!util.target.isStage) {
            if (args.FORWARD_BACKWARD === 'forward') {
                util.target.goForwardLayers(Cast.toNumber(args.NUM));
            } else {
                util.target.goBackwardLayers(Cast.toNumber(args.NUM));
            }
        }
    }

    getSize (args, util) {
        return Math.round(util.target.size);
    }

    getBackdropNumberName (args) {
        const stage = this.runtime.getTargetForStage();
        if (args.NUMBER_NAME === 'number') {
            return stage.currentCostume + 1;
        }
        // Else return name
        return stage.sprite.costumes[stage.currentCostume].name;
    }

    getCostumeNumberName (args, util) {
        if (args.NUMBER_NAME === 'number') {
            return util.target.currentCostume + 1;
        }
        // Else return name
        return util.target.sprite.costumes[util.target.currentCostume].name;
    }
}

module.exports = Scratch3LooksBlocks;
