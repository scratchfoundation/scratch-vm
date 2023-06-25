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

let vm = null;

before(async () => {
    vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());
});

describe("Project Serialization", () => {
    it("Load Project", async () => {
        const patchProjectUri = path.resolve(__dirname, "../fixtures/project.ptch1");
        const patchProject = readFileToBuffer(patchProjectUri);

        const result = await vm.loadProject(patchProject);

        //   expect(result).to.equal(undefined);
        expect(vm.runtime.targets.length).to.equal(1);
        expect(vm.runtime.targets[0].sprite.name).to.equal("Sprite1");
        expect(vm.runtime.targets[0].x).to.equal(13);
        expect(vm.runtime.targets[0].y).to.equal(13);
        expect(vm.runtime.targets[0].direction).to.equal(90);
        expect(vm.runtime.targets[0].isStage).to.equal(false);
        expect(vm.runtime.targets[0].rotationStyle).to.equal("all around");
        expect(vm.runtime.targets[0].currentCostume).to.equal(0);

        expect(vm.runtime.targets[0].threads.length).to.equal(1);
        expect(vm.runtime.targets[0].threads[0].script).to.equal("move(10)");
        expect(vm.getGlobalVariables()).to.equal({ hello: 10 });
    });
    it("Serialize Project", async () => {
        const patchProjectUri = path.resolve(__dirname, "../fixtures/project.ptch1");
        const patchProject = readFileToBuffer(patchProjectUri);

        await vm.loadProject(patchProject);
        const result = JSON.parse(await vm.serializeProject());

        console.log(result.vmState);

        expect(result.vmState.targets.length).to.equal(1);
    });
});
