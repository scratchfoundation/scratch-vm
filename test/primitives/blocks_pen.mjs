import chai from "chai";
import sinonChai from "sinon-chai";
import Runtime from "../../src/engine/runtime.mjs";
import Sprite from "../../src/sprites/sprite.mjs";
import RenderedTarget from "../../src/sprites/rendered-target.mjs";
import Thread from "../../src/engine/thread.mjs";

chai.use(sinonChai);
const { expect } = chai;

let runtime = null;
let sprite = null;
let target = null;
let thread = null;

// before tests, add two sounds and an audio engine
before(async () => {
    runtime = new Runtime();
    sprite = new Sprite(null, runtime);
    target = new RenderedTarget(sprite, runtime);
    runtime.addTarget(target);
    thread = new Thread(target, () => {});
});

describe("Runtime Exec Primitives", () => {
    describe("Pen Blocks", () => {
        it("Clear", async () => {
            const { result } = await thread.executeBlock("pen_clear", {}, "test_token");

            expect(result).to.equal(undefined);
        });
        it("Stamp", async () => {
            const { result } = await thread.executeBlock("pen_stamp", {}, "test_token");

            expect(result).to.equal(undefined);
        });
        it("Pen Down", async () => {
            const { result } = await thread.executeBlock("pen_pendown", {}, "test_token");

            expect(result).to.equal(undefined);
        });
        it("Pen Up", async () => {
            const { result } = await thread.executeBlock("pen_penup", {}, "test_token");

            expect(result).to.equal(undefined);
        });
        it("Set Pen Color To Color", async () => {
            const { result } = await thread.executeBlock("pen_setpencolortocolor", { COLOR: 10 }, "test_token");

            expect(result).to.equal(undefined);
        });
        it("Change Pen Color Param By", async () => {
            const { result } = await thread.executeBlock("pen_changepencolorparamby", { COLOR_PARAM: "color", VALUE: 10 }, "test_token");

            expect(result).to.equal(undefined);
        });
        it("Set Pen Color Param To", async () => {
            const { result } = await thread.executeBlock("pen_setpencolorparamto", { COLOR_PARAM: "color", VALUE: 10 }, "test_token");

            expect(result).to.equal(undefined);
        });
        it("Change Pen Size By", async () => {
            const { result } = await thread.executeBlock("pen_changepensizeby", { SIZE: 10 }, "test_token");

            expect(result).to.equal(undefined);
        });
        it("Set Pen Size To", async () => {
            const { result } = await thread.executeBlock("pen_setpensizeto", { SIZE: 10 }, "test_token");

            expect(result).to.equal(undefined);
        });
    });
});
