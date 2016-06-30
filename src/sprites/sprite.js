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
}

Sprite.prototype.createClone = function () {
    var newClone = new Clone(this.blocks);
    this.clones.push(newClone);
    return newClone;
};

module.exports = Sprite;
