var Blocks = require('./blocks');

/**
 * @fileoverview
 * A Target is an abstract "code-running" object for the Scratch VM.
 * Examples include sprites/clones or potentially physical-world devices.
 */

/**
 * @param {?Blocks} blocks Blocks instance for the blocks owned by this target.
 * @constructor
 */
function Target (blocks) {
    if (!blocks) {
        blocks = new Blocks(this);
    }
    this.blocks = blocks;
}

module.exports = Target;
