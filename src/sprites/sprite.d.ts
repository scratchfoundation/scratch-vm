export = Sprite;
declare class Sprite {
    /**
     * Sprite to be used on the Scratch stage.
     * All clones of a sprite have shared blocks, shared costumes, shared variables,
     * shared sounds, etc.
     * @param {?Blocks} blocks Shared blocks object for all clones of sprite.
     * @param {Runtime} runtime Reference to the runtime.
     * @constructor
     */
    constructor(blocks: Blocks | null, runtime: Runtime);
    runtime: Runtime;
    blocks: Blocks;
    /**
     * Human-readable name for this sprite (and all clones).
     * @type {string}
     */
    name: string;
    /**
     * List of costumes for this sprite.
     * Each entry is an object, e.g.,
     * {
     *      skinId: 1,
     *      name: "Costume Name",
     *      bitmapResolution: 2,
     *      rotationCenterX: 0,
     *      rotationCenterY: 0
     * }
     * @type {Array.<!Object>}
     */
    costumes_: Array<any>;
    /**
     * List of sounds for this sprite.
    */
    sounds: any[];
    /**
     * List of clones for this sprite, including the original.
     * @type {Array.<!RenderedTarget>}
     */
    clones: Array<RenderedTarget>;
    soundBank: any;
    /**
     * Add an array of costumes, taking care to avoid duplicate names.
     * @param {!Array<object>} costumes Array of objects representing costumes.
     */
    set costumes(costumes: any[]);
    /**
     * Get full costume list
     * @return {object[]} list of costumes. Note that mutating the returned list will not
     *     mutate the list on the sprite. The sprite list should be mutated by calling
     *     addCostumeAt, deleteCostumeAt, or setting costumes.
     */
    get costumes(): any[];
    /**
     * Add a costume at the given index, taking care to avoid duplicate names.
     * @param {!object} costumeObject Object representing the costume.
     * @param {!int} index Index at which to add costume
     */
    addCostumeAt(costumeObject: object, index: int): void;
    /**
     * Delete a costume by index.
     * @param {number} index Costume index to be deleted
     * @return {?object} The deleted costume
     */
    deleteCostumeAt(index: number): object | null;
    /**
     * Create a clone of this sprite.
     * @param {string=} optLayerGroup Optional layer group the clone's drawable should be added to
     * Defaults to the sprite layer group
     * @returns {!RenderedTarget} Newly created clone.
     */
    createClone(optLayerGroup?: string | undefined): RenderedTarget;
    /**
     * Disconnect a clone from this sprite. The clone is unmodified.
     * In particular, the clone's dispose() method is not called.
     * @param {!RenderedTarget} clone - the clone to be removed.
     */
    removeClone(clone: RenderedTarget): void;
    duplicate(): Promise<Sprite>;
    dispose(): void;
}
import Blocks = require("../engine/blocks");
import RenderedTarget = require("./rendered-target");
