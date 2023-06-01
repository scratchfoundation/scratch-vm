/* eslint-disable no-undefined */
/* eslint-disable no-undef */
import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import Runtime from "../../src/engine/runtime.mjs";
import Sprite from "../../src/sprites/sprite.mjs";
import RenderedTarget from "../../src/sprites/rendered-target.mjs";
import Thread from "../../src/engine/thread.mjs";

chai.use(sinonChai);
const { expect } = chai;

let runtime = null;
let thread = null;
let sprite = null;
let target = null;

let sprite2 = null;
let target2 = null;

before(async () => {
    runtime = new Runtime();

    sprite = new Sprite(null, runtime);
    target = new RenderedTarget(sprite, runtime);
    thread = new Thread(target, () => {});

    runtime.addTarget(target);

    sprite2 = new Sprite(null, runtime);
    target2 = new RenderedTarget(sprite2, runtime);
    sprite2.name = "destination_target";
    target2.setXY(5, 2);

    runtime.addTarget(target2);
});

const resetTarget = () => {
    Object.keys(runtime.targets).forEach((i) => {
        if (runtime.targets[i].id === target.id) {
            runtime.targets[i].x = 0;
            runtime.targets[i].y = 0;
            runtime.targets[i].direction = 90;
        }
    });
};

afterEach(async () => {
    resetTarget();
});

describe("Runtime Exec Primitives", () => {
    describe("Motion Blocks", () => {
        it("Move", async () => {
            const returnValue = await thread.executeBlock("motion_movesteps", { STEPS: 10 }, "test_token");

            expect(target.x).to.equal(10);
            expect(target.y).to.equal(0);
            expect(returnValue).to.equal(undefined);
        });

        it("Go To XY", async () => {
            const returnValue = await thread.executeBlock("motion_gotoxy", { X: 10, Y: 5 }, "test_token");

            expect(target.x).to.equal(10);
            expect(target.y).to.equal(5);
            expect(returnValue).to.equal(undefined);
        });

        it("Go To", async () => {
            const returnValue = await thread.executeBlock("motion_goto", { TO: target2.sprite.name }, "test_token");

            expect(target.x).to.equal(target2.x);
            expect(target.y).to.equal(target2.y);
            expect(returnValue).to.equal(undefined);
        });

        it("Turn Right", async () => {
            const spy = sinon.spy();
            const mockRenderer = {
                updateDrawableDirectionScale: spy,
            };

            target.renderer = mockRenderer;

            const direction = 90;

            const returnValue = await thread.executeBlock("motion_turnright", { DEGREES: direction }, "test_token");
            target.renderer = null;

            expect(spy).to.have.been.calledWithExactly(target.drawableID, 180, [100, 100]);
            expect(returnValue).to.equal(undefined);
        });

        it("Turn Left", async () => {
            const spy = sinon.spy();
            const mockRenderer = {
                updateDrawableDirectionScale: spy,
            };

            target.renderer = mockRenderer;

            const direction = 90;

            const returnValue = await thread.executeBlock("motion_turnleft", { DEGREES: direction }, "test_token");
            target.renderer = null;

            expect(spy).to.have.been.calledWithExactly(target.drawableID, 0, [100, 100]);
            expect(returnValue).to.equal(undefined);
        });

        it("Point In Direction", async () => {
            const spy = sinon.spy();
            const mockRenderer = {
                updateDrawableDirectionScale: spy,
            };
            target.renderer = mockRenderer;
            const direction = 180;

            const returnValue = await thread.executeBlock("motion_pointindirection", { DIRECTION: direction }, "test_token");
            target.renderer = null;

            expect(spy).to.have.been.calledWithExactly(target.drawableID, 180, [100, 100]);
            expect(returnValue).to.equal(undefined);
        });

        it("Point Towards", async () => {
            const spy = sinon.spy();
            const mockRenderer = {
                updateDrawableDirectionScale: spy,
            };

            target.renderer = mockRenderer;

            const returnValue = await thread.executeBlock("motion_pointtowards", { TOWARDS: target2.sprite.name }, "test_token");
            target.renderer = null;

            expect(spy).to.have.been.calledWithExactly(target.drawableID, 68.19859051364818, [100, 100]);
            expect(returnValue).to.equal(undefined);
        });

        it("Glide", async () => {
            const start = performance.now();
            await thread.executeBlock("motion_glidesecstoxy", { X: 10, Y: 5, SECS: 1 }, "test_token");
            const end = performance.now();

            const secs = (end - start) / 1000;

            expect(target.x).to.equal(10);
            expect(target.y).to.equal(5);
            expect(secs).to.be.closeTo(1, 0.1);
        });

        it("Glide To", async () => {
            const start = performance.now();
            await thread.executeBlock("motion_glideto", { TO: target2.sprite.name, SECS: 1 }, "test_token");
            const end = performance.now();

            const secs = (end - start) / 1000;

            expect(target.x).to.equal(target2.x);
            expect(target.y).to.equal(target2.y);
            expect(secs).to.be.closeTo(1, 0.1);
        });

        it("If On Edge Bounce", async () => {
            // Mocking values so we can test functionality without renderer
            target.getBounds = () => ({ left: 0, right: Runtime.STAGE_WIDTH / 2, top: 0, bottom: 0 });

            const spy = sinon.spy();
            const mockRenderer = {
                updateDrawableDirectionScale: spy,
                getFencedPositionOfDrawable: () => [0, 0],
                updateDrawablePosition: () => {},
            };

            target.renderer = mockRenderer;

            // eslint-disable-next-line no-unused-vars
            const returnValue = await thread.executeBlock("motion_ifonedgebounce", {}, "test_token");
            target.renderer = null;

            expect(spy).to.have.been.calledWithExactly(target.drawableID, -90, [100, 100]);
            expect(returnValue).to.equal(undefined);
        });

        it("Set Rotation Style", async () => {
            const returnValue = await thread.executeBlock("motion_setrotationstyle", { STYLE: RenderedTarget.ROTATION_STYLE_LEFT_RIGHT }, "test_token");

            expect(target.rotationStyle).to.equal(RenderedTarget.ROTATION_STYLE_LEFT_RIGHT);
            expect(returnValue).to.equal(undefined);
        });

        it("Change X", async () => {
            const oldX = target.x;
            const dx = 10;
            const oldY = target.y;

            const returnValue = await thread.executeBlock("motion_changexby", { DX: dx }, "test_token");

            expect(target.x).to.equal(oldX + dx);
            expect(target.y).to.equal(oldY);
            expect(returnValue).to.equal(undefined);
        });

        it("Change Y", async () => {
            const oldX = target.x;
            const oldY = target.y;
            const dy = 10;

            const returnValue = await thread.executeBlock("motion_changeyby", { DY: dy }, "test_token");

            expect(target.x).to.equal(oldX);
            expect(target.y).to.equal(oldY + dy);
            expect(returnValue).to.equal(undefined);
        });

        it("Set X", async () => {
            const eX = 10;
            const oldY = target.y;

            const returnValue = await thread.executeBlock("motion_setx", { X: eX }, "test_token");

            expect(target.x).to.equal(eX);
            expect(target.y).to.equal(oldY);
            expect(returnValue).to.equal(undefined);
        });

        it("Set Y", async () => {
            const eY = 10;
            const oldX = target.x;

            const returnValue = await thread.executeBlock("motion_sety", { Y: eY }, "test_token");

            expect(target.x).to.equal(oldX);
            expect(target.y).to.equal(eY);
            expect(returnValue).to.equal(undefined);
        });

        it("Get X", async () => {
            const eX = target.x;

            let returnValue = null;
            thread.returnValueCallback = (token, result) => {
                returnValue = result;
            };
            await thread.executeBlock("motion_xposition", {}, "test_token");
            thread.returnValueCallback = null;

            expect(returnValue).to.equal(eX);
        });

        it("Get Y", async () => {
            const eY = target.y;

            let returnValue = null;
            thread.returnValueCallback = (token, result) => {
                returnValue = result;
            };
            await thread.executeBlock("motion_yposition", {}, "test_token");
            thread.returnValueCallback = null;

            expect(returnValue).to.equal(eY);
        });

        it("Get Direction", async () => {
            const eDirection = target.direction;

            let returnValue = null;
            thread.returnValueCallback = (token, result) => {
                returnValue = result;
            };
            await thread.executeBlock("motion_direction", {}, "test_token");
            thread.returnValueCallback = null;

            expect(returnValue).to.equal(eDirection);
        });
    });
});
