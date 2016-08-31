var Blocks = require('./blocks');
var uid = require('../util/uid');

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
    /**
     * A unique ID for this target.
     * @type {string}
     */
    this.id = uid();
    /**
     * Blocks run as code for this target.
     * @type {!Blocks}
     */
    this.blocks = blocks;
}

/**
 * Return a human-readable name for this target.
 * Target implementations should override this.
 * @abstract
 * @returns {string} Human-readable name for the target.
 */
Target.prototype.getName = function () {
    return this.id;
};

module.exports = Target;
