import chai from "chai";
import sinonChai from "sinon-chai";
import Runtime from "../../src/engine/runtime.mjs";
import Sprite from "../../src/sprites/sprite.mjs";
import RenderedTarget from "../../src/sprites/rendered-target.mjs";
import BlockUtility from "../../src/engine/block-utility.mjs";
import Timer from "../../src/util/timer.mjs";

chai.use(sinonChai);
const { expect } = chai;

let rt = null;
let sprite = null;
let target = null;

let sprite2 = null;
let target2 = null;

before(async () => {
    rt = new Runtime();
    sprite = new Sprite(null, rt);
    target = new RenderedTarget(sprite, rt);
    rt.addTarget(target);

    sprite.name = "Sprite 1";

    sprite2 = new Sprite(null, rt);
    target2 = new RenderedTarget(sprite2, rt);
    rt.addTarget(target2);

    sprite2.name = "Sprite 2";
});

describe("Runtime Exec Primitives", () => {
    describe("Sensing Blocks", () => {
        it("Is Touching", async () => {
            const retVal = await rt.execBlockPrimitive(target.id, "sensing_touchingobject", { TOUCHINGOBJECTMENU: "Sprite 2" }, new BlockUtility(target, rt), "test_token");

            expect(retVal).to.equal(false);
        });
        it("Touching Color", async () => {
            const retVal = await rt.execBlockPrimitive(target.id, "sensing_touchingcolor", { COLOR: "blue" }, new BlockUtility(target, rt), "test_token");

            expect(retVal).to.equal(false);
        });
        it("Color Touching Color", async () => {
            const retVal = await rt.execBlockPrimitive(target.id, "sensing_coloristouchingcolor", { COLOR: "blue", COLOR2: "red" }, new BlockUtility(target, rt), "test_token");

            expect(retVal).to.equal(false);
        });
        it("Distance To", async () => {
            target2.setXY(10, 0);

            const retVal = await rt.execBlockPrimitive(target.id, "sensing_distanceto", { DISTANCETOMENU: "Sprite 2" }, new BlockUtility(target, rt), "test_token");

            expect(retVal).to.equal(10);
        });

        // TODO: how to test getTimer and resetTimer?

        it("Get Attribute Of", async () => {
            target.setXY(10, 0);

            const retVal = await rt.execBlockPrimitive(target.id, "sensing_of", { OBJECT: "Sprite 1", PROPERTY: "x position" }, new BlockUtility(target, rt), "test_token");

            expect(retVal).to.equal(10);
        });
    });
});
