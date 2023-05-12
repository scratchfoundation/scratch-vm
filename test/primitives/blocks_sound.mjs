/* eslint-disable no-undefined */
/* eslint-disable no-undef */
import Runtime from '../../src/engine/runtime.mjs';
import Sprite from '../../src/sprites/sprite.mjs';
import RenderedTarget from '../../src/sprites/rendered-target.mjs';

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);
const expect = chai.expect;

let rt = null;
let sprite = null;
let target = null;

let fakeId = -1;

let FakeAudioEngine = null;


// before tests, add two sounds and an audio engine
before( async () => {  

    rt = new Runtime();
    sprite = new Sprite(null, rt);
    target = new RenderedTarget(sprite, rt);
    rt.addTarget(target);

});

describe('Runtime Exec Primitives', () => {
    describe('Sound Blocks', () => {

        it('Play Sound', async () => {

            const retVal = await rt.execBlockPrimitive(target.id, 'sound_play', { SOUND_MENU: "meow" }, 'test_token');

            expect(retVal).to.equal(undefined);
        });

        it('Set Sound Effect To', async () => {

            const retVal = await rt.execBlockPrimitive(target.id, 'sound_seteffectto', { EFFECT: 'pitch', VALUE: 120 }, 'test_token');

            expect(target.getCustomState('Scratch.sound').effects.pitch).to.equal(120);
            expect(retVal).to.equal(undefined);
        });

        it('Change Sound Effect By', async () => {

            const retVal = await rt.execBlockPrimitive(target.id, 'sound_changeeffectby', { EFFECT: 'pan', VALUE: -50 }, 'test_token');

            expect(target.getCustomState('Scratch.sound').effects.pan).to.equal(-50);
            expect(retVal).to.equal(undefined);
        });
    });
});
