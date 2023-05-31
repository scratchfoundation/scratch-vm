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
            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: {
                    [eventId]: ["move(10)"],
                },
            };

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);

            expect(vm.runtime.targets[0].x).to.equal(10);
            expect(vm.runtime.targets[0].y).to.equal(0);
        });

        it("Go To XY", async () => {
            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: {
                    [eventId]: ["goToXY(10, 5)"],
                },
            };

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);

            expect(vm.runtime.targets[0].x).to.equal(10);
            expect(vm.runtime.targets[0].y).to.equal(5);
        });

        it("Go To", async () => {
            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: {
                    [eventId]: ['goTo("target2")'],
                },
            };

            target2.x = 10;
            target2.y = 5;

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);

            expect(vm.runtime.targets[0].x).to.equal(10);
            expect(vm.runtime.targets[0].y).to.equal(5);
        });

        it("Turn Right", async () => {
            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: {
                    [eventId]: ["turnRight(90)"],
                },
            };

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);

            expect(vm.runtime.targets[0].direction).to.equal(180);
        });

        it("Turn Left", async () => {
            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: {
                    [eventId]: ["turnLeft(90)"],
                },
            };

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);

            expect(vm.runtime.targets[0].direction).to.equal(0);
        });

        it("Point In Direction", async () => {
            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: {
                    [eventId]: ["pointInDirection(90)"],
                },
            };

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);

            expect(vm.runtime.targets[0].direction).to.equal(90);
        });

        it("pointTowards", async () => {
            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: {
                    [eventId]: ['pointTowards("target2")'],
                },
            };
            const t2i = 1;
            vm.runtime.targets[t2i].x = 5;
            vm.runtime.targets[t2i].y = 5;

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);

            expect(vm.runtime.targets[0].direction).to.equal(45);
        });

        it("Glide", async () => {
            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: {
                    [eventId]: ["glide(1, 10, 5)"],
                },
            };

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);

            expect(vm.runtime.targets[0].x).to.equal(10);
            expect(vm.runtime.targets[0].y).to.equal(5);
        });

        it("Glide To", async () => {
            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: {
                    [eventId]: ['glideTo(1, "target2")'],
                },
            };

            target2.x = 10;
            target2.y = 5;

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);

            expect(vm.runtime.targets[0].x).to.equal(10);
            expect(vm.runtime.targets[0].y).to.equal(5);
        });

        it("If On Edge Bounce", async () => {
            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: {
                    [eventId]: ["ifOnEdgeBounce()"],
                },
            };

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);

            // Not on edge so angle will not change
            expect(vm.runtime.targets[0].direction).to.equal(90);
        });

        it("Set Rotation Style", async () => {
            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: {
                    [eventId]: ['setRotationStyle("left-right")'],
                },
            };

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);

            expect(vm.runtime.targets[0].rotationStyle).to.equal("left-right");
        });

        it("Change X", async () => {
            const oldX = target.x;
            const dx = 10;
            const oldY = target.y;

            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: {
                    [eventId]: [`changeX(${dx})`],
                },
            };

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);

            expect(vm.runtime.targets[0].x).to.equal(oldX + dx);
            expect(vm.runtime.targets[0].y).to.equal(oldY);
        });

        it("Change Y", async () => {
            const oldX = target.x;
            const oldY = target.y;
            const dy = 10;

            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: {
                    [eventId]: [`changeY(${dy})`],
                },
            };

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);

            expect(vm.runtime.targets[0].x).to.equal(oldX);
            expect(vm.runtime.targets[0].y).to.equal(oldY + dy);
        });

        it("Set X", async () => {
            const eX = 10;
            const oldY = target.y;

            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: {
                    [eventId]: [`setX(${eX})`],
                },
            };

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);

            expect(vm.runtime.targets[0].x).to.equal(eX);
            expect(vm.runtime.targets[0].y).to.equal(oldY);
        });

        it("Set Y", async () => {
            const oldX = target.x;
            const eY = 10;

            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: {
                    [eventId]: [`setY(${eY})`],
                },
            };

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);

            expect(vm.runtime.targets[0].x).to.equal(oldX);
            expect(vm.runtime.targets[0].y).to.equal(eY);
        });

        it("Get X", async () => {
            const oldX = target.x;
            const dX = 15;

            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: {
                    [eventId]: [`x = await getX()\nsetX(x + ${dX})`],
                },
            };

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);

            expect(vm.runtime.targets[0].x).to.equal(oldX + dX);
        });

        it("Get Y", async () => {
            const oldY = target.y;
            const dY = 15;

            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: {
                    [eventId]: [`y = await getY()\nsetY(y + ${dY})`],
                },
            };

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);

            expect(vm.runtime.targets[0].y).to.equal(oldY + dY);
        });

        it("Get Direction", async () => {
            const oldDegrees = target.direction;
            const dDegrees = 15;

            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: {
                    [eventId]: [`degrees = await getDirection()\npointInDirection(degrees + ${dDegrees})`],
                },
            };

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);

            expect(vm.runtime.targets[0].direction).to.equal(oldDegrees + dDegrees);
        });
    });
});
