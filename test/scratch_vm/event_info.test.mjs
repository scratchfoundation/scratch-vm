import path from "path";
import { fileURLToPath } from "url";

import chai from "chai";
import sinonChai from "sinon-chai";
import VirtualMachine from "../../src/virtual-machine.mjs";

import { readFileToBuffer } from "../fixtures/readProjectFile.mjs";

import makeTestStorage from "../fixtures/make-test-storage.mjs";

chai.use(sinonChai);
const { expect } = chai;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Event Info", () => {
    it("Get Event Labels", async () => {
        const vm = new VirtualMachine();
        const expected = {
            event_whenflagclicked: "When Flag Clicked",
            event_whenkeypressed: "When Key Pressed",
            event_whenthisspriteclicked: "When This Sprite Clicked",
            event_whentouchingobject: "When Touching",
            event_whenstageclicked: "When Stage Clicked",
            event_whenbackdropswitchesto: "When Backdrop Switches To",
            event_whengreaterthan: "When Greater Than",
            event_whenbroadcastreceived: "When Broadcast Received",
        };

        const result = vm.getEventLabels();

        expect(result).to.eql(expected);
    });

    it("Get Sprite Names", async () => {
        const vm = new VirtualMachine();
        const expected = ["Sprite1", "Sprite2", "Sprite3"];

        vm.attachStorage(makeTestStorage());

        const sprite3Uri = path.resolve(__dirname, "../fixtures/cat.sprite3");
        const sprite3 = readFileToBuffer(sprite3Uri);

        await Promise.all([vm.addSprite(sprite3), vm.addSprite(sprite3), vm.addSprite(sprite3)]);

        const result = vm.getSpriteNames();

        expect(result).to.eql(expected);
    });
});
