import chai from "chai";
import sinonChai from "sinon-chai";
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
    target = new RenderedTarget(sprite, vm.runtime);
    target.id = "target1";
    vm.runtime.addTarget(target);

    vm.start();
});

describe("Pyatch VM Linker & Worker Integration", () => {
    describe("Global Variables", () => {
        it("Number", async () => {
            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: { [eventId]: ["move(globalVariable)"] },
            };

            const steps = 10;
            vm.updateGlobalVariable("globalVariable", steps);

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);

            expect(vm.runtime.targets[0].x).to.equal(steps);
        });

        it("String", async () => {
            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: { [eventId]: ["say(globalVariable)"] },
            };

            vm.updateGlobalVariable("globalVariable", "hello from the test!");

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);

            expect(vm.runtime.targets[0].getCustomState("Scratch.looks").type).to.equal("say");
            expect(vm.runtime.targets[0].getCustomState("Scratch.looks").text).to.equal("hello from the test!");
        });
        /*
        it("Remove", async () => {
            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: { [eventId]: ["say(globalVariable)"] },
            };

            vm.updateGlobalVariable("globalVariable", "hello from the test!");
            vm.removeGlobalVariable("globalVariable");

            await vm.loadScripts(targetAndCode);
            let errorOccurred = false;
            try {
                await vm.startHats(eventId);
            } catch (error) {
                errorOccurred = true;
            }

            expect(errorOccurred).to.be.true;
        });
        */
    });
});
