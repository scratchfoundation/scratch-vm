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

let costumeRT = null;
let costumeSprite = null;
let costumeTarget = null;

let backdropRT = null;
let backdropSprite = null;
let backdropTarget = null;

// set up preset runtimes for costume and backdrop testing
// each has three costumes or three backdrops, respectively
before( async () => {  

    // COSTUME RUNTIME 
    costumeRT = new Runtime();
    costumeSprite = new Sprite(null, costumeRT);
    costumeTarget = new RenderedTarget(costumeSprite, costumeRT);
    costumeRT.addTarget(costumeTarget);

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

    costumeTarget.addCostume(costumeCatWalk);
    costumeTarget.addCostume(costumeCatRun);
    costumeTarget.addCostume(costumeCatFly);

    // BACKDROP RUNTIME
    backdropRT = new Runtime();
    backdropSprite = new Sprite(null, backdropRT);
    backdropTarget = new RenderedTarget(backdropSprite, backdropRT);
    backdropRT.addTarget(backdropTarget);

    const backdropGalaxy = {
        asset: null,
        assetId: null,
        skinId: null,
        name: 'galaxy',
        bitmapResolution: null,
        rotationCenterX: 0,
        rotationCenterY: 0
    };

    const backdropMoon = {
        asset: null,
        assetId: null,
        skinId: null,
        name: 'moon',
        bitmapResolution: null,
        rotationCenterX: 0,
        rotationCenterY: 0
    };

    const backdropNebula = {
        asset: null,
        assetId: null,
        skinId: null,
        name: 'nebula',
        bitmapResolution: null,
        rotationCenterX: 0,
        rotationCenterY: 0
    };

    backdropTarget.addCostume(backdropGalaxy);
    backdropTarget.addCostume(backdropMoon);
    backdropTarget.addCostume(backdropNebula);

    backdropTarget.isStage = true;


});

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
            
            // NOTE: the setCostumeTo() function seems to start counting at 1
            const retVal = await costumeRT.execBlockPrimitive(costumeTarget.id, 'looks_switchcostumeto', { COSTUME: 1 }, 'test_token');

            // but the current costume starts counting at 0
            expect(costumeTarget.currentCostume).to.equal(0);
            expect(retVal).to.equal(undefined);
        });

        it('Set Costume To From Name', async () => {

            // NOTE: the setCostumeTo() function seems to start counting at 1
            const retVal = await costumeRT.execBlockPrimitive(costumeTarget.id, 'looks_switchcostumeto', { COSTUME: 'cat-fly' }, 'test_token');

            expect(costumeTarget.currentCostume).to.equal(2);
            expect(retVal).to.equal(undefined);
        });

        // TODO Set Backdrop To And Wait function

        it('Next Costume', async () => {

            // set to the walk costume
            const retVal1 = await costumeRT.execBlockPrimitive(costumeTarget.id, 'looks_switchcostumeto', { COSTUME: 'cat-walk' }, 'test_token');

            expect(costumeTarget.currentCostume).to.equal(0);

            const retVal2 = await costumeRT.execBlockPrimitive(costumeTarget.id, 'looks_nextcostume', {}, 'test_token');

            expect(costumeTarget.currentCostume).to.equal(1);

            expect(retVal1).to.equal(undefined);
            expect(retVal2).to.equal(undefined);
        });

        it('Next Costume Last Loops to First', async () => {

            // set to the fly costume
            const retVal1 = await costumeRT.execBlockPrimitive(costumeTarget.id, 'looks_switchcostumeto', { COSTUME: 'cat-fly' }, 'test_token');

            expect(costumeTarget.currentCostume).to.equal(2);

            const retVal2 = await costumeRT.execBlockPrimitive(costumeTarget.id, 'looks_nextcostume', {}, 'test_token');

            expect(costumeTarget.currentCostume).to.equal(0);

            expect(retVal1).to.equal(undefined);
            expect(retVal2).to.equal(undefined);
        });

        it('Set Backdrop To From Index', async () => {
            
            // NOTE: the setBackdropTo() function seems to start counting at 1
            const retVal = await backdropRT.execBlockPrimitive(backdropTarget.id, 'looks_switchbackdropto', { BACKDROP: 2 }, 'test_token');

            // but the current backdrop starts counting at 0
            expect(backdropTarget.currentCostume).to.equal(1);
            expect(retVal).to.equal(undefined);
        });

        it('Set Backdrop To From Name', async () => {

            const retVal = await backdropRT.execBlockPrimitive(backdropTarget.id, 'looks_switchbackdropto', { BACKDROP: 'nebula' }, 'test_token');

            expect(backdropTarget.currentCostume).to.equal(2);
            expect(retVal).to.equal(undefined);
        });

        it('Next Backdrop', async () => {
            
            // NOTE: the setBackdropTo() function seems to start counting at 1
            const retVal1 = await backdropRT.execBlockPrimitive(backdropTarget.id, 'looks_switchbackdropto', { BACKDROP: 1 }, 'test_token');

            // but the current backdrop starts counting at 0
            expect(backdropTarget.currentCostume).to.equal(0);

            const retVal2 = await backdropRT.execBlockPrimitive(backdropTarget.id, 'looks_nextbackdrop', {}, 'test_token');

            expect(backdropTarget.currentCostume).to.equal(1);

            expect(retVal1).to.equal(undefined);
            expect(retVal2).to.equal(undefined);
        });

        it('Next Backdrop Last Loops to First', async () => {

            // NOTE: the setBackdropTo() function seems to start counting at 1
            const retVal1 = await backdropRT.execBlockPrimitive(backdropTarget.id, 'looks_switchbackdropto', { BACKDROP: 3 }, 'test_token');

            // but the current backdrop starts counting at 0
            expect(backdropTarget.currentCostume).to.equal(2);

            const retVal2 = await backdropRT.execBlockPrimitive(backdropTarget.id, 'looks_nextbackdrop', {}, 'test_token');

            expect(backdropTarget.currentCostume).to.equal(0);

            expect(retVal1).to.equal(undefined);
            expect(retVal2).to.equal(undefined);
        });

        it('Change Effect By', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            rt.addTarget(target);

            expect(target.effects.ghost).to.equal(0);

            const retVal = await rt.execBlockPrimitive(target.id, 'looks_changeeffectby', { EFFECT: 'ghost', CHANGE: 10 }, 'test_token');

            expect(target.effects.ghost).to.equal(10);
            expect(retVal).to.equal(undefined);
        });

        it('Change Effect to be Out of Bounds', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            rt.addTarget(target);

            expect(target.effects.brightness).to.equal(0);

            const retVal = await rt.execBlockPrimitive(target.id, 'looks_changeeffectby', { EFFECT: 'brightness', CHANGE: 8000 }, 'test_token');

            expect(target.effects.brightness).to.equal(100);
            expect(retVal).to.equal(undefined);
        });

        it('Set Effect To', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            rt.addTarget(target);

            expect(target.effects.ghost).to.equal(0);

            const retVal = await rt.execBlockPrimitive(target.id, 'looks_seteffectto', { EFFECT: 'ghost', VALUE: 10 }, 'test_token');

            expect(target.effects.ghost).to.equal(10);
            expect(retVal).to.equal(undefined);
        });

        it('Set Effect to be Out of Bounds', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            rt.addTarget(target);

            expect(target.effects.brightness).to.equal(0);

            const retVal = await rt.execBlockPrimitive(target.id, 'looks_seteffectto', { EFFECT: 'brightness', VALUE: -8000 }, 'test_token');

            expect(target.effects.brightness).to.equal(-100);
            expect(retVal).to.equal(undefined);
        });

        it('Clear Graphic Effects', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            rt.addTarget(target);

            // add graphic effect of ghost 50
            const retVal1 = await rt.execBlockPrimitive(target.id, 'looks_seteffectto', { EFFECT: 'ghost', VALUE: 50 }, 'test_token');
            expect(target.effects.ghost).to.equal(50);

            // clear graphic effects
            const retVal2 = await rt.execBlockPrimitive(target.id, 'looks_cleargraphiceffects', {}, 'test_token');

            expect(target.effects.ghost).to.equal(0);

            expect(retVal1).to.equal(undefined);
            expect(retVal2).to.equal(undefined);
        });

        // possible range of sprite sizes depends on cosume and stage size
        // without defining these sizes, Sprite Size is limited to [100, 100]
        // I'm doing a simple 0 change function
        it('Change Size By', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            rt.addTarget(target);

            expect(target.size).to.equal(100);

            const retVal = await rt.execBlockPrimitive(target.id, 'looks_changesizeby', { CHANGE: 0 }, 'test_token');

            expect(target.size).to.equal(100);
            expect(retVal).to.equal(undefined);
        });

        // similar to above, Sprite Size is limited to [100, 100]
        // Testing just a setSize(100)
        it('Set Size To', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            rt.addTarget(target);

            const retVal = await rt.execBlockPrimitive(target.id, 'looks_setsizeto', { SIZE: 100 }, 'test_token');

            expect(target.size).to.equal(100);
            expect(retVal).to.equal(undefined);
        });

        // NOTE: I can't unit test the layers functions since they
        // call functions on the Scratch renderer

        // TODO: Get functions
        // getSize, getCostume, getBackdrop

    });
});
