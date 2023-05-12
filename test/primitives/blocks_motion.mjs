/* eslint-disable no-undefined */
/* eslint-disable no-undef */
import Runtime from '../../src/engine/runtime.mjs';
import Sprite from '../../src/sprites/sprite.mjs';
import RenderedTarget from '../../src/sprites/rendered-target.mjs';
import Thread from '../../src/engine/thread.mjs';

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import BlockUtility from '../../src/engine/block-utility.mjs';

chai.use(sinonChai);
const expect = chai.expect;


describe('Runtime Exec Primitives', () => {
    describe('Motion Blocks', () => {
        it('Move', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            rt.addTarget(target);

            const retVal = await rt.execBlockPrimitive(target.id, 'motion_movesteps', {STEPS: 10}, new BlockUtility(target, new Runtime()), 'test_token');

            expect(target.x).to.equal(10);
            expect(target.y).to.equal(0);
            expect(retVal).to.equal(undefined);
        });

        it('Go To XY', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            rt.addTarget(target);

            const retVal = await rt.execBlockPrimitive(target.id, 'motion_gotoxy', {X: 10, Y: 5}, new BlockUtility(target, new Runtime()), 'test_token');

            expect(target.x).to.equal(10);
            expect(target.y).to.equal(5);
            expect(retVal).to.equal(undefined);
        });

        it('Go To', async () => {
            const rt = new Runtime();
            const sprite1 = new Sprite(rt);
            const target1 = new RenderedTarget(sprite1, rt);
            rt.addTarget(target1);
            
            const sprite2 = new Sprite(rt);
            const target2 = new RenderedTarget(sprite2, rt);
            target2.name = 'destination_target';
            sprite2.name = 'destination_target';
            target2.setXY(5, 2);
            rt.addTarget(target2);

            const retVal = await rt.execBlockPrimitive(target1.id, 'motion_goto', {TO: target2.name}, new BlockUtility(target1, new Runtime()), 'test_token');

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

            const retVal = await rt.execBlockPrimitive(
                target.id, 'motion_turnright', {DEGREES: direction}, new BlockUtility(target, new Runtime()), 'test_token');
            expect(spy).to.have.been.calledWithExactly(target.drawableID, 180, [100, 100]);
            expect(retVal).to.equal(undefined);
        });

        it('Turn Left', async () => {
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

            const retVal = await rt.execBlockPrimitive(
                target.id, 'motion_turnleft', {DEGREES: direction}, new BlockUtility(target, new Runtime()), 'test_token');
            expect(spy).to.have.been.calledWithExactly(target.drawableID, 0, [100, 100]);
            expect(retVal).to.equal(undefined);
        });

        it('Point In Direction', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            rt.addTarget(target);

            const spy = sinon.spy();
            const mockRenderer = {
                updateDrawableDirectionScale: spy
            };

            target.renderer = mockRenderer;

            const direction = 180;

            const retVal = await rt.execBlockPrimitive(
                target.id, 'motion_pointindirection', {DIRECTION: direction}, new BlockUtility(target, new Runtime()), 'test_token');
            expect(spy).to.have.been.calledWithExactly(target.drawableID, 180, [100, 100]);
            expect(retVal).to.equal(undefined);
        });


        it('pointTowards', async () => {
            const rt = new Runtime();
            const sprite1 = new Sprite(rt);
            const target1 = new RenderedTarget(sprite1, rt);
            rt.addTarget(target1);
            
            const sprite2 = new Sprite(rt);
            const target2 = new RenderedTarget(sprite2, rt);
            target2.name = 'destination_target';
            sprite2.name = 'destination_target';
            target2.setXY(5, 5);
            rt.addTarget(target2);

            const spy = sinon.spy();
            const mockRenderer = {
                updateDrawableDirectionScale: spy
            };

            target1.renderer = mockRenderer;

            const retVal = await rt.execBlockPrimitive(
                target1.id, 'motion_pointtowards', {TOWARDS: target2.name}, new BlockUtility(target1, new Runtime()), 'test_token');

            expect(spy).to.have.been.calledWithExactly(target1.drawableID, 45, [100, 100]);
            expect(retVal).to.equal(undefined);
        });

        it('Glide', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            const targetId = target.id;
            rt.addTarget(target);

            const thread = new Thread(target);

            thread.pushOp('motion_glidesecstoxy', {X: 10, Y: 5, SECS: 1})

            const start = performance.now();
            await new Promise((resolve, reject) => {
                const interval = setInterval(() => {
                    if (!thread.done()) {
                        thread.step();
                    } else {
                        clearInterval(interval);
                        resolve();
                    }
                }, Runtime.THREAD_STEP_INTERVAL);
            });
            const secs = (performance.now() - start)/1000;

            expect(target.x).to.equal(10);
            expect(target.y).to.equal(5);
            expect(secs).to.be.closeTo(1, 0.1);
        });

        it('Glide To', async () => {
            const rt = new Runtime();
            const sprite1 = new Sprite(rt);
            const target1 = new RenderedTarget(sprite1, rt);
            rt.addTarget(target1);
            
            const sprite2 = new Sprite(rt);
            const target2 = new RenderedTarget(sprite2, rt);
            target2.name = 'destination_target';
            sprite2.name = 'destination_target';
            target2.setXY(5, 5);
            rt.addTarget(target2);

            const thread = new Thread(target1);

            thread.pushOp('motion_glideto', {TO: target2.name, SECS: 1})

            const start = performance.now();
            await new Promise((resolve, reject) => {
                const interval = setInterval(() => {
                    if (!thread.done()) {
                        thread.step();
                    } else {
                        clearInterval(interval);
                        resolve();
                    }
                }, Runtime.THREAD_STEP_INTERVAL);
            });
            const secs = (performance.now() - start)/1000;

            expect(target1.x).to.equal(target2.x);
            expect(target1.y).to.equal(target2.y);
            expect(secs).to.be.closeTo(1, 0.1);
        });

        it('If On Edge Bounce', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            const targetId = target.id;
            rt.addTarget(target);

            // eslint-disable-next-line no-unused-vars
            const retVal = await rt.execBlockPrimitive(targetId, 'motion_ifonedgebounce', {}, new BlockUtility(target, new Runtime()), 'test_token');

            // NOTE: Not implemented yet
            expect(true).to.equal(false);
        });

        it('Set Rotation Style', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            const targetId = target.id;
            rt.addTarget(target);

            const retVal = await rt.execBlockPrimitive(
                targetId, 'motion_setrotationstyle', {STYLE: RenderedTarget.ROTATION_STYLE_LEFT_RIGHT}, new BlockUtility(target, new Runtime()), 'test_token');

            expect(target.rotationStyle).to.equal(RenderedTarget.ROTATION_STYLE_LEFT_RIGHT);
            expect(retVal).to.equal(undefined);
        });

        it('Change X', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            rt.addTarget(target);

            const oldX = target.x;
            const dx = 10;
            const oldY = target.y;

            const retVal = await rt.execBlockPrimitive(target.id, 'motion_changexby', {DX: dx}, new BlockUtility(target, new Runtime()), 'test_token');

            expect(target.x).to.equal(oldX + dx);
            expect(target.y).to.equal(oldY);
            expect(retVal).to.equal(undefined);
        });

        it('Change Y', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            rt.addTarget(target);

            const oldX = target.x;
            const oldY = target.y;
            const dy = 10;

            const retVal = await rt.execBlockPrimitive(target.id, 'motion_changeyby', {DY: dy}, new BlockUtility(target, new Runtime()), 'test_token');

            expect(target.x).to.equal(oldX);
            expect(target.y).to.equal(oldY + dy);
            expect(retVal).to.equal(undefined);
        });

        it('Set X', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            rt.addTarget(target);

            const eX = 10;
            const oldY = target.y;

            const retVal = await rt.execBlockPrimitive(target.id, 'motion_setx', {X: eX}, new BlockUtility(target, new Runtime()), 'test_token');

            expect(target.x).to.equal(eX);
            expect(target.y).to.equal(oldY);
            expect(retVal).to.equal(undefined);
        });

        it('Set Y', async () => {
            const rt = new Runtime();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            rt.addTarget(target);

            const eY = 10;
            const oldX = target.x;

            const retVal = await rt.execBlockPrimitive(target.id, 'motion_sety', {Y: eY}, new BlockUtility(target, new Runtime()), 'test_token');

            expect(target.x).to.equal(oldX);
            expect(target.y).to.equal(eY);
            expect(retVal).to.equal(undefined);
        });
    });
});
