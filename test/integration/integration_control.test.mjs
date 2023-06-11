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

let spriteClone = null;
let targetClone = null;

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

    spriteClone = new Sprite(null, vm.runtime);
    targetClone = new RenderedTarget(spriteClone, vm.runtime);
    targetClone.id = "targetClone";
    vm.runtime.addTarget(targetClone);

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
    describe("Control Blocks", () => {
        describe("Clone", () => {
            it("Myself", async () => {
                const steps = 10;
                const executionObject = {
                    target1: {
                        event_whenflagclicked: [`createClone('myself')`],
                        control_start_as_clone: [`move(${steps})`],
                    },
                };

                await vm.loadScripts(executionObject);
                await vm.startHats("event_whenflagclicked");

                expect(vm.runtime.targets[0].x).to.equal(steps);
                expect(vm.runtime.targets[0].y).to.equal(0);
            });

            it("Other", async () => {
                const steps = 10;
                const executionObject = {
                    target1: {
                        control_start_as_clone: [`move(${steps})`],
                    },
                    target2: {
                        event_whenflagclicked: [`createClone('myself')`],
                    },
                };

                await vm.loadScripts(executionObject);
                await vm.startHats("event_whenflagclicked");

                expect(vm.runtime.targets[0].x).to.equal(steps);
                expect(vm.runtime.targets[0].y).to.equal(0);
            });

            it("Delete", async () => {
                const targetCount = vm.runtime.targets.length;
                const executionObject = {
                    targetClone: {
                        control_start_as_clone: [`deleteClone()`],
                    },
                };

                await vm.loadScripts(executionObject);
                await vm.startHats("control_start_as_clone", "targetClone");

                expect(vm.runtime.targets.length).to.equal(targetCount - 1);
            });
        });
        describe("Stop All", () => {
            it("Interrupt Current Thread", async () => {
                const steps = 10;
                const executionObject = {
                    target1: {
                        event_whenflagclicked: [`move(${steps})\nstop("this")\nmove(${steps})`],
                    },
                };

                await vm.loadScripts(executionObject);
                await vm.startHats("event_whenflagclicked");

                expect(vm.runtime.targets[0].x).to.equal(steps);
                expect(vm.runtime.targets[0].y).to.equal(0);
            });

            it("Interrupt Other Thread", async () => {
                const steps = 10;
                const executionObject = {
                    target1: {
                        event_whenflagclicked: [`import asyncio\nawait asyncio.sleep(0.25)\nstop("other")\nmove(${steps / 2})`, `import asyncio\nmove(${steps})\nawait asyncio.sleep(0.5)\nmove(${steps})`],
                    },
                };

                await vm.loadScripts(executionObject);
                await vm.startHats("event_whenflagclicked");

                expect(vm.runtime.targets[0].x).to.equal(steps + steps / 2);
                expect(vm.runtime.targets[0].y).to.equal(0);
            });

            it("Interrupt All", async () => {
                const steps = 10;
                const executionObject = {
                    target1: {
                        event_whenflagclicked: [`import asyncio\nmove(${steps})\nawait asyncio.sleep(0.6)\nmove(${steps})`],
                    },
                    target2: {
                        event_whenflagclicked: [`import asyncio\nawait asyncio.sleep(0.25)\nstop("all")`],
                    },
                };

                await vm.loadScripts(executionObject);
                await vm.startHats("event_whenflagclicked");

                expect(vm.runtime.targets[0].x).to.equal(steps);
                expect(vm.runtime.targets[0].y).to.equal(0);
            });
        });
    });
});
