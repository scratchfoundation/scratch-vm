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

    vm.start();
});

const resetTarget = () => {
    vm.runtime.targets[0].x = 0;
    vm.runtime.targets[0].y = 0;
    vm.runtime.targets[0].direction = 90;
};

afterEach(async () => {
    resetTarget();
});

describe("Pyatch VM Linker & Worker Integration", () => {
    describe("Motion Blocks", () => {
        it("Move", async () => {
            const targetAndCode = {
                target1: ["move(10)"],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].x).to.equal(10);
            expect(vm.runtime.targets[0].y).to.equal(0);
        });

        it("Go To XY", async () => {
            const targetAndCode = {
                target1: ["goToXY(10, 5)"],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].x).to.equal(10);
            expect(vm.runtime.targets[0].y).to.equal(5);
        });

        it("Go To", async () => {
            const targetAndCode = {
                target1: ['goTo("target2")'],
            };

            target2.x = 10;
            target2.y = 5;

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].x).to.equal(10);
            expect(vm.runtime.targets[0].y).to.equal(5);
        });

        it("Turn Right", async () => {
            const targetAndCode = {
                target1: ["turnRight(90)"],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].direction).to.equal(180);
        });

        it("Turn Left", async () => {
            const targetAndCode = {
                target1: ["turnLeft(90)"],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].direction).to.equal(0);
        });

        it("Point In Direction", async () => {
            const targetAndCode = {
                target1: ["pointInDirection(90)"],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].direction).to.equal(90);
        });

        it("pointTowards", async () => {
            const targetAndCode = {
                target1: ['pointTowards("target2")'],
            };
            const t2i = 1;
            vm.runtime.targets[t2i].x = 5;
            vm.runtime.targets[t2i].y = 5;

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].direction).to.equal(45);
        });

        it("Glide", async () => {
            const targetAndCode = {
                target1: ["glide(1, 10, 5)"],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].x).to.equal(10);
            expect(vm.runtime.targets[0].y).to.equal(5);
        });

        it("Glide To", async () => {
            const targetAndCode = {
                target1: ['glideTo(1, "target2")'],
            };

            target2.x = 10;
            target2.y = 5;

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].x).to.equal(10);
            expect(vm.runtime.targets[0].y).to.equal(5);
        });

        it("If On Edge Bounce", async () => {
            const targetAndCode = {
                target1: ["ifOnEdgeBounce()"],
            };

            await vm.run(targetAndCode);

            // Not on edge so angle will not change
            expect(vm.runtime.targets[0].direction).to.equal(90);
        });

        it("Set Rotation Style", async () => {
            const targetAndCode = {
                target1: ['setRotationStyle("left-right")'],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].rotationStyle).to.equal("left-right");
        });

        it("Change X", async () => {
            const oldX = target.x;
            const dx = 10;
            const oldY = target.y;

            const targetAndCode = {
                target1: [`changeX(${dx})`],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].x).to.equal(oldX + dx);
            expect(vm.runtime.targets[0].y).to.equal(oldY);
        });

        it("Change Y", async () => {
            const oldX = target.x;
            const oldY = target.y;
            const dy = 10;

            const targetAndCode = {
                target1: [`changeY(${dy})`],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].x).to.equal(oldX);
            expect(vm.runtime.targets[0].y).to.equal(oldY + dy);
        });

        it("Set X", async () => {
            const eX = 10;
            const oldY = target.y;

            const targetAndCode = {
                target1: [`setX(${eX})`],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].x).to.equal(eX);
            expect(vm.runtime.targets[0].y).to.equal(oldY);
        });

        it("Set Y", async () => {
            const oldX = target.x;
            const eY = 10;

            const targetAndCode = {
                target1: [`setY(${eY})`],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].x).to.equal(oldX);
            expect(vm.runtime.targets[0].y).to.equal(eY);
        });

        it("Get X", async () => {
            const oldX = target.x;
            const dX = 15;

            const targetAndCode = {
                target1: [`x = await getX()\nsetX(x + ${dX})`],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].x).to.equal(oldX + dX);
        });

        it("Get Y", async () => {
            const oldY = target.y;
            const dY = 15;

            const targetAndCode = {
                target1: [`y = await getY()\nsetY(y + ${dY})`],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].y).to.equal(oldY + dY);
        });

        it("Get Direction", async () => {
            const oldDegrees = target.direction;
            const dDegrees = 15;

            const targetAndCode = {
                target1: [`degrees = await getDirection()\npointInDirection(degrees + ${dDegrees})`],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].direction).to.equal(oldDegrees + dDegrees);
        });
    });
});
