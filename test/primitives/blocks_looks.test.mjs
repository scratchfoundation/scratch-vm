import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";

import Runtime from "../../src/engine/runtime.mjs";
import Sprite from "../../src/sprites/sprite.mjs";
import RenderedTarget from "../../src/sprites/rendered-target.mjs";
import BlockUtility from "../../src/engine/block-utility.mjs";
import Thread from "../../src/engine/thread.mjs";

import extractCallsSpy from "../fixtures/extract-calls-spy.mjs";

chai.use(sinonChai);
const { expect } = chai;

let defaultRuntime = null;
let defaultSprite = null;
let defaultTarget = null;
let defaultThread = null;

let costumeRuntime = null;
let costumeSprite = null;
let costumeTarget = null;
let costumeThread = null;

let backdropRuntime = null;
let backdropSprite = null;
let backdropTarget = null;
let backdropThread = null;

let spy = null;

// set up preset runtimes for costume and backdrop testing
// each has three costumes or three backdrops, respectively
before(async () => {
    // DEFAULT RUNTIME
    defaultRuntime = new Runtime();
    defaultSprite = new Sprite(null, defaultRuntime);
    defaultTarget = new RenderedTarget(defaultSprite, defaultRuntime);
    defaultRuntime.addTarget(defaultTarget);
    defaultThread = new Thread(defaultTarget, () => {});

    // COSTUME RUNTIME
    costumeRuntime = new Runtime();
    costumeSprite = new Sprite(null, costumeRuntime);
    costumeTarget = new RenderedTarget(costumeSprite, costumeRuntime);
    costumeRuntime.addTarget(costumeTarget);
    costumeThread = new Thread(costumeTarget, () => {});

    spy = sinon.spy();

    const costumeCatWalk = {
        asset: null,
        assetId: null,
        skinId: null,
        name: "cat-walk",
        bitmapResolution: null,
        rotationCenterX: 0,
        rotationCenterY: 0,
    };

    const costumeCatRun = {
        asset: null,
        assetId: null,
        skinId: null,
        name: "cat-run",
        bitmapResolution: null,
        rotationCenterX: 0,
        rotationCenterY: 0,
    };

    const costumeCatFly = {
        asset: null,
        assetId: null,
        skinId: null,
        name: "cat-fly",
        bitmapResolution: null,
        rotationCenterX: 0,
        rotationCenterY: 0,
    };

    costumeTarget.addCostume(costumeCatWalk);
    costumeTarget.addCostume(costumeCatRun);
    costumeTarget.addCostume(costumeCatFly);

    // BACKDROP RUNTIME
    backdropRuntime = new Runtime();
    backdropSprite = new Sprite(null, backdropRuntime);
    backdropTarget = new RenderedTarget(backdropSprite, backdropRuntime);
    backdropRuntime.addTarget(backdropTarget);
    backdropThread = new Thread(backdropTarget, () => {});

    const backdropGalaxy = {
        asset: null,
        assetId: null,
        skinId: null,
        name: "galaxy",
        bitmapResolution: null,
        rotationCenterX: 0,
        rotationCenterY: 0,
    };

    const backdropMoon = {
        asset: null,
        assetId: null,
        skinId: null,
        name: "moon",
        bitmapResolution: null,
        rotationCenterX: 0,
        rotationCenterY: 0,
    };

    const backdropNebula = {
        asset: null,
        assetId: null,
        skinId: null,
        name: "nebula",
        bitmapResolution: null,
        rotationCenterX: 0,
        rotationCenterY: 0,
    };

    backdropTarget.addCostume(backdropGalaxy);
    backdropTarget.addCostume(backdropMoon);
    backdropTarget.addCostume(backdropNebula);

    backdropTarget.isStage = true;
});

beforeEach(() => {
    spy.resetHistory();
});

describe("Runtime Exec Primitives", () => {
    describe("Looks Blocks", () => {
        it("Say", async () => {
            const returnValue = await defaultThread.executeBlock("looks_say", { MESSAGE: "Hello World" }, "test_token");

            // the Scratch.looks custom state get's a defaultTarget's bubble-related state
            expect(defaultTarget.getCustomState("Scratch.looks").type).to.equal("say");
            expect(defaultTarget.getCustomState("Scratch.looks").text).to.equal("Hello World");
            expect(returnValue).to.equal(undefined);
        });

        it("Think", async () => {
            const returnValue = await defaultThread.executeBlock("looks_think", { MESSAGE: "Hello World" }, "test_token");

            expect(defaultTarget.getCustomState("Scratch.looks").type).to.equal("think");
            expect(defaultTarget.getCustomState("Scratch.looks").text).to.equal("Hello World");
            expect(returnValue).to.equal(undefined);
        });

        // TODO: Say and Think for Seconds

        it("Show", async () => {
            const returnValue = await defaultThread.executeBlock("looks_show", {}, "test_token");

            expect(defaultTarget.visible).to.equal(true);
            expect(returnValue).to.equal(undefined);
        });

        it("Hide", async () => {
            const returnValue = await defaultThread.executeBlock("looks_hide", {}, "test_token");

            expect(defaultTarget.visible).to.equal(false);
            expect(returnValue).to.equal(undefined);
        });

        it("Set Costume To From Index", async () => {
            // NOTE: the setCostumeTo() function seems to start counting at 1
            const returnValue = await costumeThread.executeBlock("looks_switchcostumeto", { COSTUME: 1 }, "test_token");

            // but the current costume starts counting at 0
            expect(costumeTarget.currentCostume).to.equal(0);
            expect(returnValue).to.equal(undefined);
        });

        it("Set Costume To From Name", async () => {
            // NOTE: the setCostumeTo() function seems to start counting at 1
            const returnValue = await costumeThread.executeBlock("looks_switchcostumeto", { COSTUME: "cat-fly" }, "test_token");

            expect(costumeTarget.currentCostume).to.equal(2);
            expect(returnValue).to.equal(undefined);
        });

        // TODO Set Backdrop To And Wait function

        it("Next Costume", async () => {
            // set to the walk costume
            const returnValue1 = await costumeThread.executeBlock("looks_switchcostumeto", { COSTUME: "cat-walk" }, "test_token");

            expect(costumeTarget.currentCostume).to.equal(0);

            const returnValue2 = await costumeThread.executeBlock("looks_nextcostume", {}, "test_token");

            expect(costumeTarget.currentCostume).to.equal(1);

            expect(returnValue1).to.equal(undefined);
            expect(returnValue2).to.equal(undefined);
        });

        it("Next Costume Last Loops to First", async () => {
            // set to the fly costume
            const returnValue1 = await costumeThread.executeBlock("looks_switchcostumeto", { COSTUME: "cat-fly" }, "test_token");

            expect(costumeTarget.currentCostume).to.equal(2);

            const returnValue2 = await costumeThread.executeBlock("looks_nextcostume", {}, "test_token");

            expect(costumeTarget.currentCostume).to.equal(0);

            expect(returnValue1).to.equal(undefined);
            expect(returnValue2).to.equal(undefined);
        });

        it("Set Backdrop To From Index", async () => {
            backdropRuntime.startHats = spy;

            // NOTE: the setBackdropTo() function seems to start counting at 1
            const returnValue = await backdropThread.executeBlock("looks_switchbackdropto", { BACKDROP: 2 }, "test_token");

            // but the current backdrop starts counting at 0
            expect(backdropTarget.currentCostume).to.equal(1);
            expect(returnValue).to.equal(undefined);
            expect(spy).to.be.calledWith("event_whenbackdropswitchesto", "moon");
        });

        it("Set Backdrop To From Name", async () => {
            backdropRuntime.startHats = spy;

            const returnValue = await backdropThread.executeBlock("looks_switchbackdropto", { BACKDROP: "nebula" }, "test_token");

            expect(backdropTarget.currentCostume).to.equal(2);
            expect(returnValue).to.equal(undefined);
            expect(spy).to.be.calledWith("event_whenbackdropswitchesto", "nebula");
        });

        it("Next Backdrop", async () => {
            backdropRuntime.startHats = spy;

            // NOTE: the setBackdropTo() function seems to start counting at 1
            const returnValue1 = await backdropThread.executeBlock("looks_switchbackdropto", { BACKDROP: 1 }, "test_token");

            // but the current backdrop starts counting at 0
            expect(backdropTarget.currentCostume).to.equal(0);

            const returnValue2 = await backdropThread.executeBlock("looks_nextbackdrop", {}, "test_token");

            expect(backdropTarget.currentCostume).to.equal(1);

            expect(returnValue1).to.equal(undefined);
            expect(returnValue2).to.equal(undefined);
            expect(spy).to.be.calledWith("event_whenbackdropswitchesto", "moon");
        });

        it("Next Backdrop Last Loops to First", async () => {
            backdropRuntime.startHats = spy;

            // NOTE: the setBackdropTo() function seems to start counting at 1
            const returnValue1 = await backdropThread.executeBlock("looks_switchbackdropto", { BACKDROP: 3 }, "test_token");

            // but the current backdrop starts counting at 0
            expect(backdropTarget.currentCostume).to.equal(2);

            const returnValue2 = await backdropThread.executeBlock("looks_nextbackdrop", {}, "test_token");

            const calls = extractCallsSpy(spy);

            expect(backdropTarget.currentCostume).to.equal(0);
            expect(returnValue1).to.equal(undefined);
            expect(returnValue2).to.equal(undefined);
            expect(calls[0][0]).to.equal("event_whenbackdropswitchesto");
            expect(calls[1][0]).to.equal("event_whenbackdropswitchesto");
        });

        it("Change Effect By", async () => {
            expect(defaultTarget.effects.ghost).to.equal(0);

            const returnValue = await defaultThread.executeBlock("looks_changeeffectby", { EFFECT: "ghost", CHANGE: 10 }, "test_token");

            expect(defaultTarget.effects.ghost).to.equal(10);
            expect(returnValue).to.equal(undefined);
        });

        it("Change Effect to be Out of Bounds", async () => {
            expect(defaultTarget.effects.brightness).to.equal(0);

            const returnValue = await defaultThread.executeBlock("looks_changeeffectby", { EFFECT: "brightness", CHANGE: 8000 }, "test_token");

            expect(defaultTarget.effects.brightness).to.equal(100);
            expect(returnValue).to.equal(undefined);
        });

        it("Set Effect To", async () => {
            defaultTarget.effects.ghost = 0;

            const returnValue = await defaultThread.executeBlock("looks_seteffectto", { EFFECT: "ghost", VALUE: 10 }, "test_token");

            expect(defaultTarget.effects.ghost).to.equal(10);
            expect(returnValue).to.equal(undefined);
        });

        it("Set Effect to be Out of Bounds", async () => {
            defaultTarget.effects.brightness = 0;

            const returnValue = await defaultThread.executeBlock("looks_seteffectto", { EFFECT: "brightness", VALUE: -8000 }, "test_token");

            expect(defaultTarget.effects.brightness).to.equal(-100);
            expect(returnValue).to.equal(undefined);
        });

        it("Clear Graphic Effects", async () => {
            // add graphic effect of ghost 50
            const returnValue1 = await defaultThread.executeBlock("looks_seteffectto", { EFFECT: "ghost", VALUE: 50 }, "test_token");
            expect(defaultTarget.effects.ghost).to.equal(50);

            // clear graphic effects
            const returnValue2 = await defaultThread.executeBlock("looks_cleargraphiceffects", {}, "test_token");

            expect(defaultTarget.effects.ghost).to.equal(0);

            expect(returnValue1).to.equal(undefined);
            expect(returnValue2).to.equal(undefined);
        });

        // possible range of sprite sizes depends on cosume and stage size
        // without defining these sizes, Sprite Size is limited to [100, 100]
        // I'm doing a simple 0 change function
        it("Change Size By", async () => {
            expect(defaultTarget.size).to.equal(100);

            const returnValue = await defaultThread.executeBlock("looks_changesizeby", { CHANGE: 0 }, "test_token");

            expect(defaultTarget.size).to.equal(100);
            expect(returnValue).to.equal(undefined);
        });

        // similar to above, Sprite Size is limited to [100, 100]
        // Testing just a setSize(100)
        it("Set Size To", async () => {
            const returnValue = await defaultThread.executeBlock("looks_setsizeto", { SIZE: 100 }, "test_token");

            expect(defaultTarget.size).to.equal(100);
            expect(returnValue).to.equal(undefined);
        });

        // NOTE: I can't unit test the layers functions since they
        // call functions on the Scratch renderer

        // TODO: Get functions
        // getSize, getCostume, getBackdrop
    });
});
