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
    vm.runtime.addTarget(target);

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
        describe("Stop All", () => {
            it("Interrupt Current Thread", async () => {
                const steps = 10;
                const executionObject = {
                    target1: {
                        event_whenflagclicked: [`move(${steps})\nstopAll()\nmove(${steps})`],
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
                        event_whenflagclicked: [`import asyncio\nawait asyncio.sleep(0.25)\nstopAll()`, `import asyncio\nmove(${steps})\nawait asyncio.sleep(0.5)\nmove(${steps})`],
                    },
                };

                await vm.loadScripts(executionObject);
                await vm.startHats("event_whenflagclicked");

                expect(vm.runtime.targets[0].x).to.equal(steps);
                expect(vm.runtime.targets[0].y).to.equal(0);
            });

            it("Interrupt Other Target", async () => {
                const steps = 10;
                const executionObject = {
                    target1: {
                        event_whenflagclicked: [`import asyncio\nmove(${steps})\nawait asyncio.sleep(0.6)\nmove(${steps})`],
                    },
                    target2: {
                        event_whenflagclicked: [`import asyncio\nawait asyncio.sleep(0.25)\nstopAll()`],
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
