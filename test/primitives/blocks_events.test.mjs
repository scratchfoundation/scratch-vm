import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";

import Runtime from "../../src/engine/runtime.mjs";
import Sprite from "../../src/sprites/sprite.mjs";
import RenderedTarget from "../../src/sprites/rendered-target.mjs";
import BlockUtility from "../../src/engine/block-utility.mjs";
import Thread from "../../src/engine/thread.mjs";

import simThreadExecution from "../fixtures/sim-thread-execution.mjs";
import extractCallsSpy from "../fixtures/extract-calls-spy.mjs";

chai.use(sinonChai);
const { expect } = chai;

let rt = null;
let sprite = null;
let target = null;
let blockUtil = null;
let spy = null;

// before tests, add two sounds and an audio engine
before(async () => {
    rt = new Runtime();
    sprite = new Sprite(null, rt);
    target = new RenderedTarget(sprite, rt);
    rt.addTarget(target);

    spy = sinon.spy();

    blockUtil = new BlockUtility(target, rt);
});

beforeEach(async () => {
    spy.resetHistory();
});

describe("Runtime Exec Primitives", () => {
    describe("Event Blocks", () => {
        it("Broadcast", async () => {
            const broadcastOption = { id: "test_id", name: "test_broadcast" };
            blockUtil.startHats = spy;

            const retVal = await rt.execBlockPrimitive(target.id, "event_broadcast", { BROADCAST_OPTION: broadcastOption }, blockUtil, "test_token");

            expect(retVal).to.equal(undefined);

            expect(spy).to.be.calledOnce;
            expect(spy).to.be.calledWith("event_whenbroadcastreceived", broadcastOption.id);
        });

        it("Broadcast and Wait", async () => {
            const broadcastOption = { id: "test_broadcast", name: "test_broadcast" };
            const mockStartedThreads = [new Thread(target, null), new Thread(target, null)];
            const interval = 300;

            rt.startHats = (...args) => {
                spy(...args);
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve();
                    }, interval);
                });
            };

            const executionTime = await simThreadExecution(target, "event_broadcastandwait", { BROADCAST_OPTION: broadcastOption });

            const startHatsCall = extractCallsSpy(spy)[0];
            expect(startHatsCall).to.be.an("array");
            expect(startHatsCall.length).to.be.equal(2);
            expect(startHatsCall[0]).to.be.equal("event_whenbroadcastreceived");
            expect(startHatsCall[1]).to.be.equal(broadcastOption.id);
            expect(executionTime).to.be.closeTo(interval / 1000, 0.05);
        });
    });
});
