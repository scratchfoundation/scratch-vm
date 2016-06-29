var util = require('util');
var Target = require('../engine/target');

function Clone(spriteBlocks) {
    Target.call(this, spriteBlocks);
}
util.inherits(Clone, Target);

// Clone-level properties
Clone.prototype.x = 0;

Clone.prototype.y = 0;

Clone.prototype.direction = 90;

module.exports = Clone;
