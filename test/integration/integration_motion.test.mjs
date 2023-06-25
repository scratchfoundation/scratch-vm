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
    sprite2.name = "target2";

    vm.runtime.addTarget(target2);

    await vm.runtime.workerLoadPromise;

    vm.start();
});

afterEach(async () => {
    resetTarget(vm.runtime.targets[0]);
});

describe("Pyatch VM Linker & Worker Integration", () => {
    describe("Motion Blocks", () => {
        it("Move", async () => {
            const targetId = "target1";
            const script = `move(10)`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].x).to.equal(10);
            expect(vm.runtime.targets[0].y).to.equal(0);
        });

        it("Go To XY", async () => {
            const targetId = "target1";
            const script = `goToXY(10, 5)`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].x).to.equal(10);
            expect(vm.runtime.targets[0].y).to.equal(5);
        });

        it("Go To", async () => {
            target2.x = 10;
            target2.y = 5;

            const targetId = "target1";
            const script = `goTo("${target2.id}")`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].x).to.equal(10);
            expect(vm.runtime.targets[0].y).to.equal(5);
        });

        it("Turn Right", async () => {
            const targetId = "target1";
            const script = `turnRight(90)`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].direction).to.equal(180);
        });

        it("Turn Left", async () => {
            const targetId = "target1";
            const script = `turnLeft(90)`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].direction).to.equal(0);
        });

        it("Point In Direction", async () => {
            const targetId = "target1";
            const script = `pointInDirection(90)`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].direction).to.equal(90);
        });

        it("pointTowards", async () => {
            const t2i = 1;
            vm.runtime.targets[t2i].x = 5;
            vm.runtime.targets[t2i].y = 5;

            const targetId = "target1";
            const script = `pointTowards("target2")`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].direction).to.equal(45);
        });

        it("Glide", async () => {
            const targetId = "target1";
            const script = `glide(1, 10, 5)`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].x).to.equal(10);
            expect(vm.runtime.targets[0].y).to.equal(5);
        });

        it("Glide To", async () => {
            target2.x = 10;
            target2.y = 5;

            const targetId = "target1";
            const script = `await glideTo(1, '${target2.id}')`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].x).to.equal(10);
            expect(vm.runtime.targets[0].y).to.equal(5);
        });

        it("If On Edge Bounce", async () => {
            const targetId = "target1";
            const script = `ifOnEdgeBounce()`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            // Not on edge so angle will not change
            expect(vm.runtime.targets[0].direction).to.equal(90);
        });

        it("Set Rotation Style", async () => {
            const targetId = "target1";
            const script = `setRotationStyle("left-right")`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].rotationStyle).to.equal("left-right");
        });

        it("Change X", async () => {
            const oldX = target.x;
            const dx = 10;
            const oldY = target.y;

            const targetId = "target1";
            const script = `changeX(${dx})`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].x).to.equal(oldX + dx);
            expect(vm.runtime.targets[0].y).to.equal(oldY);
        });

        it("Change Y", async () => {
            const oldX = target.x;
            const oldY = target.y;
            const dy = 10;

            const targetId = "target1";
            const script = `changeY(${dy})`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].x).to.equal(oldX);
            expect(vm.runtime.targets[0].y).to.equal(oldY + dy);
        });

        it("Set X", async () => {
            const eX = 10;
            const oldY = target.y;
            const targetId = "target1";
            const script = `setX(${eX})`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].x).to.equal(eX);
            expect(vm.runtime.targets[0].y).to.equal(oldY);
        });

        it("Set Y", async () => {
            const oldX = target.x;
            const eY = 10;

            const targetId = "target1";
            const script = `setY(${eY})`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].x).to.equal(oldX);
            expect(vm.runtime.targets[0].y).to.equal(eY);
        });

        it("Get X", async () => {
            const oldX = target.x;
            const dX = 15;

            const targetId = "target1";
            const script = `x = await getX()\nsetX(x + ${dX})`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].x).to.equal(oldX + dX);
        });

        it("Get Y", async () => {
            const oldY = target.y;
            const dY = 15;

            const targetId = "target1";
            const script = `x = await getY()\nsetY(x + ${dY})`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].y).to.equal(oldY + dY);
        });

        it("Get Direction", async () => {
            const oldDegrees = target.direction;
            const dDegrees = 15;

            const targetId = "target1";
            const script = `degrees = await getDirection()\npointInDirection(degrees + ${dDegrees})`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].direction).to.equal(oldDegrees + dDegrees);
        });
    });
});
