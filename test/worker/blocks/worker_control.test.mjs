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
const createBlockOPTestCallback = (spy, returnValue) =>
    function (message) {
        spy(message);
        this._worker.postMessage({
            id: WorkerMessages.FromVM.ResultValue,
            token: message.token,
            value: returnValue,
        });
    };

let spy = null;
let pyatchWorker = null;

before(async () => {
    spy = sinon.spy();
    pyatchWorker = new PyatchWorker(createBlockOPTestCallback(spy, null));

    await pyatchWorker.loadPyodide();
});

beforeEach(async () => {
    spy.resetHistory();
});

after(async () => {
    pyatchWorker.terminate();
});

describe("Pyatch Worker Fucntionality", () => {
    describe("Async Run", () => {
        describe("Control Primitive Functions", () => {
            describe("Clone", () => {
                it("Myself", async () => {
                    const pythonCode = fs.readFileSync(path.join(__dirname, "python", "control", "single-target-self-clone.py"), "utf8");
                    const executionObject = { event_whenflagclicked: ["id_0"] };

                    await pyatchWorker.registerThreads(pythonCode, executionObject);
                    await pyatchWorker.startHats("event_whenflagclicked");

                    expect(spy).to.be.calledTwice;

                    const spyCalls = extractCallsSpy(spy);
                    expect(spyCalls[1].id).to.equal("BlockOP");
                    expect(spyCalls[1].threadId).to.equal("id_0");
                    expect(spyCalls[1].opCode).to.equal("control_create_clone_of");
                    expect(spyCalls[1].args).to.eql({ CLONE_OPTION: "myself" });
                    expect(spyCalls[1].token).to.be.a("string");
                });

                it("Other Target", async () => {
                    const pythonCode = fs.readFileSync(path.join(__dirname, "python", "control", "multi-target-other-clone.py"), "utf8");
                    const executionObject = { event_whenflagclicked: ["id_0"] };

                    await pyatchWorker.registerThreads(pythonCode, executionObject);
                    await pyatchWorker.startHats("event_whenflagclicked");

                    expect(spy).to.be.calledTwice;

                    const spyCalls = extractCallsSpy(spy);
                    expect(spyCalls[1].id).to.equal("BlockOP");
                    expect(spyCalls[1].threadId).to.equal("id_0");
                    expect(spyCalls[1].opCode).to.equal("control_create_clone_of");
                    expect(spyCalls[1].args).to.eql({ CLONE_OPTION: "target2" });
                    expect(spyCalls[1].token).to.be.a("string");
                });

                it("Delete", async () => {
                    const pythonCode = fs.readFileSync(path.join(__dirname, "python", "control", "single-target-delete-clone.py"), "utf8");
                    const executionObject = { event_whenflagclicked: ["id_0"] };

                    await pyatchWorker.registerThreads(pythonCode, executionObject);
                    await pyatchWorker.startHats("event_whenflagclicked");

                    expect(spy).to.be.calledTwice;

                    const spyCalls = extractCallsSpy(spy);
                    expect(spyCalls[1].id).to.equal("BlockOP");
                    expect(spyCalls[1].threadId).to.equal("id_0");
                    expect(spyCalls[1].opCode).to.equal("control_delete_this_clone");
                    expect(spyCalls[1].args).to.eql({});
                    expect(spyCalls[1].token).to.be.a("string");
                });
            });
        });
    });
});
