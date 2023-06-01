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
    describe("Sound Blocks", () => {
        it("Play Sound", async () => {
            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: { [eventId]: ['playSound("meow")'] },
            };

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);
        });

        it("Play Sound Until Done", async () => {
            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: { [eventId]: ['playSoundUntilDone("meow")'] },
            };

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);
        });

        it("Stop All Sounds", async () => {
            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: { [eventId]: ["stopAllSounds()"] },
            };

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);
        });

        it("Set Effect To", async () => {
            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: { [eventId]: ['setSoundEffectTo("pitch", 135)'] },
            };

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);

            expect(vm.runtime.targets[0].getCustomState("Scratch.sound").effects.pitch).to.equal(135);
        });

        it("Change Effect By", async () => {
            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: { [eventId]: ['changeSoundEffectBy("pan", -50)'] },
            };

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);

            expect(vm.runtime.targets[0].getCustomState("Scratch.sound").effects.pan).to.equal(-50);
        });

        it("Set Volume To", async () => {
            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: { [eventId]: ["setVolumeTo(70)"] },
            };

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);

            expect(vm.runtime.targets[0].volume).to.equal(70);
        });

        it("Change Volume By", async () => {
            const eventId = "event_whenflagclicked";
            const targetAndCode = {
                [target.id]: { [eventId]: ["setVolumeTo(100)\nchangeVolumeBy(-40)"] },
            };

            await vm.loadScripts(targetAndCode);
            await vm.startHats(eventId);

            expect(vm.runtime.targets[0].volume).to.equal(60);
        });
    });
});
