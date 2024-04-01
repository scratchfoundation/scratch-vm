export = RenderedTarget;
/**
 * Rendered target: instance of a sprite (clone), or the stage.
 */
declare class RenderedTarget extends Target {
    /**
     * Event which fires when a target moves.
     * @type {string}
     */
    static get EVENT_TARGET_MOVED(): string;
    /**
     * Event which fires when a target changes visually, for updating say bubbles.
     * @type {string}
     */
    static get EVENT_TARGET_VISUAL_CHANGE(): string;
    /**
     * Rotation style for "all around"/spinning.
     * @type {string}
     */
    static get ROTATION_STYLE_ALL_AROUND(): string;
    /**
     * Rotation style for "left-right"/flipping.
     * @type {string}
     */
    static get ROTATION_STYLE_LEFT_RIGHT(): string;
    /**
     * Rotation style for "no rotation."
     * @type {string}
     */
    static get ROTATION_STYLE_NONE(): string;
    /**
     * Available states for video input.
     * @enum {string}
     */
    static get VIDEO_STATE(): {
        OFF: string;
        ON: string;
        ON_FLIPPED: string;
    };
    /**
     * @param {!Sprite} sprite Reference to the parent sprite.
     * @param {Runtime} runtime Reference to the runtime.
     * @constructor
     */
    constructor(sprite: Sprite, runtime: Runtime);
    /**
     * Reference to the sprite that this is a render of.
     * @type {!import("./sprite")}
     */
    sprite: import("./sprite");
    /**
     * Reference to the global renderer for this VM, if one exists.
     * @type {?RenderWebGL}
     */
    renderer: RenderWebGL;
    /**
     * ID of the drawable for this rendered target,
     * returned by the renderer, if rendered.
     * @type {?Number}
     */
    drawableID: number | null;
    /**
     * Drag state of this rendered target. If true, x/y position can't be
     * changed by blocks.
     * @type {boolean}
     */
    dragging: boolean;
    /**
     * Map of current graphic effect values.
     * @type {!Object.<string, number>}
     */
    effects: {
        [x: string]: number;
    };
    /**
     * Whether this represents an "original" non-clone rendered-target for a sprite,
     * i.e., created by the editor and not clone blocks.
     * @type {boolean}
     */
    isOriginal: boolean;
    /**
     * Whether this rendered target represents the Scratch stage.
     * @type {boolean}
     */
    isStage: boolean;
    /**
     * Scratch X coordinate. Currently should range from -240 to 240.
     * @type {Number}
     */
    x: number;
    /**
     * Scratch Y coordinate. Currently should range from -180 to 180.
     * @type {number}
     */
    y: number;
    /**
     * Scratch direction. Currently should range from -179 to 180.
     * @type {number}
     */
    direction: number;
    /**
     * Whether the rendered target is draggable on the stage
     * @type {boolean}
     */
    draggable: boolean;
    /**
     * Whether the rendered target is currently visible.
     * @type {boolean}
     */
    visible: boolean;
    /**
     * Size of rendered target as a percent of costume size.
     * @type {number}
     */
    size: number;
    /**
     * Currently selected costume index.
     * @type {number}
     */
    currentCostume: number;
    /**
     * Current rotation style.
     * @type {!string}
     */
    rotationStyle: string;
    /**
     * Loudness for sound playback for this target, as a percentage.
     * @type {number}
     */
    volume: number;
    /**
     * Current tempo (used by the music extension).
     * This property is global to the project and stored in the stage.
     * @type {number}
     */
    tempo: number;
    /**
     * The transparency of the video (used by extensions with camera input).
     * This property is global to the project and stored in the stage.
     * @type {number}
     */
    videoTransparency: number;
    /**
     * The state of the video input (used by extensions with camera input).
     * This property is global to the project and stored in the stage.
     *
     * Defaults to ON. This setting does not turn the video by itself. A
     * video extension once loaded will set the video device to this
     * setting. Set to ON when a video extension is added in the editor the
     * video will start ON. If the extension is loaded as part of loading a
     * saved project the extension will see the value set when the stage
     * was loaded from the saved values including the video state.
     *
     * @type {string}
     */
    videoState: string;
    /**
     * The language to use for speech synthesis, in the text2speech extension.
     * It is initialized to null so that on extension load, we can check for
     * this and try setting it using the editor locale.
     * @type {string}
     */
    textToSpeechLanguage: string;
    /**
     * Create a drawable with the this.renderer.
     * @param {boolean} layerGroup The layer group this drawable should be added to
     */
    initDrawable(layerGroup: boolean): void;
    get audioPlayer(): {
        playSound: (soundId: any) => any;
    };
    /**
     * Initialize the audio player for this sprite or clone.
     */
    initAudio(): void;
    /**
     * Set the X and Y coordinates.
     * @param {!number} x New X coordinate, in Scratch coordinates.
     * @param {!number} y New Y coordinate, in Scratch coordinates.
     * @param {?boolean} force Force setting X/Y, in case of dragging
     */
    setXY(x: number, y: number, force: boolean | null): void;
    /**
     * Get the rendered direction and scale, after applying rotation style.
     * @return {object<string, number>} Direction and scale to render.
     */
    _getRenderedDirectionAndScale(): object;
    /**
     * Set the direction.
     * @param {!number} direction New direction.
     */
    setDirection(direction: number): void;
    /**
     * Set draggability; i.e., whether it's able to be dragged in the player
     * @param {!boolean} draggable True if should be draggable.
     */
    setDraggable(draggable: boolean): void;
    /**
     * Set a say bubble.
     * @param {?string} type Type of say bubble: "say", "think", or null.
     * @param {?string} message Message to put in say bubble.
     */
    setSay(type: string | null, message: string | null): void;
    /**
     * Set visibility; i.e., whether it's shown or hidden.
     * @param {!boolean} visible True if should be shown.
     */
    setVisible(visible: boolean): void;
    /**
     * Set size, as a percentage of the costume size.
     * @param {!number} size Size of rendered target, as % of costume size.
     */
    setSize(size: number): void;
    /**
     * Set a particular graphic effect value.
     * @param {!string} effectName Name of effect (see `RenderedTarget.prototype.effects`).
     * @param {!number} value Numerical magnitude of effect.
     */
    setEffect(effectName: string, value: number): void;
    /**
     * Clear all graphic effects on this rendered target.
     */
    clearEffects(): void;
    /**
     * Set the current costume.
     * @param {number} index New index of costume.
     */
    setCostume(index: number): void;
    /**
     * Add a costume, taking care to avoid duplicate names.
     * @param {!object} costumeObject Object representing the costume.
     * @param {?int} index Index at which to add costume
     */
    addCostume(costumeObject: object, index: int): void;
    /**
     * Rename a costume, taking care to avoid duplicate names.
     * @param {int} costumeIndex - the index of the costume to be renamed.
     * @param {string} newName - the desired new name of the costume (will be modified if already in use).
     */
    renameCostume(costumeIndex: int, newName: string): void;
    /**
     * Delete a costume by index.
     * @param {number} index Costume index to be deleted
     * @return {?object} The costume that was deleted or null
     * if the index was out of bounds of the costumes list or
     * this target only has one costume.
     */
    deleteCostume(index: number): object | null;
    /**
     * Add a sound, taking care to avoid duplicate names.
     * @param {!object} soundObject Object representing the sound.
     * @param {?int} index Index at which to add costume
     */
    addSound(soundObject: object, index: int): void;
    /**
     * Rename a sound, taking care to avoid duplicate names.
     * @param {int} soundIndex - the index of the sound to be renamed.
     * @param {string} newName - the desired new name of the sound (will be modified if already in use).
     */
    renameSound(soundIndex: int, newName: string): void;
    /**
     * Delete a sound by index.
     * @param {number} index Sound index to be deleted
     * @return {object} The deleted sound object, or null if no sound was deleted.
     */
    deleteSound(index: number): object;
    /**
     * Update the rotation style.
     * @param {!string} rotationStyle New rotation style.
     */
    setRotationStyle(rotationStyle: string): void;
    /**
     * Get a costume index of this rendered target, by name of the costume.
     * @param {?string} costumeName Name of a costume.
     * @return {number} Index of the named costume, or -1 if not present.
     */
    getCostumeIndexByName(costumeName: string | null): number;
    /**
     * Get a costume of this rendered target by id.
     * @return {object} current costume
     */
    getCurrentCostume(): object;
    /**
     * Get full costume list
     * @return {object[]} list of costumes
     */
    getCostumes(): object[];
    /**
     * Reorder costume list by moving costume at costumeIndex to newIndex.
     * @param {!number} costumeIndex Index of the costume to move.
     * @param {!number} newIndex New index for that costume.
     * @returns {boolean} If a change occurred (i.e. if the indices do not match)
     */
    reorderCostume(costumeIndex: number, newIndex: number): boolean;
    /**
     * Reorder sound list by moving sound at soundIndex to newIndex.
     * @param {!number} soundIndex Index of the sound to move.
     * @param {!number} newIndex New index for that sound.
     * @returns {boolean} If a change occurred (i.e. if the indices do not match)
     */
    reorderSound(soundIndex: number, newIndex: number): boolean;
    /**
     * Get full sound list
     * @return {object[]} list of sounds
     */
    getSounds(): object[];
    /**
     * Update all drawable properties for this rendered target.
     * Use when a batch has changed, e.g., when the drawable is first created.
     */
    updateAllDrawableProperties(): void;
    /**
     * Return whether this rendered target is a sprite (not a clone, not the stage).
     * @return {boolean} True if not a clone and not the stage.
     */
    isSprite(): boolean;
    /**
     * Return the rendered target's tight bounding box.
     * Includes top, left, bottom, right attributes in Scratch coordinates.
     * @return {?object} Tight bounding box, or null.
     */
    getBounds(): object | null;
    /**
     * Return the bounding box around a slice of the top 8px of the rendered target.
     * Includes top, left, bottom, right attributes in Scratch coordinates.
     * @return {?object} Tight bounding box, or null.
     */
    getBoundsForBubble(): object | null;
    /**
     * Return whether this target is touching the mouse, an edge, or a sprite.
     * @param {string} requestedObject an id for mouse or edge, or a sprite name.
     * @return {boolean} True if the sprite is touching the object.
     */
    isTouchingObject(requestedObject: string): boolean;
    /**
     * Return whether touching a point.
     * @param {number} x X coordinate of test point.
     * @param {number} y Y coordinate of test point.
     * @return {boolean} True iff the rendered target is touching the point.
     */
    isTouchingPoint(x: number, y: number): boolean;
    /**
     * Return whether touching a stage edge.
     * @return {boolean} True iff the rendered target is touching the stage edge.
     */
    isTouchingEdge(): boolean;
    /**
     * Return whether touching any of a named sprite's clones.
     * @param {string} spriteName Name of the sprite.
     * @return {boolean} True iff touching a clone of the sprite.
     */
    isTouchingSprite(spriteName: string): boolean;
    /**
     * Return whether touching a color.
     * @param {Array.<number>} rgb [r,g,b], values between 0-255.
     * @return {Promise.<boolean>} True iff the rendered target is touching the color.
     */
    isTouchingColor(rgb: Array<number>): Promise<boolean>;
    /**
     * Return whether rendered target's color is touching a color.
     * @param {object} targetRgb {Array.<number>} [r,g,b], values between 0-255.
     * @param {object} maskRgb {Array.<number>} [r,g,b], values between 0-255.
     * @return {Promise.<boolean>} True iff the color is touching the color.
     */
    colorIsTouchingColor(targetRgb: object, maskRgb: object): Promise<boolean>;
    getLayerOrder(): any;
    /**
     * Move to the front layer.
     */
    goToFront(): void;
    /**
     * Move to the back layer.
     */
    goToBack(): void;
    /**
     * Move forward a number of layers.
     * @param {number} nLayers How many layers to go forward.
     */
    goForwardLayers(nLayers: number): void;
    /**
     * Move backward a number of layers.
     * @param {number} nLayers How many layers to go backward.
     */
    goBackwardLayers(nLayers: number): void;
    /**
     * Move behind some other rendered target.
     * @param {!RenderedTarget} other Other rendered target to move behind.
     */
    goBehindOther(other: RenderedTarget): void;
    /**
     * Keep a desired position within a fence.
     * @param {number} newX New desired X position.
     * @param {number} newY New desired Y position.
     * @param {object=} optFence Optional fence with left, right, top bottom.
     * @return {Array.<number>} Fenced X and Y coordinates.
     */
    keepInFence(newX: number, newY: number, optFence?: object | undefined): Array<number>;
    /**
     * Make a clone, copying any run-time properties.
     * If we've hit the global clone limit, returns null.
     * @return {RenderedTarget} New clone.
     */
    makeClone(): RenderedTarget;
    /**
     * Make a duplicate using a duplicate sprite.
     * @return {RenderedTarget} New clone.
     */
    duplicate(): RenderedTarget;
    /**
     * Called when the project receives a "stop all"
     * Stop all sounds and clear graphic effects.
     */
    onStopAll(): void;
    /**
     * Post/edit sprite info.
     * @param {object} data An object with sprite info data to set.
     */
    postSpriteInfo(data: object): void;
    /**
     * Put the sprite into the drag state. While in effect, setXY must be forced
     */
    startDrag(): void;
    /**
     * Remove the sprite from the drag state.
     */
    stopDrag(): void;
    /**
     * Serialize sprite info, used when emitting events about the sprite
     * @returns {object} Sprite data as a simple object
     */
    toJSON(): object;
}
import Target = require("../engine/target");
