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
        describe("Event Hats", () => {
            it("One Event Registered, One Event Start", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "events", "single-thread.py"), "utf8");
                const eventMap = {
                    event_whenflagclicked: ["id_0"],
                };

                await pyatchWorker.registerThreads(pythonCode, eventMap);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const blockOpCalls = extractCallsSpy(spy);

                expect(blockOpCalls[1].id).to.equal("BlockOP");
                expect(blockOpCalls[1].threadId).to.equal(eventMap.event_whenflagclicked[0]);
                expect(blockOpCalls[1].opCode).to.equal("motion_movesteps");
                expect(blockOpCalls[1].args).to.eql({ STEPS: 10 });
                expect(blockOpCalls[1].token).to.be.a("string");
            });

            it("Two Event Registered, Two Event Start", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "events", "single-thread.py"), "utf8");
                const eventMap = {
                    event_whenflagclicked: ["id_0", "id_2"],
                    event_whenkeypressed: ["id_1"],
                };

                await pyatchWorker.registerThreads(pythonCode, eventMap);
                Promise.all(pyatchWorker.startHats("event_whenflagclicked"), pyatchWorker.startHats("event_whenkeypressed"));

                expect(spy).to.be.called;

                const blockOpCalls = extractCallsSpy(spy);

                expect(blockOpCalls[1].id).to.equal("BlockOP");
                expect(blockOpCalls[1].threadId).to.equal(eventMap.event_whenflagclicked[0]);
                expect(blockOpCalls[1].opCode).to.equal("looks_say");
                expect(blockOpCalls[1].args).to.eql({ MESSAGE: "Thread 0" });
                expect(blockOpCalls[1].token).to.be.a("string");

                expect(blockOpCalls[3].id).to.equal("BlockOP");
                expect(blockOpCalls[3].threadId).to.equal(eventMap.event_whenflagclicked[1]);
                expect(blockOpCalls[3].opCode).to.equal("looks_say");
                expect(blockOpCalls[3].args).to.eql({ MESSAGE: "Thread 1" });
                expect(blockOpCalls[3].token).to.be.a("string");

                expect(blockOpCalls[5].id).to.equal("BlockOP");
                expect(blockOpCalls[5].threadId).to.equal(eventMap.event_whenkeypressed[0]);
                expect(blockOpCalls[5].opCode).to.equal("looks_say");
                expect(blockOpCalls[5].args).to.eql({ MESSAGE: "Thread 2" });
                expect(blockOpCalls[5].token).to.be.a("string");
            });

            it("Two Event Registered, One Event Start", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "events", "single-thread.py"), "utf8");
                const eventMap = {
                    event_whenflagclicked: ["id_0", "id_2"],
                    event_whenkeypressed: ["id_1"],
                };

                await pyatchWorker.registerThreads(pythonCode, eventMap);
                await pyatchWorker.startHats("event_whenkeypressed");

                expect(spy).to.be.called;

                const blockOpCalls = extractCallsSpy(spy);

                expect(blockOpCalls[1].id).to.equal("BlockOP");
                expect(blockOpCalls[1].threadId).to.equal(eventMap.event_whenkeypressed[0]);
                expect(blockOpCalls[1].opCode).to.equal("looks_say");
                expect(blockOpCalls[1].args).to.eql({ MESSAGE: "Thread 2" });
                expect(blockOpCalls[1].token).to.be.a("string");
            });

            it("One Event Registered w/ Option, One Event w/ Option Start", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "events", "single-thread.py"), "utf8");
                const broadcastMessageId = "message1";
                const eventMap = {
                    event_whenbroadcastreceived: {
                        [broadcastMessageId]: ["id_0"],
                    },
                };

                await pyatchWorker.registerThreads(pythonCode, eventMap);
                await pyatchWorker.startHats("event_whenbroadcastreceived", broadcastMessageId);

                expect(spy).to.be.called;

                const blockOpCalls = extractCallsSpy(spy);

                expect(blockOpCalls[1].id).to.equal("BlockOP");
                expect(blockOpCalls[1].threadId).to.equal(eventMap.event_whenkeypressed[0]);
                expect(blockOpCalls[1].opCode).to.equal("looks_say");
                expect(blockOpCalls[1].args).to.eql({ MESSAGE: "Thread 2" });
                expect(blockOpCalls[1].token).to.be.a("string");
            });

            it("Two Event Registered, No Event Start", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "events", "single-thread.py"), "utf8");
                const eventMap = {
                    event_whenflagclicked: ["id_0", "id_2"],
                    event_whenkeypressed: ["id_1"],
                };

                await pyatchWorker.blocregisterThreads(pythonCode, eventMap);
                await pyatchWorker.startHats();

                expect(spy).to.not.be.called;
            });
        });
    });
});
