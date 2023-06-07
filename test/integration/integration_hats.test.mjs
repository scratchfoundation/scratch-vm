import sinonChai from "sinon-chai";
import chai from "chai";
import VirtualMachine from "../../src/virtual-machine.mjs";
import Sprite from "../../src/sprites/sprite.mjs";
import RenderedTarget from "../../src/sprites/rendered-target.mjs";

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

    await vm.runtime.pyatchLoadPromise;

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
    describe("Hats", () => {
        it("Single Event, Single Target, Single Thread", async () => {
            const steps = 10;
            const executionObject = {
                target1: {
                    event_whenflagclicked: [`move(${steps})`],
                },
            };

            await vm.loadScripts(executionObject);
            await vm.startHats("event_whenflagclicked");

            expect(vm.runtime.targets[0].x).to.equal(steps);
            expect(vm.runtime.targets[0].y).to.equal(0);
        });

        it("Single Event, Single Target, Two Threads", async () => {
            const steps = 10;
            const executionObject = {
                target1: {
                    event_whenflagclicked: [`move(${steps})`, `move(${steps})`],
                },
            };

            await vm.loadScripts(executionObject);
            await vm.startHats("event_whenflagclicked");

            expect(vm.runtime.targets[0].x).to.equal(steps * 2);
            expect(vm.runtime.targets[0].y).to.equal(0);
        });

        it("Single Event, Two Targets, Single Thread", async () => {
            const steps = 10;
            const executionObject = {
                target1: {
                    event_whenflagclicked: [`move(${steps})`],
                },

                target2: {
                    event_whenflagclicked: [`move(${steps})`],
                },
            };

            await vm.loadScripts(executionObject);
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

            await vm.loadScripts(executionObject);
            await Promise.all([vm.startHats("event_whenflagclicked"), vm.startHats("event_whenthisspriteclicked")]);

            expect(vm.runtime.targets[0].x).to.equal(steps * 2);
            expect(vm.runtime.targets[0].y).to.equal(0);
        });

        it("Two Events, Single Target, Single Thread, Single Start", async () => {
            const steps = 10;
            const executionObject = {
                target1: {
                    event_whenflagclicked: [`move(${steps})`],
                    event_whenthisspriteclicked: [`move(${steps})`],
                },
            };

            await vm.loadScripts(executionObject);
            await vm.startHats("event_whenthisspriteclicked");

            expect(vm.runtime.targets[0].x).to.equal(steps);
            expect(vm.runtime.targets[0].y).to.equal(0);
        });

        it("One Event, Single Target, Single Thread, Single Start w/ Option", async () => {
            const steps = 10;
            const executionObject = {
                target1: {
                    event_whenkeypressed: { A: [`move(${steps})`] },
                },
            };

            await vm.loadScripts(executionObject);
            await vm.startHats("event_whenkeypressed", "A");

            expect(vm.runtime.targets[0].x).to.equal(steps);
            expect(vm.runtime.targets[0].y).to.equal(0);
        });

        it("One Event, Single Target, Single Thread, Single Start w/ Two Options", async () => {
            const steps = 10;
            const executionObject = {
                target1: {
                    event_whenkeypressed: {
                        A: [`move(${steps})`],
                        B: [`move(${steps})`],
                    },
                },
            };

            await vm.loadScripts(executionObject);
            await Promise.all([vm.startHats("event_whenkeypressed", "A"), vm.startHats("event_whenkeypressed", "B")]);

            expect(vm.runtime.targets[0].x).to.equal(steps * 2);
            expect(vm.runtime.targets[0].y).to.equal(0);
        });

        it("One Event, Single Target, Single Thread, Different event than thread", async () => {
            const steps = 10;
            const executionObject = {
                target1: {
                    event_whenflagclicked: [`move(${steps})`],
                },
            };

            await vm.loadScripts(executionObject);
            await Promise.all([vm.startHats("event_whenkeypressed", "A"), vm.startHats("event_whenkeypressed", "B")]);

            expect(vm.runtime.targets[0].x).to.equal(0);
            expect(vm.runtime.targets[0].y).to.equal(0);
        });
    });
});
