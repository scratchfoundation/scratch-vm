var Sprite = require('./sprites/sprite');
var Blocks = require('./engine/blocks');

function newProject (runtime) {
    var blocks = new Blocks();
    var sprite = new Sprite(blocks);
    sprite.name = 'Sprite1';
    sprite.costumes.push({skin: '09dc888b0b7df19f70d81588ae73420e.svg',
        name: 'costume1',
        bitmapResolution: 1,
        rotationCenterX: 47,
        rotationCenterY: 55}); 
    var target = sprite.createClone();
    runtime.targets.push(target);
    target.x = 0;
    target.y = 0;
    target.direction = 90;
    target.size = 100;
    target.visible = true;
}
module.exports = newProject;
