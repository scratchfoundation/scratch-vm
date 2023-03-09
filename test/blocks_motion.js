/* eslint-disable no-undefined */
/* eslint-disable no-undef */
const Runtime = require('../src/engine/runtime');
const Sprite = require('../src/sprites/sprite.js');
const RenderedTarget = require('../src/sprites/rendered-target.js');

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const expect = chai.expect;


describe('Runtime Exec Primitives', () => {
    describe('Motion Blocks', () => {
        it('Move', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            rt.addTarget(target);

            const retVal = await rt.execBlockPrimitive(target.id, 'motion_movesteps', {STEPS: 10}, 'test_token');

            expect(target.x).to.equal(10);
            expect(target.y).to.equal(0);
            expect(retVal).to.equal(undefined);
        });

        it('Go To XY', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            rt.addTarget(target);

            const retVal = await rt.execBlockPrimitive(target.id, 'motion_gotoxy', {X: 10, Y: 5}, 'test_token');

            expect(target.x).to.equal(10);
            expect(target.y).to.equal(5);
            expect(retVal).to.equal(undefined);
        });

        it('Go To', async () => {
            const rt = new Runtime();
            const sprite1 = new Sprite(null, rt);
            const target1 = new RenderedTarget(sprite1, rt);
            rt.addTarget(target1);
            
            const sprite2 = new Sprite(null, rt);
            const target2 = new RenderedTarget(sprite2, rt);
            target2.name = 'destination_target';
            target2.setXY(5, 2);
            rt.addTarget(target2);

            const retVal = await rt.execBlockPrimitive(target1.id, 'motion_goto', {TO: target2.name}, 'test_token');

            expect(target1.x).to.equal(target2.x);
            expect(target1.y).to.equal(target2.y);
            expect(retVal).to.equal(undefined);
        });

        it('Turn Right', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            rt.addTarget(target);

            const spy = sinon.spy();
            const mockRenderer = {
                updateDrawableDirectionScale: spy
            };

            target.renderer = mockRenderer;

            const direction = 90;

            const retVal = await rt.execBlockPrimitive(target.id, 'motion_turnright', {DEGREES: direction}, 'test_token');
            expect(spy).to.have.been.calledWithExactly(target.drawableID, 180, [100, 100]);
            expect(retVal).to.equal(undefined);
        });

        it('Go To XY', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            const targetId = target.id;
            rt.addTarget(target);

            const retVal = await rt.execBlockPrimitive(targetId, 'motion_movesteps', {STEPS: 10}, 'test_token');

            expect(target.x).to.equal(10);
            expect(target.y).to.equal(0);
            expect(retVal).to.equal(undefined);
        });

        it('Go To XY', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            const targetId = target.id;
            rt.addTarget(target);

            const retVal = await rt.execBlockPrimitive(targetId, 'motion_movesteps', {STEPS: 10}, 'test_token');

            expect(target.x).to.equal(10);
            expect(target.y).to.equal(0);
            expect(retVal).to.equal(undefined);
        });

        it('Go To XY', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            const targetId = target.id;
            rt.addTarget(target);

            const retVal = await rt.execBlockPrimitive(targetId, 'motion_movesteps', {STEPS: 10}, 'test_token');

            expect(target.x).to.equal(10);
            expect(target.y).to.equal(0);
            expect(retVal).to.equal(undefined);
        });

        it('Go To XY', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            const targetId = target.id;
            rt.addTarget(target);

            const retVal = await rt.execBlockPrimitive(targetId, 'motion_movesteps', {STEPS: 10}, 'test_token');

            expect(target.x).to.equal(10);
            expect(target.y).to.equal(0);
            expect(retVal).to.equal(undefined);
        });

        it('Go To XY', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            const targetId = target.id;
            rt.addTarget(target);

            const retVal = await rt.execBlockPrimitive(targetId, 'motion_movesteps', {STEPS: 10}, 'test_token');

            expect(target.x).to.equal(10);
            expect(target.y).to.equal(0);
            expect(retVal).to.equal(undefined);
        });

        it('Go To XY', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            const targetId = target.id;
            rt.addTarget(target);

            const retVal = await rt.execBlockPrimitive(targetId, 'motion_movesteps', {STEPS: 10}, 'test_token');

            expect(target.x).to.equal(10);
            expect(target.y).to.equal(0);
            expect(retVal).to.equal(undefined);
        });

        it('Go To XY', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            const targetId = target.id;
            rt.addTarget(target);

            const retVal = await rt.execBlockPrimitive(targetId, 'motion_movesteps', {STEPS: 10}, 'test_token');

            expect(target.x).to.equal(10);
            expect(target.y).to.equal(0);
            expect(retVal).to.equal(undefined);
        });

        it('Go To XY', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            const targetId = target.id;
            rt.addTarget(target);

            const retVal = await rt.execBlockPrimitive(targetId, 'motion_movesteps', {STEPS: 10}, 'test_token');

            expect(target.x).to.equal(10);
            expect(target.y).to.equal(0);
            expect(retVal).to.equal(undefined);
        });

        it('Go To XY', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            const targetId = target.id;
            rt.addTarget(target);

            const retVal = await rt.execBlockPrimitive(targetId, 'motion_movesteps', {STEPS: 10}, 'test_token');

            expect(target.x).to.equal(10);
            expect(target.y).to.equal(0);
            expect(retVal).to.equal(undefined);
        });

        it('Go To XY', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            const targetId = target.id;
            rt.addTarget(target);

            const retVal = await rt.execBlockPrimitive(targetId, 'motion_movesteps', {STEPS: 10}, 'test_token');

            expect(target.x).to.equal(10);
            expect(target.y).to.equal(0);
            expect(retVal).to.equal(undefined);
        });

        it('Go To XY', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            const targetId = target.id;
            rt.addTarget(target);

            const retVal = await rt.execBlockPrimitive(targetId, 'motion_movesteps', {STEPS: 10}, 'test_token');

            expect(target.x).to.equal(10);
            expect(target.y).to.equal(0);
            expect(retVal).to.equal(undefined);
        });
    });
});
