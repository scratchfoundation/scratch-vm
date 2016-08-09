var Clone = require('./clone');
var Blocks = require('../engine/blocks');

/**
 * Sprite to be used on the Scratch stage.
 * All clones of a sprite have shared blocks, shared costumes, shared variables.
 * @param {?Blocks} blocks Shared blocks object for all clones of sprite.
 * @constructor
 */
function Sprite (blocks) {
    if (!blocks) {
        // Shared set of blocks for all clones.
        blocks = new Blocks();
    }
    this.blocks = blocks;
    this.clones = [];
}

/**
 * Create a clone of this sprite.
 * @returns {!Clone} Newly created clone.
 */
Sprite.prototype.createClone = function () {
    var newClone = new Clone(this.blocks);
    this.clones.push(newClone);
    return newClone;
};

module.exports = Sprite;
