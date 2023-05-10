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


describe('Runtime Exec Primitives', () => {
    describe('Looks Blocks', () => {
        it('Say', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            rt.addTarget(target);

            const retVal = await rt.execBlockPrimitive(target.id, 'looks_say', {MESSAGE: 'Hello World'}, 'test_token');

            // the Scratch.looks custom state get's a target's bubble-related state
            expect(target.getCustomState('Scratch.looks').type).to.equal('say');
            expect(target.getCustomState('Scratch.looks').text).to.equal('Hello World');
            expect(retVal).to.equal(undefined);
        });

        it('Think', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            rt.addTarget(target);

            const retVal = await rt.execBlockPrimitive(target.id, 'looks_think', {MESSAGE: 'Hello World'}, 'test_token');

            expect(target.getCustomState('Scratch.looks').type).to.equal('think');
            expect(target.getCustomState('Scratch.looks').text).to.equal('Hello World');
            expect(retVal).to.equal(undefined);
        });

        // TODO: Say and Think for Seconds

        it('Show', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            rt.addTarget(target);

            const retVal = await rt.execBlockPrimitive(target.id, 'looks_show', {}, 'test_token');

            expect(target.visible).to.equal(true);
            expect(retVal).to.equal(undefined);
        });

        it('Hide', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            rt.addTarget(target);

            const retVal = await rt.execBlockPrimitive(target.id, 'looks_hide', {}, 'test_token');

            expect(target.visible).to.equal(false);
            expect(retVal).to.equal(undefined);
        });

        it('Set Costume To From Index', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            rt.addTarget(target);

            const costumeCatWalk = {
                asset: null,
                assetId: null,
                skinId: null,
                name: 'cat-walk',
                bitmapResolution: null,
                rotationCenterX: 0,
                rotationCenterY: 0
            };

            const costumeCatRun = {
                asset: null,
                assetId: null,
                skinId: null,
                name: 'cat-run',
                bitmapResolution: null,
                rotationCenterX: 0,
                rotationCenterY: 0
            };

            const costumeCatFly = {
                asset: null,
                assetId: null,
                skinId: null,
                name: 'cat-fly',
                bitmapResolution: null,
                rotationCenterX: 0,
                rotationCenterY: 0
            };

            target.addCostume(costumeCatWalk);
            target.addCostume(costumeCatRun);
            target.addCostume(costumeCatFly);

            // NOTE: the setCostumeTo() function seems to start counting at 1
            const retVal = await rt.execBlockPrimitive(target.id, 'looks_switchcostumeto', { COSTUME: 1 }, 'test_token');

            // but the current costume starts counting at 0
            expect(target.currentCostume).to.equal(0);
            expect(retVal).to.equal(undefined);
        });

        it('Set Costume To From Name', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            rt.addTarget(target);

            const costumeCatWalk = {
                asset: null,
                assetId: null,
                skinId: null,
                name: 'cat-walk',
                bitmapResolution: null,
                rotationCenterX: 0,
                rotationCenterY: 0
            };

            const costumeCatRun = {
                asset: null,
                assetId: null,
                skinId: null,
                name: 'cat-run',
                bitmapResolution: null,
                rotationCenterX: 0,
                rotationCenterY: 0
            };

            const costumeCatFly = {
                asset: null,
                assetId: null,
                skinId: null,
                name: 'cat-fly',
                bitmapResolution: null,
                rotationCenterX: 0,
                rotationCenterY: 0
            };

            target.addCostume(costumeCatWalk);
            target.addCostume(costumeCatRun);
            target.addCostume(costumeCatFly);

            // NOTE: the setCostumeTo() function seems to start counting at 1
            const retVal = await rt.execBlockPrimitive(target.id, 'looks_switchcostumeto', { COSTUME: 'cat-fly' }, 'test_token');

            expect(target.currentCostume).to.equal(2);
            expect(retVal).to.equal(undefined);
        });

        // TODO Set Backdrop To And Wait function

    });
});
