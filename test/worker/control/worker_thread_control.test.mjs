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
    describe("Thread Control", () => {
        it("Stop One Thread", async () => {
            const pythonCode = fs.readFileSync(path.join(__dirname, "python", "single-thread-interrupt.py"), "utf8");
            const executionObject = { event_whenflagclicked: ["id_0"] };

            await pyatchWorker.registerThreads(pythonCode, executionObject);
            // Starts thread and tries to stop is 50ms later
            await Promise.all([
                pyatchWorker.startHats("event_whenflagclicked"),
                setTimeout(() => {
                    pyatchWorker.stopThreads(["id_0"]);
                }, 50),
            ]);

            expect(spy).to.be.calledTwice;

            const spyCalls = extractCallsSpy(spy);

            expect(spyCalls[1].id).to.equal("BlockOP");
            expect(spyCalls[1].threadId).to.equal("id_0");
            expect(spyCalls[1].opCode).to.equal("motion_movesteps");
            expect(spyCalls[1].args).to.eql({ STEPS: 10 });
            expect(spyCalls[1].token).to.be.a("string");

            expect(spyCalls[0].id).to.equal("BlockOP");
            expect(spyCalls[0].threadId).to.equal("id_0");
            expect(spyCalls[0].opCode).to.equal("core_endthread");
            expect(spyCalls[0].args).to.eql({});
            expect(spyCalls[0].token).to.be.a("string");
        });

        it("Stop Multiple Threads", async () => {
            const pythonCode = fs.readFileSync(path.join(__dirname, "python", "multi-thread-interrupt.py"), "utf8");
            const executionObject = { event_whenflagclicked: ["id_0", "id_1", "id_2"] };

            await pyatchWorker.registerThreads(pythonCode, executionObject);
            // Starts thread and tries to stop is 50ms later
            await Promise.all([
                pyatchWorker.startHats("event_whenflagclicked"),
                setTimeout(() => {
                    pyatchWorker.stopAllThreads();
                }, 50),
            ]);

            const spyCalls = extractCallsSpy(spy);
            expect(spyCalls.length).to.equal(6);

            const moveStepsCount = spyCalls.filter((call) => call.opCode === "motion_movesteps").length;
            expect(moveStepsCount).to.equal(3);

            const endThreadCount = spyCalls.filter((call) => call.opCode === "core_endthread").length;
            expect(endThreadCount).to.equal(3);

            const uniqueThreadIds = [];
            spyCalls.forEach((call) => {
                if (!uniqueThreadIds.includes(call.threadId)) {
                    uniqueThreadIds.push(call.threadId);
                }
            });
            expect(uniqueThreadIds.length).to.equal(3);
        });

        it("Start Multiple Threads, Stop Single Thread", async () => {
            const pythonCode = fs.readFileSync(path.join(__dirname, "python", "multi-thread-interrupt.py"), "utf8");
            const executionObject = { event_whenflagclicked: ["id_0", "id_1", "id_2"] };

            await pyatchWorker.registerThreads(pythonCode, executionObject);
            // Starts thread and tries to stop is 50ms later
            await Promise.all([
                pyatchWorker.startHats("event_whenflagclicked"),
                setTimeout(() => {
                    pyatchWorker.stopThreads(["id_0", "id_1"]);
                }, 50),
            ]);

            const spyCalls = extractCallsSpy(spy);
            expect(spyCalls.length).to.equal(7);

            const moveStepsCount = spyCalls.filter((call) => call.opCode === "motion_movesteps").length;
            expect(moveStepsCount).to.equal(4);

            const endThreadCount = spyCalls.filter((call) => call.opCode === "core_endthread").length;
            expect(endThreadCount).to.equal(3);

            const uniqueThreadIds = [];
            spyCalls.forEach((call) => {
                if (!uniqueThreadIds.includes(call.threadId)) {
                    uniqueThreadIds.push(call.threadId);
                }
            });
            expect(uniqueThreadIds.length).to.equal(3);
        });

        it("Stop Non-existing Thread", async () => {
            const pythonCode = fs.readFileSync(path.join(__dirname, "python", "single-thread-interrupt.py"), "utf8");
            const executionObject = { event_whenflagclicked: ["id_0"] };

            await pyatchWorker.registerThreads(pythonCode, executionObject);
            // Starts thread and tries to stop is 50ms later
            await Promise.all([
                pyatchWorker.startHats("event_whenflagclicked"),
                setTimeout(() => {
                    pyatchWorker.stopThreads(["id_1"]);
                }, 50),
            ]);

            const spyCalls = extractCallsSpy(spy);
            expect(spyCalls.length).to.equal(3);

            const moveStepsCount = spyCalls.filter((call) => call.opCode === "motion_movesteps").length;
            expect(moveStepsCount).to.equal(2);

            const endThreadCount = spyCalls.filter((call) => call.opCode === "core_endthread").length;
            expect(endThreadCount).to.equal(1);

            const uniqueThreadIds = [];
            spyCalls.forEach((call) => {
                if (!uniqueThreadIds.includes(call.threadId)) {
                    uniqueThreadIds.push(call.threadId);
                }
            });
            expect(uniqueThreadIds.length).to.equal(1);
        });
    });
});
