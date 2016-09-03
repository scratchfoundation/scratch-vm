var Sprite = require('../sprites/sprite');
var Blocks = require('../engine/blocks');

function sb3new (runtime) {
    var blocks = new Blocks();
    var sprite = new Sprite(blocks);
    sprite.name = 'Sprite1';
    var target = sprite.createClone();
    runtime.targets.push(target);
    target.x = 0;
    target.y = 0;
    target.direction = 90;
    target.size = 100;
    target.visible = true;
}
module.exports = sb3new;
