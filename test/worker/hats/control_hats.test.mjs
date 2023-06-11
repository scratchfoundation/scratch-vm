import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";

import PyatchWorker from "../../../src/worker/pyatch-worker.mjs";
import WorkerMessages from "../../../src/worker/worker-messages.mjs";

import extractCallsSpy from "../../fixtures/extract-calls-spy.mjs";

const { expect } = chai;
chai.use(sinonChai);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Just posts a null value result back to the worker every block OP it receives to worker can finish python execution.
const blockOPTestCallback = (spy) =>
    function (message) {
        spy(message);
        this._worker.postMessage({
            id: WorkerMessages.FromVM.ResultValue,
            token: message.token,
            value: null,
        });
    };

let spy = null;
let pyatchWorker = null;

before(async () => {
    spy = sinon.spy();
    pyatchWorker = new PyatchWorker(blockOPTestCallback(spy));

    await pyatchWorker.loadPyodide();
});

beforeEach(async () => {
    spy.resetHistory();
});

after(async () => {
    pyatchWorker.terminate();
});

describe("Patch Worker Functionality", () => {
    describe("Start Thread Hats", () => {
        describe("Control Hats", () => {
            it("Two Event Registered, Two Event Start", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "control", "clone.py"), "utf8");
                const eventMap = {
                    control_start_as_clone: {
                        target1: ["id_0"],
                    },
                };

                await pyatchWorker.registerThreads(pythonCode, eventMap);
                await pyatchWorker.startHats("control_start_as_clone", "target1");

                expect(spy).to.be.called;

                const spyCalls = extractCallsSpy(spy);
                expect(spyCalls[1].id).to.equal("BlockOP");
                expect(spyCalls[1].threadId).to.equal("id_0");
                expect(spyCalls[1].opCode).to.equal("motion_movesteps");
                expect(spyCalls[1].args).to.eql({ STEPS: 10 });
                expect(spyCalls[1].token).to.be.a("string");
            });
        });
    });
});
