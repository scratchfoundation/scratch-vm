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

before(async () => {
    vm = new VirtualMachine();

    sprite = new Sprite(null, vm.runtime);
    // NOTE: CAN ONLY RUN CODE FROM TARGET1
    target = new RenderedTarget(sprite, vm.runtime);
    target.id = "target1";
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
    describe("Event Blocks", () => {
        it("Broadcast", async () => {
            const messageId = "message1";
            const steps = 10;
            const executionObject = {
                target1: {
                    event_whenflagclicked: [`broadcast("${messageId}")`],
                    event_whenbroadcastreceived: {
                        [messageId]: [`move(${steps})`],
                    },
                },
            };

            await vm.loadScripts(executionObject);
            await vm.startHats("event_whenflagclicked");

            expect(vm.runtime.targets[0].x).to.equal(steps);
            expect(vm.runtime.targets[0].y).to.equal(0);
        });

        it("Broadcast and Wait", async () => {
            const messageId = "message1";
            const steps = 10;
            const executionObject = {
                target1: {
                    event_whenflagclicked: [`await broadcastAndWait("${messageId}")\nx = await getX()\nsay(x)`],
                    event_whenbroadcastreceived: {
                        [messageId]: [`move(${steps})`],
                    },
                },
            };

            await vm.loadScripts(executionObject);
            await vm.startHats("event_whenflagclicked");

            expect(vm.runtime.targets[0].x).to.equal(steps);
            expect(vm.runtime.targets[0].y).to.equal(0);

            expect(vm.runtime.targets[0].getCustomState("Scratch.looks").text).to.equal(`${steps}`);
        });
    });
});
