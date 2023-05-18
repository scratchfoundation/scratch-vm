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

const PATH_TO_PYODIDE = path.join(__dirname, "../../node_modules/pyodide");
const PATH_TO_WORKER = path.join(__dirname, "../../src/worker/pyodide-web.worker.mjs");

describe("Add Sprite", () => {
    it("From Sprite3 File", async () => {
        const vm = new VirtualMachine(PATH_TO_PYODIDE, PATH_TO_WORKER);

        vm.attachStorage(makeTestStorage());

        const sprite3Uri = path.resolve(__dirname, "../fixtures/cat.sprite3");
        const sprite3 = readFileToBuffer(sprite3Uri);

        const result = await vm.addSprite(sprite3);

        expect(result).to.equal(undefined);
    });
});
