const Cast = require('../util/cast');
const Clone = require('../util/clone');

const RenderedTarget = require('../sprites/rendered-target');

/**
 * @typedef {object} BubbleState - the bubble state associated with a particular target.
 * @property {Boolean} onSpriteRight - tracks whether the bubble is right or left of the sprite.
 * @property {?int} drawableId - the ID of the associated bubble Drawable, null if none.
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
    }

    /**
     * The default bubble state, to be used when a target has no existing bubble state.
     * @type {BubbleState}
     */
    static get DEFAULT_BUBBLE_STATE () {
        return {
            drawableId: null,
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
     * @param {Target} target - collect bubble state for this target. Probably, but not necessarily, a RenderedTarget.
     * @private
     */
    _resetBubbleState (target) {
        const defaultBubbleState = Clone.simple(Scratch3LooksBlocks.DEFAULT_BUBBLE_STATE);
        target.setCustomState(Scratch3LooksBlocks.STATE_KEY, defaultBubbleState);
    }

    /**
     * Handle a target which has moved. This only fires when the bubble is visible.
     * @param {RenderedTarget} target - the target which has moved.
     * @private
     */
    _onTargetMoved (target) {
        const bubbleState = this._getBubbleState(target);

        if (bubbleState.drawableId) {
            this._checkBubbleBounds(target);
            this._positionBubble(target);
        }
    }

    _positionBubble (target) {
        const bubbleState = this._getBubbleState(target);
        const [bubbleWidth, bubbleHeight] = this.runtime.renderer.getSkinSize(bubbleState.drawableId);
        const targetBounds = target.getBounds();
        const stageBounds = this.runtime.getTargetForStage().getBounds();

        this.runtime.renderer.updateDrawableProperties(bubbleState.drawableId, {
            position: [
                bubbleState.onSpriteRight ? targetBounds.right : targetBounds.left - bubbleWidth,
                Math.min(stageBounds.top, targetBounds.top + bubbleHeight)
            ]
        });

        this.runtime.requestRedraw();
    }

    _checkBubbleBounds (target) {
        const bubbleState = this._getBubbleState(target);
        const [bubbleWidth, _] = this.runtime.renderer.getSkinSize(bubbleState.drawableId);
        const targetBounds = target.getBounds();
        const stageBounds = this.runtime.getTargetForStage().getBounds();
        if (bubbleState.onSpriteRight && bubbleWidth + targetBounds.right > stageBounds.right) {
            bubbleState.onSpriteRight = false;
            this._renderBubble(target);
        } else if (!bubbleState.onSpriteRight && targetBounds.left - bubbleWidth < stageBounds.left) {
            bubbleState.onSpriteRight = true;
            this._renderBubble(target);
        }
    }

    _renderBubble (target) {
        const bubbleState = this._getBubbleState(target);
        const {type, text, onSpriteRight} = bubbleState;

        if (bubbleState.skinId) {
            this.runtime.renderer.updateTextSkin(bubbleState.skinId, type, text, onSpriteRight, [0, 0]);
        } else {
            target.addListener(RenderedTarget.EVENT_TARGET_MOVED, this._onTargetMoved);

            bubbleState.drawableId = this.runtime.renderer.createDrawable();
            bubbleState.skinId = this.runtime.renderer.createTextSkin(type, text, bubbleState.onSpriteRight, [0, 0]);

            const order = this.runtime.renderer.getDrawableOrder(target.drawableID);
            this.runtime.renderer.setDrawableOrder(bubbleState.drawableId, order + 1);
            this.runtime.renderer.updateDrawableProperties(bubbleState.drawableId, {
                skinId: bubbleState.skinId
            });

            this._checkBubbleBounds(target);
        }

        this._positionBubble(target);
    }
    _updateBubble (target, type, text) {
        const bubbleState = this._getBubbleState(target);
        bubbleState.type = type;
        bubbleState.text = text;

        this._renderBubble(target);
    }

    _clearBubble (target) {
        const bubbleState = this._getBubbleState(target);
        if (bubbleState.drawableId) {
            this.runtime.renderer.destroyDrawable(bubbleState.drawableId);
        }
        if (bubbleState.drawableId) {
            this.runtime.renderer.destroySkin(bubbleState.skinId);
        }
        this._resetBubbleState(target);

        // @TODO is this safe? It could have been already removed?
        target.removeListener(RenderedTarget.EVENT_TARGET_MOVED, this._onTargetMoved);

        this.runtime.requestRedraw();
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
            looks_gotofront: this.goToFront,
            looks_gobacklayers: this.goBackLayers,
            looks_size: this.getSize,
            looks_costumeorder: this.getCostumeIndex,
            looks_backdroporder: this.getBackdropIndex,
            looks_backdropname: this.getBackdropName
        };
    }

    say (args, util) {
        // @TODO in 2.0 calling say/think resets the right/left bias of the bubble
        this._updateBubble(util.target, 'say', args.MESSAGE);
    }

    sayforsecs (args, util) {
        this.say(args, util);
        return new Promise(resolve => {
            setTimeout(() => {
                // Clear say bubble and proceed.
                this._clearBubble(util.target);
                resolve();
            }, 1000 * args.SECS);
        });
    }

    think (args, util) {
        this._updateBubble(util.target, 'think', args.MESSAGE);
    }

    thinkforsecs (args, util) {
        this.think(args, util);
        return new Promise(resolve => {
            setTimeout(() => {
                // Clear say bubble and proceed.
                this._clearBubble(util.target);
                resolve();
            }, 1000 * args.SECS);
        });
    }

    show (args, util) {
        util.target.setVisible(true);
    }

    hide (args, util) {
        util.target.setVisible(false);
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

    goToFront (args, util) {
        util.target.goToFront();
    }

    goBackLayers (args, util) {
        util.target.goBackLayers(args.NUM);
    }

    getSize (args, util) {
        return Math.round(util.target.size);
    }

    getBackdropIndex () {
        const stage = this.runtime.getTargetForStage();
        return stage.currentCostume + 1;
    }

    getBackdropName () {
        const stage = this.runtime.getTargetForStage();
        return stage.sprite.costumes[stage.currentCostume].name;
    }

    getCostumeIndex (args, util) {
        return util.target.currentCostume + 1;
    }
}

module.exports = Scratch3LooksBlocks;
