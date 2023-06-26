import chai from "chai";
import sinonChai from "sinon-chai";
import VirtualMachine from "../../src/virtual-machine.mjs";
import Sprite from "../../src/sprites/sprite.mjs";
import RenderedTarget from "../../src/sprites/rendered-target.mjs";

chai.use(sinonChai);
const { expect } = chai;

let vm = null;
let sprite = null;
let target = null;

before(async () => {
    vm = new VirtualMachine();

    sprite = new Sprite(null, vm.runtime);
    target = new RenderedTarget(sprite, vm.runtime);
    target.id = "target1";
    vm.runtime.addTarget(target);

    await vm.runtime.workerLoadPromise;

    vm.start();
});

describe("Pyatch VM Linker & Worker Integration", () => {
    describe("Pen Blocks", () => {
        it("Clear", async () => {
            const targetId = "target1";
            const script = `erasePen()`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);
        });

        it("Stamp", async () => {
            const targetId = "target1";
            const script = `stampPen()`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);
        });

        it("Pen Down", async () => {
            const targetId = "target1";
            const script = `penDown()`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);
        });

        it("Pen Up", async () => {
            const targetId = "target1";
            const script = `penUp()`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);
        });

        it("Set Pen Color To Color", async () => {
            const targetId = "target1";
            const script = `setPenColor(100)`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);
        });

        it("Change Pen Color Param By", async () => {
            const targetId = "target1";
            const script = `changePenEffect("saturation", 100")`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);
        });

        it("Set Pen Color Param To", async () => {
            const targetId = "target1";
            const script = `setPenEffect("saturation", 100)`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);
        });

        it("Change Pen Size By", async () => {
            const targetId = "target1";
            const script = `changePenSize(20)`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);
        });

        it("Set Pen Size By", async () => {
            const targetId = "target1";
            const script = `setPenSize(20)`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);
        });
    });
});
