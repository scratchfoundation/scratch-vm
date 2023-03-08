/* eslint-disable no-undef */
const Motion = require('../../src/blocks/scratch3_motion');
const Runtime = require('../../src/engine/runtime');
const Sprite = require('../../src/sprites/sprite.js');
const RenderedTarget = require('../../src/sprites/rendered-target.js');

import chai from 'chai';
import sinonChai from 'sinon-chai';

const expect = chai.expect;
chai.use(sinonChai);


describe('Pyatch VM', () => {
    describe('Motion Primitive Functions', () => {
        it('Move', async () => {
            const rt = new Runtime();
            const motion = new Motion(rt);
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            const util = {target};

            motion.moveSteps({STEPS: 10}, util);

            expect(motion.getX({}, util).to.equal('10'));
            expect(motion.getY({}, util).to.equal('0'));
        });
    });
});
