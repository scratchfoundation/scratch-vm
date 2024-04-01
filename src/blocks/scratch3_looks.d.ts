export = Scratch3LooksBlocks;
/**
 * @typedef {object} BubbleState - the bubble state associated with a particular target.
 * @property {Boolean} onSpriteRight - tracks whether the bubble is right or left of the sprite.
 * @property {?int} drawableId - the ID of the associated bubble Drawable, null if none.
 * @property {string} text - the text of the bubble.
 * @property {string} type - the type of the bubble, "say" or "think"
 * @property {?string} usageId - ID indicating the most recent usage of the say/think bubble.
 *      Used for comparison when determining whether to clear a say/think bubble.
 */
declare class Scratch3LooksBlocks {
    /**
     * The default bubble state, to be used when a target has no existing bubble state.
     * @type {BubbleState}
     */
    static get DEFAULT_BUBBLE_STATE(): BubbleState;
    /**
     * The key to load & store a target's bubble-related state.
     * @type {string}
     */
    static get STATE_KEY(): string;
    /**
     * Event name for a text bubble being created or updated.
     * @const {string}
     */
    static get SAY_OR_THINK(): string;
    /**
     * Limit for say bubble string.
     * @const {string}
     */
    static get SAY_BUBBLE_LIMIT(): number;
    /**
     * Limit for ghost effect
     * @const {object}
     */
    static get EFFECT_GHOST_LIMIT(): {
        min: number;
        max: number;
    };
    /**
     * Limit for brightness effect
     * @const {object}
     */
    static get EFFECT_BRIGHTNESS_LIMIT(): {
        min: number;
        max: number;
    };
    constructor(runtime: any);
    /**
     * The runtime instantiating this block package.
     * @type {Runtime}
     */
    runtime: Runtime;
    /**
     * Handle a target which has moved.
     * @param {RenderedTarget} target - the target which has moved.
     * @private
     */
    private _onTargetChanged;
    /**
     * Handle project start/stop by clearing all visible bubbles.
     * @private
     */
    private _onResetBubbles;
    /**
     * Handle a target which is exiting.
     * @param {RenderedTarget} target - the target.
     * @private
     */
    private _onTargetWillExit;
    /**
     * The entry point for say/think blocks. Clears existing bubble if the text is empty.
     * Set the bubble custom state and then call _renderBubble.
     * @param {!Target} target Target that say/think blocks are being called on.
     * @param {!string} type Either "say" or "think"
     * @param {!string} text The text for the bubble, empty string clears the bubble.
     * @private
     */
    private _updateBubble;
    /**
     * @param {Target} target - collect bubble state for this target. Probably, but not necessarily, a RenderedTarget.
     * @returns {BubbleState} the mutable bubble state associated with that target. This will be created if necessary.
     * @private
     */
    private _getBubbleState;
    /**
     * Position the bubble of a target. If it doesn't fit on the specified side, flip and rerender.
     * @param {!Target} target Target whose bubble needs positioning.
     * @private
     */
    private _positionBubble;
    /**
     * Create a visible bubble for a target. If a bubble exists for the target,
     * just set it to visible and update the type/text. Otherwise create a new
     * bubble and update the relevant custom state.
     * @param {!Target} target Target who needs a bubble.
     * @return {undefined} Early return if text is empty string.
     * @private
     */
    private _renderBubble;
    /**
     * Properly format text for a text bubble.
     * @param {string} text The text to be formatted
     * @return {string} The formatted text
     * @private
     */
    private _formatBubbleText;
    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives(): object<string, Function>;
    getMonitored(): {
        looks_size: {
            isSpriteSpecific: boolean;
            getId: (targetId: any) => string;
        };
        looks_costumenumbername: {
            isSpriteSpecific: boolean;
            getId: (targetId: any, fields: any) => string;
        };
        looks_backdropnumbername: {
            getId: (_: any, fields: any) => string;
        };
    };
    say(args: any, util: any): void;
    sayforsecs(args: any, util: any): Promise<any>;
    _bubbleTimeout: any;
    think(args: any, util: any): void;
    thinkforsecs(args: any, util: any): Promise<any>;
    show(args: any, util: any): void;
    hide(args: any, util: any): void;
    /**
     * Utility function to set the costume of a target.
     * Matches the behavior of Scratch 2.0 for different types of arguments.
     * @param {!Target} target Target to set costume to.
     * @param {Any} requestedCostume Costume requested, e.g., 0, 'name', etc.
     * @param {boolean=} optZeroIndex Set to zero-index the requestedCostume.
     * @return {Array.<!Thread>} Any threads started by this switch.
     */
    _setCostume(target: Target, requestedCostume: Any, optZeroIndex?: boolean | undefined): Array<Thread>;
    /**
     * Utility function to set the backdrop of a target.
     * Matches the behavior of Scratch 2.0 for different types of arguments.
     * @param {!Target} stage Target to set backdrop to.
     * @param {Any} requestedBackdrop Backdrop requested, e.g., 0, 'name', etc.
     * @param {boolean=} optZeroIndex Set to zero-index the requestedBackdrop.
     * @return {Array.<!Thread>} Any threads started by this switch.
     */
    _setBackdrop(stage: Target, requestedBackdrop: Any, optZeroIndex?: boolean | undefined): Array<Thread>;
    switchCostume(args: any, util: any): void;
    nextCostume(args: any, util: any): void;
    switchBackdrop(args: any): void;
    switchBackdropAndWait(args: any, util: any): void;
    nextBackdrop(): void;
    clampEffect(effect: any, value: any): any;
    changeEffect(args: any, util: any): void;
    setEffect(args: any, util: any): void;
    clearEffects(args: any, util: any): void;
    changeSize(args: any, util: any): void;
    setSize(args: any, util: any): void;
    goToFrontBack(args: any, util: any): void;
    goForwardBackwardLayers(args: any, util: any): void;
    getSize(args: any, util: any): number;
    getBackdropNumberName(args: any): any;
    getCostumeNumberName(args: any, util: any): any;
}
declare namespace Scratch3LooksBlocks {
    export { BubbleState };
}
/**
 * - the bubble state associated with a particular target.
 */
type BubbleState = {
    /**
     * - tracks whether the bubble is right or left of the sprite.
     */
    onSpriteRight: boolean;
    /**
     * - the ID of the associated bubble Drawable, null if none.
     */
    drawableId: int;
    /**
     * - the text of the bubble.
     */
    text: string;
    /**
     * - the type of the bubble, "say" or "think"
     */
    type: string;
    /**
     * - ID indicating the most recent usage of the say/think bubble.
     * Used for comparison when determining whether to clear a say/think bubble.
     */
    usageId: string | null;
};
