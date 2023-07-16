import fs from "fs";
import path from "path";
import * as url from "url";
import sinonChai from "sinon-chai";
import chai from "chai";
import VirtualMachine from "../../src/virtual-machine.mjs";
import Sprite from "../../src/sprites/sprite.mjs";
import RenderedTarget from "../../src/sprites/rendered-target.mjs";
import resetTarget from "../fixtures/reset-target.mjs";
import makeTestStorage from "../fixtures/make-test-storage.mjs";
import FakeRenderer from "../fixtures/fake-renderer.mjs";
import { readFileToBuffer } from "../fixtures/readProjectFile.mjs";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

chai.use(sinonChai);
const { expect } = chai;

let vm = null;

before(async () => {
    vm = new VirtualMachine();

    vm.attachStorage(makeTestStorage());
    vm.attachRenderer(new FakeRenderer());

    await vm.runtime.workerLoadPromise;

    vm.start();
});

afterEach(async () => {
    vm.runtime.targets.forEach((tempTarget) => {
        resetTarget(tempTarget);
    });
});

describe("Pyatch VM Linker & Worker Integration", () => {
    describe("Complex Edge Cases", () => {
        it("Is Touching Clone Edge Case", async () => {
            const patchProjectUri = path.resolve(__dirname, "..", "fixtures", "projects", "clone-is-touching.ptch1");
            const patchProject = readFileToBuffer(patchProjectUri);

            await vm.loadProject(patchProject);
            const triggerEventId = "event_whenflagclicked";

            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].x).to.equal(0);
            expect(vm.runtime.targets[0].y).to.equal(0);
        });
    });
});
