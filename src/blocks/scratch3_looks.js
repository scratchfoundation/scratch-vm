const Cast = require('../util/cast');
const Clone = require('../util/clone');
const RenderedTarget = require('../sprites/rendered-target');
const uid = require('../util/uid');
const StageLayering = require('../engine/stage-layering');

/**
 * @typedef {object} BubbleState - the bubble state associated with a particular target.
 * @property {Boolean} onSpriteRight - tracks whether the bubble is right or left of the sprite.
 * @property {?int} drawableId - the ID of the associated bubble Drawable, null if none.
 * @property {string} text - the text of the bubble.
 * @property {string} type - the type of the bubble, "say" or "think"
 * @property {?string} usageId - ID indicating the most recent usage of the say/think bubble.
 *      Used for comparison when determining whether to clear a say/think bubble.
 */

class Scratch3LooksBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        this._onTargetChanged = this._onTargetChanged.bind(this);
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
            onSpriteRight: true,
            skinId: null,
            text: '',
            type: 'say',
            usageId: null
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
     * Limit for say bubble string.
     * @const {string}
     */
    static get SAY_BUBBLE_LIMIT () {
        return 330;
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
    _onTargetChanged (target) {
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
            this.runtime.renderer.destroyDrawable(bubbleState.drawableId, StageLayering.SPRITE_LAYER);
            this.runtime.renderer.destroySkin(bubbleState.skinId);
            bubbleState.drawableId = null;
            bubbleState.skinId = null;
            this.runtime.requestRedraw();
        }
        target.removeListener(RenderedTarget.EVENT_TARGET_VISUAL_CHANGE, this._onTargetChanged);
    }

    /**
     * Handle project start/stop by clearing all visible bubbles.
     * @private
     */
    _onResetBubbles () {
        for (let n = 0; n < this.runtime.targets.length; n++) {
            const bubbleState = this._getBubbleState(this.runtime.targets[n]);
            bubbleState.text = '';
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
        if (!target.visible) return;
        const bubbleState = this._getBubbleState(target);
        const [bubbleWidth, bubbleHeight] = this.runtime.renderer.getCurrentSkinSize(bubbleState.drawableId);
        let targetBounds;
        try {
            targetBounds = target.getBoundsForBubble();
        } catch (error_) {
            // Bounds calculation could fail (e.g. on empty costumes), in that case
            // use the x/y position of the target.
            targetBounds = {
                left: target.x,
                right: target.x,
                top: target.y,
                bottom: target.y
            };
        }
        const stageSize = this.runtime.renderer.getNativeSize();
        const stageBounds = {
            left: -stageSize[0] / 2,
            right: stageSize[0] / 2,
            top: stageSize[1] / 2,
            bottom: -stageSize[1] / 2
        };
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
                        Math.max(
                            stageBounds.left, // Bubble should not extend past left edge of stage
                            Math.min(stageBounds.right - bubbleWidth, targetBounds.right)
                        )
                    ) : (
                        Math.min(
                            stageBounds.right - bubbleWidth, // Bubble should not extend past right edge of stage
                            Math.max(stageBounds.left, targetBounds.left - bubbleWidth)
                        )
                    ),
                    // Bubble should not extend past the top of the stage
                    Math.min(stageBounds.top, targetBounds.bottom + bubbleHeight)
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
        if (!this.runtime.renderer) return;

        const bubbleState = this._getBubbleState(target);
        const {type, text, onSpriteRight} = bubbleState;

        // Remove the bubble if target is not visible, or text is being set to blank.
        if (!target.visible || text === '') {
            this._onTargetWillExit(target);
            return;
        }

        if (bubbleState.skinId) {
            this.runtime.renderer.updateTextSkin(bubbleState.skinId, type, text, onSpriteRight, [0, 0]);
        } else {
            target.addListener(RenderedTarget.EVENT_TARGET_VISUAL_CHANGE, this._onTargetChanged);
            bubbleState.drawableId = this.runtime.renderer.createDrawable(StageLayering.SPRITE_LAYER);
            bubbleState.skinId = this.runtime.renderer.createTextSkin(type, text, bubbleState.onSpriteRight, [0, 0]);
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
        bubbleState.usageId = uid();
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
            looks_hideallsprites: () => {}, // legacy no-op block
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
            looks_changestretchby: () => {}, // legacy no-op blocks
            looks_setstretchto: () => {},
            looks_gotofrontback: this.goToFrontBack,
            looks_goforwardbackwardlayers: this.goForwardBackwardLayers,
            looks_size: this.getSize,
            looks_costumenumbername: this.getCostumeNumberName,
            looks_backdropnumbername: this.getBackdropNumberName
        };
    }

    getMonitored () {
        return {
            looks_size: {
                isSpriteSpecific: true,
                getId: targetId => `${targetId}_size`
            },
            looks_costumenumbername: {
                isSpriteSpecific: true,
                getId: targetId => `${targetId}_costumenumbername`
            },
            looks_backdropnumbername: {
                getId: () => 'backdropnumbername'
            }
        };
    }

    say (args, util) {
        // @TODO in 2.0 calling say/think resets the right/left bias of the bubble
        let message = args.MESSAGE;
        if (typeof message === 'number') {
            message = parseFloat(message.toFixed(2));
        }
        message = String(message).substr(0, Scratch3LooksBlocks.SAY_BUBBLE_LIMIT);
        this.runtime.emit('SAY', util.target, 'say', message);
    }

    sayforsecs (args, util) {
        this.say(args, util);
        const target = util.target;
        const usageId = this._getBubbleState(target).usageId;
        return new Promise(resolve => {
            this._bubbleTimeout = setTimeout(() => {
                this._bubbleTimeout = null;
                // Clear say bubble if it hasn't been changed and proceed.
                if (this._getBubbleState(target).usageId === usageId) {
                    this._updateBubble(target, 'say', '');
                }
                resolve();
            }, 1000 * args.SECS);
        });
    }

    think (args, util) {
        this._updateBubble(util.target, 'think', String(args.MESSAGE).substr(0, Scratch3LooksBlocks.SAY_BUBBLE_LIMIT));
    }

    thinkforsecs (args, util) {
        this.think(args, util);
        const target = util.target;
        const usageId = this._getBubbleState(target).usageId;
        return new Promise(resolve => {
            this._bubbleTimeout = setTimeout(() => {
                this._bubbleTimeout = null;
                // Clear think bubble if it hasn't been changed and proceed.
                if (this._getBubbleState(target).usageId === usageId) {
                    this._updateBubble(target, 'think', '');
                }
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
     * Utility function to set the costume of a target.
     * Matches the behavior of Scratch 2.0 for different types of arguments.
     * @param {!Target} target Target to set costume to.
     * @param {Any} requestedCostume Costume requested, e.g., 0, 'name', etc.
     * @param {boolean=} optZeroIndex Set to zero-index the requestedCostume.
     * @return {Array.<!Thread>} Any threads started by this switch.
     */
    _setCostume (target, requestedCostume, optZeroIndex) {
        if (typeof requestedCostume === 'number') {
            // Numbers should be treated as costume indices, always
            target.setCostume(optZeroIndex ? requestedCostume : requestedCostume - 1);
        } else {
            // Strings should be treated as costume names, where possible
            const costumeIndex = target.getCostumeIndexByName(requestedCostume.toString());

            if (costumeIndex !== -1) {
                target.setCostume(costumeIndex);
            } else if (requestedCostume === 'next costume') {
                target.setCostume(target.currentCostume + 1);
            } else if (requestedCostume === 'previous costume') {
                target.setCostume(target.currentCostume - 1);
            // Try to cast the string to a number (and treat it as a costume index)
            // Pure whitespace should not be treated as a number
            // Note: isNaN will cast the string to a number before checking if it's NaN
            } else if (!(isNaN(requestedCostume) || Cast.isWhiteSpace(requestedCostume))) {
                target.setCostume(optZeroIndex ? Number(requestedCostume) : Number(requestedCostume) - 1);
            }
        }

        // Per 2.0, 'switch costume' can't start threads even in the Stage.
        return [];
    }

    /**
     * Utility function to set the backdrop of a target.
     * Matches the behavior of Scratch 2.0 for different types of arguments.
     * @param {!Target} stage Target to set backdrop to.
     * @param {Any} requestedBackdrop Backdrop requested, e.g., 0, 'name', etc.
     * @param {boolean=} optZeroIndex Set to zero-index the requestedBackdrop.
     * @return {Array.<!Thread>} Any threads started by this switch.
     */
    _setBackdrop (stage, requestedBackdrop, optZeroIndex) {
        if (typeof requestedBackdrop === 'number') {
            // Numbers should be treated as backdrop indices, always
            stage.setCostume(optZeroIndex ? requestedBackdrop : requestedBackdrop - 1);
        } else {
            // Strings should be treated as backdrop names where possible
            const costumeIndex = stage.getCostumeIndexByName(requestedBackdrop.toString());

            if (costumeIndex !== -1) {
                stage.setCostume(costumeIndex);
            } else if (requestedBackdrop === 'next backdrop') {
                stage.setCostume(stage.currentCostume + 1);
            } else if (requestedBackdrop === 'previous backdrop') {
                stage.setCostume(stage.currentCostume - 1);
            } else if (requestedBackdrop === 'random backdrop') {
                // Don't pick the current backdrop, so that the block
                // will always have an observable effect.
                const numCostumes = stage.getCostumes().length;
                if (numCostumes > 1) {
                    let selectedIndex = Math.floor(Math.random() * (numCostumes - 1));
                    if (selectedIndex === stage.currentCostume) selectedIndex += 1;
                    stage.setCostume(selectedIndex);
                }
            // Try to cast the string to a number (and treat it as a costume index)
            // Pure whitespace should not be treated as a number
            // Note: isNaN will cast the string to a number before checking if it's NaN
            } else if (!(isNaN(requestedBackdrop) || Cast.isWhiteSpace(requestedBackdrop))) {
                stage.setCostume(optZeroIndex ? Number(requestedBackdrop) : Number(requestedBackdrop) - 1);
            }
        }

        const newName = stage.getCostumes()[stage.currentCostume].name;
        return this.runtime.startHats('event_whenbackdropswitchesto', {
            BACKDROP: newName
        });
    }

    switchCostume (args, util) {
        this._setCostume(util.target, args.COSTUME);
    }

    nextCostume (args, util) {
        this._setCostume(
            util.target, util.target.currentCostume + 1, true
        );
    }

    switchBackdrop (args) {
        this._setBackdrop(this.runtime.getTargetForStage(), args.BACKDROP);
    }

    switchBackdropAndWait (args, util) {
        // Have we run before, starting threads?
        if (!util.stackFrame.startedThreads) {
            // No - switch the backdrop.
            util.stackFrame.startedThreads = (
                this._setBackdrop(
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
        // Scratch 2 considers threads to be waiting if they are still in
        // runtime.threads. Threads that have run all their blocks, or are
        // marked done but still in runtime.threads are still considered to
        // be waiting.
        const waiting = util.stackFrame.startedThreads
            .some(thread => instance.runtime.threads.indexOf(thread) !== -1);
        if (waiting) {
            // If all threads are waiting for the next tick or later yield
            // for a tick as well. Otherwise yield until the next loop of
            // the threads.
            if (
                util.stackFrame.startedThreads
                    .every(thread => instance.runtime.isWaitingThread(thread))
            ) {
                util.yieldTick();
            } else {
                util.yield();
            }
        }
    }

    nextBackdrop () {
        const stage = this.runtime.getTargetForStage();
        this._setBackdrop(
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
        return stage.getCostumes()[stage.currentCostume].name;
    }

    getCostumeNumberName (args, util) {
        if (args.NUMBER_NAME === 'number') {
            return util.target.currentCostume + 1;
        }
        // Else return name
        return util.target.getCostumes()[util.target.currentCostume].name;
    }
}

module.exports = Scratch3LooksBlocks;
