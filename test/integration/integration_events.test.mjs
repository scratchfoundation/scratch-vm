import sinonChai from "sinon-chai";
import chai from "chai";
import VirtualMachine from "../../src/virtual-machine.mjs";
import Sprite from "../../src/sprites/sprite.mjs";
import RenderedTarget from "../../src/sprites/rendered-target.mjs";
import resetTarget from "../fixtures/reset-target.mjs";

chai.use(sinonChai);
const { expect } = chai;

let vm = null;
let sprite = null;
let target = null;

before(async () => {
    vm = new VirtualMachine();

    sprite = new Sprite(null, vm.runtime);
    // NOTE: CAN ONLY RUN CODE FROM TARGET1
    target = new RenderedTarget(sprite, vm.runtime);
    target.id = "target1";
    vm.runtime.addTarget(target);

    await vm.runtime.workerLoadPromise;

    vm.start();
});

afterEach(async () => {
    resetTarget(vm.runtime.targets[0]);
});

describe("Pyatch VM Linker & Worker Integration", () => {
    describe("Event Blocks", () => {
        it("Broadcast", async () => {
            const messageId = "message1";
            const steps = 10;

            const targetId = "target1";
            const broadcastScript = `broadcast("${messageId}")`;
            const triggerEventId = "event_whenflagclicked";

            const moveScript = `move(${steps})`;
            const broadcastTriggerEventId = "event_whenbroadcastreceived";
            const broadcastTriggerEventOption = messageId;

            await vm.addThread(targetId, broadcastScript, triggerEventId);
            await vm.addThread(targetId, moveScript, broadcastTriggerEventId, broadcastTriggerEventOption);
            await vm.startHats("event_whenflagclicked");

            expect(vm.runtime.targets[0].x).to.equal(steps);
            expect(vm.runtime.targets[0].y).to.equal(0);
        });

        it("Broadcast and Wait", async () => {
            const messageId = "message1";
            const steps = 10;

            const targetId = "target1";
            const broadcastScript = `await broadcastAndWait("${messageId}")\nx = await getX()\nsay(x)`;
            const triggerEventId = "event_whenflagclicked";

            const moveScript = `move(${steps})`;
            const broadcastTriggerEventId = "event_whenbroadcastreceived";
            const broadcastTriggerEventOption = messageId;

            await vm.addThread(targetId, broadcastScript, triggerEventId);
            await vm.addThread(targetId, moveScript, broadcastTriggerEventId, broadcastTriggerEventOption);
            await vm.startHats("event_whenflagclicked");

            expect(vm.runtime.targets[0].x).to.equal(steps);
            expect(vm.runtime.targets[0].y).to.equal(0);

            expect(vm.runtime.targets[0].getCustomState("Scratch.looks").text).to.equal(`${steps}`);
        });
    });
});
