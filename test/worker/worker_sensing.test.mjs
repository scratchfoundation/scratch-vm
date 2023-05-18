import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";

import PyatchWorker from "../../src/worker/pyatch-worker.mjs";
import WorkerMessages from "../../src/worker/worker-messages.mjs";

import extractCallsSpy from "../fixtures/extract-calls-spy.mjs";

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

describe("Patch Worker Functionality", () => {
    describe("Run Patch Functions", () => {
        describe("Sensing Primitive Functions", () => {
            it("Move", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "motion", "single-target-move.py"), "utf8");
                const threads = ["id_0"];

                await pyatchWorker.run(pythonCode, threads);

                expect(spy).to.be.calledTwice;

                const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
                expect(blockOpCall.id).to.equal("BlockOP");
                expect(blockOpCall.threadId).to.equal(threads[0]);
                expect(blockOpCall.opCode).to.equal("motion_movesteps");
                expect(blockOpCall.args).to.eql({ STEPS: 10 });
                expect(blockOpCall.token).to.be.a("string");
            });

            it("Get X", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "motion", "single-target-getx.py"), "utf8");
                const threads = ["id_0"];

                const mockedX = 5;

                pyatchWorker._blockOPCallback = createBlockOPTestCallback(spy, mockedX);

                await pyatchWorker.run(pythonCode, threads);

                expect(spy).to.be.calledThrice;

                const blockOpCalls = extractCallsSpy(spy);

                expect(blockOpCalls[2].id).to.equal("BlockOP");
                expect(blockOpCalls[2].threadId).to.equal(threads[0]);
                expect(blockOpCalls[2].opCode).to.equal("motion_xposition");
                expect(blockOpCalls[2].args).to.eql({});
                expect(blockOpCalls[2].token).to.be.a("string");

                // The reason for this test is to ensure that the proper value was returned in the python env
                expect(blockOpCalls[1].id).to.equal("BlockOP");
                expect(blockOpCalls[1].threadId).to.equal(threads[0]);
                expect(blockOpCalls[1].opCode).to.equal("motion_setx");
                expect(blockOpCalls[1].args).to.eql({ X: mockedX });
                expect(blockOpCalls[1].token).to.be.a("string");
            });
        });
    });
});