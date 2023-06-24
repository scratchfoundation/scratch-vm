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

let sprite2 = null;
let target2 = null;

before(async () => {
    vm = new VirtualMachine();

    sprite = new Sprite(null, vm.runtime);
    target = new RenderedTarget(sprite, vm.runtime);
    target.id = "target1";
    vm.runtime.addTarget(target);

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
    describe("Control Blocks", () => {
        describe("Stop All", () => {
            it("Interrupt Current Thread", async () => {
                const steps = 10;
                const targetId = "target1";
                const script = `move(${steps})\nstop("this")\nmove(${steps})`;
                const triggerEventId = "event_whenflagclicked";

                await vm.addThread(targetId, script, triggerEventId);
                await vm.startHats(triggerEventId);

                expect(vm.runtime.targets[0].x).to.equal(steps);
                expect(vm.runtime.targets[0].y).to.equal(0);
            });

            it("Interrupt Other Thread", async () => {
                const steps = 10;
                const targetId = "target1";
                const script1 = `import asyncio\nawait asyncio.sleep(0.25)\nstop("other")\nmove(${steps / 2})`;
                const script2 = `import asyncio\nmove(${steps})\nawait asyncio.sleep(0.5)\nmove(${steps})`;
                const triggerEventId = "event_whenflagclicked";

                await vm.addThread(targetId, script1, triggerEventId);
                await vm.addThread(targetId, script2, triggerEventId);
                await vm.startHats(triggerEventId);

                expect(vm.runtime.targets[0].x).to.equal(steps + steps / 2);
                expect(vm.runtime.targets[0].y).to.equal(0);
            });

            it("Interrupt All", async () => {
                const steps = 10;

                const target1Id = "target1";
                const target2Id = "target2";
                const script1 = `import asyncio\nmove(${steps})\nawait asyncio.sleep(0.6)\nmove(${steps})`;
                const script2 = `import asyncio\nawait asyncio.sleep(0.25)\nstop("all")`;
                const triggerEventId = "event_whenflagclicked";

                await vm.addThread(target1Id, script1, triggerEventId);
                await vm.addThread(target2Id, script2, triggerEventId);
                await vm.startHats(triggerEventId);

                expect(vm.runtime.targets[0].x).to.equal(steps);
                expect(vm.runtime.targets[0].y).to.equal(0);
            });
        });
    });
});
