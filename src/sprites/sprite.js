var Clone = require('./clone');
var Blocks = require('../engine/blocks');

function Sprite (blocks) {
    // Sprites have: shared blocks, shared costumes, shared variables, etc.
    if (!blocks) {
        // Shared set of blocks for all clones.
        blocks = new Blocks();
    }
    this.blocks = blocks;
    this.clones = [];

    // Initial single clone with the shared blocks.
    this.clones.push(new Clone(this.blocks));
}

module.exports = Sprite;
