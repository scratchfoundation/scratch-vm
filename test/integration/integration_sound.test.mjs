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
    describe("Sound Blocks", () => {
        it("Play Sound", async () => {
            const targetId = "target1";
            const script = `playSound("meow")`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);
        });

        it("Play Sound Until Done", async () => {
            const targetId = "target1";
            const script = `playSoundUntilDone("meow")`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);
        });

        it("Stop All Sounds", async () => {
            const targetId = "target1";
            const script = `stopAllSounds()`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);
        });

        it("Set Effect To", async () => {
            const targetId = "target1";
            const script = `setSoundEffectTo("pitch", 135)`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].getCustomState("Scratch.sound").effects.pitch).to.equal(135);
        });

        it("Change Effect By", async () => {
            const targetId = "target1";
            const script = `changeSoundEffectBy("pan", -50)`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].getCustomState("Scratch.sound").effects.pan).to.equal(-50);
        });

        it("Set Volume To", async () => {
            const targetId = "target1";
            const script = `setVolumeTo(70)`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].volume).to.equal(70);
        });

        it("Change Volume By", async () => {
            const targetId = "target1";
            const script = `setVolumeTo(100)\nchangeVolumeBy(-40)`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].volume).to.equal(60);
        });
    });
});
