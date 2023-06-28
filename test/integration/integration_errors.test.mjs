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
    spriteClone.name = "spriteClone";
    targetClone = new RenderedTarget(spriteClone, vm.runtime);
    targetClone.id = "targetClone";
    vm.runtime.addTarget(targetClone);

    await vm.runtime.workerLoadPromise;

    vm.start();
});

afterEach(async () => {
    vm.runtime.targets.forEach((tempTarget) => {
        resetTarget(tempTarget);
    });
});

describe("Pyatch VM Linker & Worker Integration", () => {
    describe("Error Handling", () => {
        it("NameError", async () => {
            const targetId = "target1";
            const script = `notafunction()`;
            const triggerEventId = "event_whenflagclicked";

            const threadId = await vm.addThread(targetId, script, triggerEventId);
            let error = {};
            vm.on("RUNTIME ERROR", (...args) => {
                error = args;
            });
            await vm.startHats(triggerEventId);

            expect(vm.getRuntimeErrors()).to.eql([{ threadId, lineNumber: "2", message: "NameError: name 'notafunction' is not defined" }]);
        });
    });
});
