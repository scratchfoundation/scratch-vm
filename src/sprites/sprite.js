var RenderedTarget = require('./rendered-target');
var Blocks = require('../engine/blocks');

/**
 * Sprite to be used on the Scratch stage.
 * All clones of a sprite have shared blocks, shared costumes, shared variables.
 * @param {?Blocks} blocks Shared blocks object for all clones of sprite.
 * @param {Runtime} runtime Reference to the runtime.
 * @constructor
 */
var Sprite = function (blocks, runtime) {
    this.runtime = runtime;
    if (!blocks) {
        // Shared set of blocks for all clones.
        blocks = new Blocks();
    }
    this.blocks = blocks;
    /**
     * Human-readable name for this sprite (and all clones).
     * @type {string}
     */
    this.name = '';
    /**
     * List of costumes for this sprite.
     * Each entry is an object, e.g.,
     * {
     *      skin: "costume.svg",
     *      name: "Costume Name",
     *      bitmapResolution: 2,
     *      rotationCenterX: 0,
     *      rotationCenterY: 0
     * }
     * @type {Array.<!Object>}
     */
    this.costumes = [];
    /**
     * List of clones for this sprite, including the original.
     * @type {Array.<!RenderedTarget>}
     */
    this.clones = [];
};

/**
 * Create a clone of this sprite.
 * @returns {!Clone} Newly created clone.
 */
Sprite.prototype.createClone = function () {
    var newClone = new RenderedTarget(this, this.runtime);
    newClone.isOriginal = this.clones.length === 0;
    this.clones.push(newClone);
    if (newClone.isOriginal) {
        newClone.initDrawable();
    }
    return newClone;
};

module.exports = Sprite;
