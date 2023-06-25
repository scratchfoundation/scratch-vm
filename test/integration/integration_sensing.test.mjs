import sinonChai from "sinon-chai";
import chai from "chai";
import VirtualMachine from "../../src/virtual-machine.mjs";
import Sprite from "../../src/sprites/sprite.mjs";
import RenderedTarget from "../../src/sprites/rendered-target.mjs";

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
    sprite2.name = "target2";

    vm.runtime.addTarget(target2);

    await vm.runtime.workerLoadPromise;

    vm.start();
});

describe("Pyatch VM Linker & Worker Integration", () => {
    describe("Sensing Blocks", () => {
        it("Is Touching", async () => {
            const targetId = "target1";
            const script = `touchBool = await isTouching('target2')\nif not touchBool:\n   setX(100)\n`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].x).to.equal(100);
        });
        it("Is Touching Color", async () => {
            const targetId = "target1";
            const script = `touchBool = await isTouchingColor('red')\nif not touchBool:\n   setX(100)\n`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].x).to.equal(100);
        });
        it("Is Color Touching Color", async () => {
            const targetId = "target1";
            const script = `touchBool = await isColorTouchingColor('red', 'blue')\nif not touchBool:\n   setX(100)\n`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].x).to.equal(100);
        });
        it("Distance To", async () => {
            target.x = 0;
            target.y = 0;
            target2.x = 10;
            target2.y = 0;

            const targetId = "target1";
            const script = `distance = await distanceTo('target2')\nsetY(distance)\n`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].y).to.equal(10);
        });
        // TODO: as with prims, don't know how to test timer, timer doesn't ever start
        it("GetTimer", async () => {
            const targetId = "target1";
            const script = `time = await getTimer()\nsetX(time)\n`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].x).to.equal(0);
        });
        it("Get Attribute Ff", async () => {
            target2.x = 73;

            const targetId = "target1";
            const script = `target2X = await getAttributeOf('target2', 'x position')\nsetX(target2X)\n`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].x).to.equal(73);
        });
        // can't test mouse x, mouse y, mouse click, or key down in just the VM?
        it("Current Hour", async () => {
            const targetId = "target1";
            const script = `hour = await current('hour')\nsetX(hour)\n`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            const date = new Date();

            expect(vm.runtime.targets[0].x).to.equal(date.getHours());
        });
        it("Days Since 2000", async () => {
            const targetId = "target1";
            const script = `daysSince = await daysSince2000()\nsetX(daysSince)\n`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            const msPerDay = 24 * 60 * 60 * 1000;
            const start = new Date(2000, 0, 1); // Months are 0-indexed.
            const today = new Date();
            const dstAdjust = today.getTimezoneOffset() - start.getTimezoneOffset();
            let mSecsSinceStart = today.valueOf() - start.valueOf();
            mSecsSinceStart += (today.getTimezoneOffset() - dstAdjust) * 60 * 1000;
            const daysSince2000 = mSecsSinceStart / msPerDay;

            expect(Math.floor(vm.runtime.targets[0].x)).to.equal(Math.floor(daysSince2000));
        });
        // as with prim tests, can't test getLoudness without an audio engine initialized
        // can't test getUsername in just the VM
    });
});
