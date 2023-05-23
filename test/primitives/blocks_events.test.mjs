import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";

import Runtime from "../../src/engine/runtime.mjs";
import Sprite from "../../src/sprites/sprite.mjs";
import RenderedTarget from "../../src/sprites/rendered-target.mjs";
import BlockUtility from "../../src/engine/block-utility.mjs";
import Thread from "../../src/engine/thread.mjs";

import simThreadExecution from "../fixtures/sim-thread-execution.mjs";

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

/* End a mocked thread every interval
 * Meant to simulate threads ending
 */
const endThreads = (threads, interval) =>
    new Promise((resolve) => {
        let i = 0;
        const intervalId = setInterval(() => {
            if (i < threads.length) {
                threads[i].setStatus(Thread.STATUS_DONE);
            } else {
                clearInterval(intervalId);
                resolve();
            }
            i += 1;
        }, interval);
    });

describe("Runtime Exec Primitives", () => {
    describe("Event Blocks", () => {
        it("Broadcast", async () => {
            const broadcastOption = { id: "test_id", name: "test_broadcast" };
            blockUtil.startHats = spy;

            const retVal = await rt.execBlockPrimitive(target.id, "event_broadcast", { BROADCAST_OPTION: broadcastOption }, blockUtil, "test_token");

            expect(retVal).to.equal(undefined);

            expect(spy).to.be.calledOnce;
            expect(spy).to.be.calledWith("event_whenbroadcastreceived", {
                BROADCAST_OPTION: broadcastOption,
            });
        });

        it("Broadcast and Wait", async () => {
            const broadcastOption = { id: "test_id", name: "test_broadcast" };
            const mockStartedThreads = [new Thread(target, null), new Thread(target, null)];

            rt.startHats = (...args) => {
                spy(...args);
                return mockStartedThreads;
            };

            const interval = 100;

            const [executionTime] = await Promise.all([simThreadExecution(target, "event_broadcastandwait", { BROADCAST_OPTION: broadcastOption }), endThreads(mockStartedThreads, interval)]);

            expect(executionTime).to.be.closeTo((interval * mockStartedThreads.length) / 1000, 0.05);
        });
    });
});
