/* eslint-disable no-undefined */
/* eslint-disable no-undef */
import chai from "chai";
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

    sprite.name = "Sprite 1";

    sprite2 = new Sprite(null, runtime);
    target2 = new RenderedTarget(sprite2, runtime);
    runtime.addTarget(target2);

    sprite2.name = "Sprite 2";
});

describe("Runtime Exec Primitives", () => {
    describe("Sensing Blocks", () => {
        it("Is Touching", async () => {
            let returnValue = null;
            thread.returnValueCallback = (token, result) => {
                returnValue = result;
            };
            await thread.executeBlock("sensing_touchingobject", { TOUCHINGOBJECTMENU: "Sprite 2" }, "test_token");
            thread.returnValueCallback = null;

            expect(returnValue).to.equal(false);
        });
        it("Touching Color", async () => {
            let returnValue = null;
            thread.returnValueCallback = (token, result) => {
                returnValue = result;
            };
            await thread.executeBlock("sensing_touchingcolor", { COLOR: "blue" }, "test_token");
            thread.returnValueCallback = null;

            expect(returnValue).to.equal(false);
        });
        it("Color Touching Color", async () => {
            let returnValue = null;
            thread.returnValueCallback = (token, result) => {
                returnValue = result;
            };
            await thread.executeBlock("sensing_coloristouchingcolor", { COLOR: "blue", COLOR2: "red" }, "test_token");
            thread.returnValueCallback = null;

            expect(returnValue).to.equal(false);
        });
        it("Distance To", async () => {
            target2.setXY(10, 0);

            let returnValue = null;
            thread.returnValueCallback = (token, result) => {
                returnValue = result;
            };
            await thread.executeBlock("sensing_distanceto", { DISTANCETOMENU: "Sprite 2" }, "test_token");
            thread.returnValueCallback = null;

            expect(returnValue).to.equal(10);
        });
        // TODO: how to test timer functions? Everything I do with clock returns NaN
        it("Get Attribute Of", async () => {
            target.setXY(10, 0);

            let returnValue = null;
            thread.returnValueCallback = (token, result) => {
                returnValue = result;
            };
            await thread.executeBlock("sensing_of", { OBJECT: "Sprite 1", PROPERTY: "x position" }, "test_token");
            thread.returnValueCallback = null;

            expect(returnValue).to.equal(10);
        });
        it("Get Mouse X", async () => {
            let returnValue = null;
            thread.returnValueCallback = (token, result) => {
                returnValue = result;
            };
            await thread.executeBlock("sensing_mousex", {}, "test_token");
            thread.returnValueCallback = null;

            expect(returnValue).to.equal(undefined);
        });
        it("Get Mouse Y", async () => {
            let returnValue = null;
            thread.returnValueCallback = (token, result) => {
                returnValue = result;
            };
            await thread.executeBlock("sensing_mousey", {}, "test_token");
            thread.returnValueCallback = null;

            expect(returnValue).to.equal(undefined);
        });
        it("Is Mouse Down", async () => {
            let returnValue = null;
            thread.returnValueCallback = (token, result) => {
                returnValue = result;
            };
            await thread.executeBlock("sensing_mousedown", {}, "test_token");
            thread.returnValueCallback = null;

            expect(returnValue).to.equal(false);
        });
        it("Is Key Pressed", async () => {
            let returnValue = null;
            thread.returnValueCallback = (token, result) => {
                returnValue = result;
            };
            await thread.executeBlock("sensing_keypressed", { KEY_OPTION: "space" }, "test_token");
            thread.returnValueCallback = null;

            expect(returnValue).to.equal(false);
        });
        it("Current DateTime", async () => {
            let returnValue = null;
            thread.returnValueCallback = (token, result) => {
                returnValue = result;
            };
            await thread.executeBlock("sensing_current", { CURRENTMENU: "date" }, "test_token");
            thread.returnValueCallback = null;

            const date = new Date();

            expect(returnValue).to.equal(date.getDate());
        });
        it("Days Since 2000", async () => {
            let returnValue = null;
            thread.returnValueCallback = (token, result) => {
                returnValue = result;
            };
            await thread.executeBlock("sensing_dayssince2000", {}, "test_token");
            thread.returnValueCallback = null;

            const msPerDay = 24 * 60 * 60 * 1000;
            const today = new Date();
            const start = new Date(2000, 0, 1); // Jan 1, 2000
            const dstAdjust = today.getTimezoneOffset() - start.getTimezoneOffset();
            let mSecsSinceStart = today.valueOf() - start.valueOf();
            mSecsSinceStart += (today.getTimezoneOffset() - dstAdjust) * 60 * 1000;
            const daysSince2000 = mSecsSinceStart / msPerDay;

            expect(returnValue).to.equal(daysSince2000);
        });
        it("Get Loudness", async () => {
            let returnValue = null;
            thread.returnValueCallback = (token, result) => {
                returnValue = result;
            };

            await thread.executeBlock("sensing_loudness", {}, "test_token");

            thread.returnValueCallback = null;

            // not initializing an audioEngine so loudness will be -1
            expect(returnValue).to.equal(-1);
        });
        it("Get Username", async () => {
            let returnValue = null;
            thread.returnValueCallback = (token, result) => {
                returnValue = result;
            };
            await thread.executeBlock("sensing_username", {}, "test_token");
            thread.returnValueCallback = null;

            expect(returnValue).to.equal(null);
        });
    });
});
