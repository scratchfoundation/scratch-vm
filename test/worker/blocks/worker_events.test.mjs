import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";

import PyatchWorker from "../../../src/worker/pyatch-worker.mjs";
import WorkerMessages from "../../../src/worker/worker-messages.mjs";

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
        describe("Event Primitive Functions", () => {
            it("Broadcast", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "events", "single-target-broadcast.py"), "utf8");
                const execObj = { event_whenflagclicked: ["id_0"] };

                await pyatchWorker.registerThreads(pythonCode, execObj);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
                expect(blockOpCall.id).to.equal("BlockOP");
                expect(blockOpCall.threadId).to.equal(execObj[0]);
                expect(blockOpCall.opCode).to.equal("event_broadcast");
                expect(blockOpCall.args).to.eql({ BROADCAST_OPTION: { id: "message1", name: "message1" } });
                expect(blockOpCall.token).to.be.a("string");
            });

            it("Broadcast and Wait", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "events", "single-target-broadcast-and-wait.py"), "utf8");
                const execObj = { event_whenflagclicked: ["id_0"] };

                await pyatchWorker.registerThreads(pythonCode, execObj);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
                expect(blockOpCall.id).to.equal("BlockOP");
                expect(blockOpCall.threadId).to.equal(execObj[0]);
                expect(blockOpCall.opCode).to.equal("event_broadcastandwait");
                expect(blockOpCall.args).to.eql({ BROADCAST_OPTION: { id: "message1", name: "message1" } });
                expect(blockOpCall.token).to.be.a("string");
            });
        });
    });
});
