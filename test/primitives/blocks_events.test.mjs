import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";

import Runtime from "../../src/engine/runtime.mjs";
import Sprite from "../../src/sprites/sprite.mjs";
import RenderedTarget from "../../src/sprites/rendered-target.mjs";
import Thread from "../../src/engine/thread.mjs";

import extractCallsSpy from "../fixtures/extract-calls-spy.mjs";

chai.use(sinonChai);
const { expect } = chai;

let runtime = null;
let sprite = null;
let target = null;
let thread = null;
let spy = null;

// before tests, add two sounds and an audio engine
before(async () => {
    runtime = new Runtime();
    sprite = new Sprite(null, runtime);
    target = new RenderedTarget(sprite, runtime);
    runtime.addTarget(target);
    thread = new Thread(target, () => {});

    spy = sinon.spy();
});

beforeEach(async () => {
    spy.resetHistory();
});

describe("Runtime Exec Primitives", () => {
    describe("Event Blocks", () => {
        it("Broadcast", async () => {
            const broadcastOption = { id: "test_id", name: "test_broadcast" };
            runtime.startHats = spy;

            const { result } = await thread.executeBlock("event_broadcast", { BROADCAST_OPTION: broadcastOption }, "test_token");

            expect(result).to.equal(undefined);

            expect(spy).to.be.calledOnce;
            expect(spy).to.be.calledWith("event_whenbroadcastreceived", broadcastOption.id);
        });

        it("Broadcast and Wait", async () => {
            const broadcastOption = { id: "test_broadcast", name: "test_broadcast" };
            runtime.startHats = async (...args) => {
                spy(...args);
                await new Promise((resolve) => {
                    setTimeout(resolve, 1000);
                });
            };

            const start = performance.now();
            await thread.executeBlock("event_broadcastandwait", { BROADCAST_OPTION: broadcastOption }, "test_token");
            const end = performance.now();

            const secs = (end - start) / 1000;

            const startHatsCall = extractCallsSpy(spy)[0];
            expect(startHatsCall).to.be.an("array");
            expect(startHatsCall.length).to.be.equal(2);
            expect(startHatsCall[0]).to.be.equal("event_whenbroadcastreceived");
            expect(startHatsCall[1]).to.be.equal(broadcastOption.id);
            expect(secs).to.be.closeTo(1, 0.05);
        });
    });
});
