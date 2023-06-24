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

    await vm.runtime.workerLoadPromise;

    vm.start();
});

describe("Pyatch VM Linker & Worker Integration", () => {
    describe("Global Variables", () => {
        it("Number", async () => {
            const steps = 10;
            const globalName = "globalVariable";
            vm.updateGlobalVariable("globalVariable", steps);

            const targetId = "target1";
            const script = `move(${globalName})`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].x).to.equal(steps);
        });

        it("String", async () => {
            const message = "hello from the test!";
            const globalName = "globalVariable";

            vm.updateGlobalVariable(globalName, message);

            const targetId = "target1";
            const script = `say(${globalName})`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].getCustomState("Scratch.looks").type).to.equal("say");
            expect(vm.runtime.targets[0].getCustomState("Scratch.looks").text).to.equal("hello from the test!");
        });

        it("Get", async () => {
            const message = "hello from the test!";
            const globalName = "globalVariable";

            vm.updateGlobalVariable(globalName, message);

            const targetId = "target1";
            const script = `say(${globalName})`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            const result = vm.getGlobalVariables();

            expect(result).to.eql([{ name: globalName, value: message }]);
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
