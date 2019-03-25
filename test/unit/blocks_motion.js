const test = require('tap').test;
const Motion = require('../../src/blocks/scratch3_motion');
const Runtime = require('../../src/engine/runtime');
const Sprite = require('../../src/sprites/sprite.js');
const RenderedTarget = require('../../src/sprites/rendered-target.js');

test('getPrimitives', t => {
    const rt = new Runtime();
    const motion = new Motion(rt);
    t.type(motion.getPrimitives(), 'object');
    t.end();
});

test('Coordinates have limited precision', t => {
    const rt = new Runtime();
    const motion = new Motion(rt);
    const sprite = new Sprite(null, rt);
    const target = new RenderedTarget(sprite, rt);
    const util = {target};

    motion.goToXY({X: 0.999999999, Y: 0.999999999}, util);

    t.equals(motion.getX({}, util), 1);
    t.equals(motion.getY({}, util), 1);
    t.end();
});
