import sinonChai from "sinon-chai";
import chai from "chai";
import VirtualMachine from "../../src/virtual-machine.mjs";
import Sprite from "../../src/sprites/sprite.mjs";
import RenderedTarget from "../../src/sprites/rendered-target.mjs";
import resetTarget from "../fixtures/reset-target.mjs";

chai.use(sinonChai);
const { expect } = chai;

let vm = null;
let sprite1 = null;
let target1 = null;
let sprite2 = null;
let target2 = null;

before(async () => {
    vm = new VirtualMachine();

    sprite1 = new Sprite(null, vm.runtime);
    target1 = new RenderedTarget(sprite1, vm.runtime);
    target1.id = "target1";
    vm.runtime.addTarget(target1);

    sprite2 = new Sprite(null, vm.runtime);
    target2 = new RenderedTarget(sprite2, vm.runtime);
    target2.id = "target2";
    vm.runtime.addTarget(target2);

    await vm.runtime.workerLoadPromise;

    vm.start();
});

afterEach(async () => {
    resetTarget(vm.runtime.targets[0]);
});

describe("Pyatch VM Linker & Worker Integration", () => {
    describe("Hats", () => {
        it("Single Event, Single Target, Single Thread", async () => {
            const steps = 10;

            const targetId = "target1";
            const script = `move(${steps})`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats("event_whenflagclicked");

            expect(vm.runtime.targets[0].x).to.equal(steps);
            expect(vm.runtime.targets[0].y).to.equal(0);
        });

        it("Single Event, Single Target, Two Threads", async () => {
            const steps = 10;

            const targetId = "target1";
            const script = `move(${steps})`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats("event_whenflagclicked");

            expect(vm.runtime.targets[0].x).to.equal(steps * 2);
            expect(vm.runtime.targets[0].y).to.equal(0);
        });

        it("Single Event, Two Targets, Single Thread", async () => {
            const steps = 10;

            const target1Id = "target1";
            const target2Id = "target2";
            const script = `move(${steps})`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(target1Id, script, triggerEventId);
            await vm.addThread(target2Id, script, triggerEventId);
            await vm.startHats("event_whenflagclicked");

            expect(vm.runtime.targets[0].x).to.equal(steps);
            expect(vm.runtime.targets[0].y).to.equal(0);

            expect(vm.runtime.targets[1].x).to.equal(steps);
            expect(vm.runtime.targets[1].y).to.equal(0);
        });

        it("Two Events, Single Target, Single Thread", async () => {
            const steps = 10;
            const executionObject = {
                target1: {
                    event_whenflagclicked: [`move(${steps})`],
                    event_whenthisspriteclicked: [`move(${steps})`],
                },
            };

            const targetId = "target1";
            const script = `move(${steps})`;
            const triggerEvent1Id = "event_whenflagclicked";
            const triggerEvent2Id = "event_whenthisspriteclicked";

            await vm.addThread(targetId, script, triggerEvent1Id);
            await vm.addThread(targetId, script, triggerEvent2Id);
            await Promise.all([vm.startHats("event_whenflagclicked"), vm.startHats("event_whenthisspriteclicked")]);

            expect(vm.runtime.targets[0].x).to.equal(steps * 2);
            expect(vm.runtime.targets[0].y).to.equal(0);
        });

        it("Two Events, Single Target, Single Thread, Single Start", async () => {
            const steps = 10;

            const targetId = "target1";
            const script = `move(${steps})`;
            const triggerEvent1Id = "event_whenflagclicked";
            const triggerEvent2Id = "event_whenthisspriteclicked";

            await vm.addThread(targetId, script, triggerEvent1Id);
            await vm.addThread(targetId, script, triggerEvent2Id);
            await vm.startHats("event_whenthisspriteclicked");

            expect(vm.runtime.targets[0].x).to.equal(steps);
            expect(vm.runtime.targets[0].y).to.equal(0);
        });

        it("One Event, Single Target, Single Thread, Single Start w/ Option", async () => {
            const steps = 10;

            const targetId = "target1";
            const script = `move(${steps})`;
            const triggerEventId = "event_whenkeypressed";
            const triggerEventOption = "A";

            await vm.addThread(targetId, script, triggerEventId, triggerEventOption);
            await vm.startHats("event_whenkeypressed", "A");

            expect(vm.runtime.targets[0].x).to.equal(steps);
            expect(vm.runtime.targets[0].y).to.equal(0);
        });

        it("One Event, Single Target, Single Thread, Single Start w/ Two Options", async () => {
            const steps = 10;

            const targetId = "target1";
            const script = `move(${steps})`;
            const triggerEventId = "event_whenkeypressed";
            const triggerEvent1Option = "A";
            const triggerEvent2Option = "B";

            await vm.addThread(targetId, script, triggerEventId, triggerEvent1Option);
            await vm.addThread(targetId, script, triggerEventId, triggerEvent2Option);
            await Promise.all([vm.startHats("event_whenkeypressed", "A"), vm.startHats("event_whenkeypressed", "B")]);

            expect(vm.runtime.targets[0].x).to.equal(steps * 2);
            expect(vm.runtime.targets[0].y).to.equal(0);
        });

        it("One Event, Single Target, Single Thread, Different event than thread", async () => {
            const steps = 10;

            const targetId = "target1";
            const script = `move(${steps})`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);

            await Promise.all([vm.startHats("event_whenkeypressed", "A"), vm.startHats("event_whenkeypressed", "B")]);

            expect(vm.runtime.targets[0].x).to.equal(0);
            expect(vm.runtime.targets[0].y).to.equal(0);
        });

        it("When I Start as a Clone", async () => {
            const steps = 10;

            const targetId = "target1";
            const cloneScript = `move(${steps})`;
            const cloneTriggerEventId = "control_start_as_clone";
            const originalScript = `createClone("_myself_")`;
            const originalTriggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, cloneScript, cloneTriggerEventId);
            await vm.addThread(targetId, originalScript, originalTriggerEventId);

            await vm.startHats("event_whenflagclicked");

            const originalTarget = vm.runtime.getTargetById(targetId);
            const clonedTarget = vm.runtime.targets[vm.runtime.targets.length - 1];

            expect(clonedTarget.isOriginal).to.equal(false);
            expect(clonedTarget.x).to.equal(steps);
            expect(clonedTarget.y).to.equal(0);

            expect(originalTarget.x).to.equal(0);
            expect(originalTarget.y).to.equal(0);
        });
    });
});
