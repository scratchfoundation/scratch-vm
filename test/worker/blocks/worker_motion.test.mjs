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

describe("Patch Worker Functionality", () => {
    describe("Run Patch Functions", () => {
        describe("Threading Messages", () => {
            it("End Of Thread Message", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "motion", "single-target-move.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const spyCalls = extractCallsSpy(spy);
                expect(spyCalls[0].id).to.equal("BlockOP");
                expect(spyCalls[0].threadId).to.equal("id_0");
                expect(spyCalls[0].opCode).to.equal("core_endthread");
                expect(spyCalls[0].args).to.eql({});
                expect(spyCalls[0].token).to.be.a("string");
            });
        });
        describe("Motion Primitive Functions", () => {
            it("Move", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "motion", "single-target-move.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const spyCalls = extractCallsSpy(spy);
                expect(spyCalls[1].id).to.equal("BlockOP");
                expect(spyCalls[1].threadId).to.equal("id_0");
                expect(spyCalls[1].opCode).to.equal("motion_movesteps");
                expect(spyCalls[1].args).to.eql({ STEPS: 10 });
                expect(spyCalls[1].token).to.be.a("string");
            });

            it("Go To XY", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "motion", "single-target-gotoxy.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const spyCalls = extractCallsSpy(spy);
                expect(spyCalls[1].id).to.equal("BlockOP");
                expect(spyCalls[1].threadId).to.equal("id_0");
                expect(spyCalls[1].opCode).to.equal("motion_gotoxy");
                expect(spyCalls[1].args).to.eql({ X: 10, Y: 5 });
                expect(spyCalls[1].token).to.be.a("string");
            });

            it("Go To", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "motion", "single-target-goto.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const spyCalls = extractCallsSpy(spy);
                expect(spyCalls[1].id).to.equal("BlockOP");
                expect(spyCalls[1].threadId).to.equal("id_0");
                expect(spyCalls[1].opCode).to.equal("motion_goto");
                expect(spyCalls[1].args).to.eql({ TO: "target1" });
                expect(spyCalls[1].token).to.be.a("string");
            });

            it("Turn Right", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "motion", "single-target-turnright.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const spyCalls = extractCallsSpy(spy);
                expect(spyCalls[1].id).to.equal("BlockOP");
                expect(spyCalls[1].threadId).to.equal("id_0");
                expect(spyCalls[1].opCode).to.equal("motion_turnright");
                expect(spyCalls[1].args).to.eql({ DEGREES: 90 });
                expect(spyCalls[1].token).to.be.a("string");
            });

            it("Turn Left", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "motion", "single-target-turnleft.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const spyCalls = extractCallsSpy(spy);
                expect(spyCalls[1].id).to.equal("BlockOP");
                expect(spyCalls[1].threadId).to.equal("id_0");
                expect(spyCalls[1].opCode).to.equal("motion_turnleft");
                expect(spyCalls[1].args).to.eql({ DEGREES: 90 });
                expect(spyCalls[1].token).to.be.a("string");
            });

            it("Point In Direction", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "motion", "single-target-pointindirection.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const spyCalls = extractCallsSpy(spy);
                expect(spyCalls[1].id).to.equal("BlockOP");
                expect(spyCalls[1].threadId).to.equal("id_0");
                expect(spyCalls[1].opCode).to.equal("motion_pointindirection");
                expect(spyCalls[1].args).to.eql({ DIRECTION: 90 });
                expect(spyCalls[1].token).to.be.a("string");
            });

            it("Point Towards", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "motion", "single-target-pointtowards.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const spyCalls = extractCallsSpy(spy);
                expect(spyCalls[1].id).to.equal("BlockOP");
                expect(spyCalls[1].threadId).to.equal("id_0");
                expect(spyCalls[1].opCode).to.equal("motion_pointtowards");
                expect(spyCalls[1].args).to.eql({ TOWARDS: "target1" });
                expect(spyCalls[1].token).to.be.a("string");
            });

            it("Glide", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "motion", "single-target-glide.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const spyCalls = extractCallsSpy(spy);
                expect(spyCalls[1].id).to.equal("BlockOP");
                expect(spyCalls[1].threadId).to.equal("id_0");
                expect(spyCalls[1].opCode).to.equal("motion_glidesecstoxy");
                expect(spyCalls[1].args).to.eql({ SECS: 1, X: 10, Y: 5 });
                expect(spyCalls[1].token).to.be.a("string");
            });

            it("Glide To", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "motion", "single-target-glideto.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const spyCalls = extractCallsSpy(spy);
                expect(spyCalls[1].id).to.equal("BlockOP");
                expect(spyCalls[1].threadId).to.equal("id_0");
                expect(spyCalls[1].opCode).to.equal("motion_glideto");
                expect(spyCalls[1].args).to.eql({ SECS: 1, TO: "target1" });
                expect(spyCalls[1].token).to.be.a("string");
            });

            it("If On Edge Bounce", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "motion", "single-target-ifonedgebounce.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const spyCalls = extractCallsSpy(spy);
                expect(spyCalls[1].id).to.equal("BlockOP");
                expect(spyCalls[1].threadId).to.equal("id_0");
                expect(spyCalls[1].opCode).to.equal("motion_ifonedgebounce");
                expect(spyCalls[1].args).to.eql({});
                expect(spyCalls[1].token).to.be.a("string");
            });

            it("Set Rotation Style", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "motion", "single-target-setrotationstyle.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const spyCalls = extractCallsSpy(spy);
                expect(spyCalls[1].id).to.equal("BlockOP");
                expect(spyCalls[1].threadId).to.equal("id_0");
                expect(spyCalls[1].opCode).to.equal("motion_setrotationstyle");
                expect(spyCalls[1].args).to.eql({ STYLE: "free" });
                expect(spyCalls[1].token).to.be.a("string");
            });

            it("Change X", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "motion", "single-target-changex.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const spyCalls = extractCallsSpy(spy);
                expect(spyCalls[1].id).to.equal("BlockOP");
                expect(spyCalls[1].threadId).to.equal("id_0");
                expect(spyCalls[1].opCode).to.equal("motion_changexby");
                expect(spyCalls[1].args).to.eql({ DX: 10 });
                expect(spyCalls[1].token).to.be.a("string");
            });

            it("Set X", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "motion", "single-target-setx.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const spyCalls = extractCallsSpy(spy);
                expect(spyCalls[1].id).to.equal("BlockOP");
                expect(spyCalls[1].threadId).to.equal("id_0");
                expect(spyCalls[1].opCode).to.equal("motion_setx");
                expect(spyCalls[1].args).to.eql({ X: 10 });
                expect(spyCalls[1].token).to.be.a("string");
            });

            it("Change Y", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "motion", "single-target-changey.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const spyCalls = extractCallsSpy(spy);
                expect(spyCalls[1].id).to.equal("BlockOP");
                expect(spyCalls[1].threadId).to.equal("id_0");
                expect(spyCalls[1].opCode).to.equal("motion_changeyby");
                expect(spyCalls[1].args).to.eql({ DY: 10 });
                expect(spyCalls[1].token).to.be.a("string");
            });

            it("Set Y", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "motion", "single-target-sety.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const spyCalls = extractCallsSpy(spy);
                expect(spyCalls[1].id).to.equal("BlockOP");
                expect(spyCalls[1].threadId).to.equal("id_0");
                expect(spyCalls[1].opCode).to.equal("motion_sety");
                expect(spyCalls[1].args).to.eql({ Y: 10 });
                expect(spyCalls[1].token).to.be.a("string");
            });

            it("Get X", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "motion", "single-target-getx.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                const mockedX = 5;

                pyatchWorker._blockOPCallback = createBlockOPTestCallback(spy, mockedX);

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledThrice;

                const blockOpCalls = extractCallsSpy(spy);

                expect(blockOpCalls[2].id).to.equal("BlockOP");
                expect(blockOpCalls[2].threadId).to.equal("id_0");
                expect(blockOpCalls[2].opCode).to.equal("motion_xposition");
                expect(blockOpCalls[2].args).to.eql({});
                expect(blockOpCalls[2].token).to.be.a("string");

                // The reason for this test is to ensure that the proper value was returned in the python env
                expect(blockOpCalls[1].id).to.equal("BlockOP");
                expect(blockOpCalls[1].threadId).to.equal("id_0");
                expect(blockOpCalls[1].opCode).to.equal("motion_setx");
                expect(blockOpCalls[1].args).to.eql({ X: mockedX });
                expect(blockOpCalls[1].token).to.be.a("string");
            });

            it("Get Y", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "motion", "single-target-gety.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                const mockedY = 5;

                pyatchWorker._blockOPCallback = createBlockOPTestCallback(spy, mockedY);

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledThrice;

                const blockOpCalls = extractCallsSpy(spy);

                expect(blockOpCalls[2].id).to.equal("BlockOP");
                expect(blockOpCalls[2].threadId).to.equal("id_0");
                expect(blockOpCalls[2].opCode).to.equal("motion_yposition");
                expect(blockOpCalls[2].args).to.eql({});
                expect(blockOpCalls[2].token).to.be.a("string");

                expect(blockOpCalls[1].id).to.equal("BlockOP");
                expect(blockOpCalls[1].threadId).to.equal("id_0");
                expect(blockOpCalls[1].opCode).to.equal("motion_sety");
                expect(blockOpCalls[1].args).to.eql({ Y: mockedY });
                expect(blockOpCalls[1].token).to.be.a("string");
            });

            it("Get Direction", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "motion", "single-target-getdirection.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                const mockedDirection = 90;

                pyatchWorker._blockOPCallback = createBlockOPTestCallback(spy, mockedDirection);

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledThrice;

                const blockOpCalls = extractCallsSpy(spy);

                expect(blockOpCalls[2].id).to.equal("BlockOP");
                expect(blockOpCalls[2].threadId).to.equal("id_0");
                expect(blockOpCalls[2].opCode).to.equal("motion_direction");
                expect(blockOpCalls[2].args).to.eql({});
                expect(blockOpCalls[2].token).to.be.a("string");

                expect(blockOpCalls[1].id).to.equal("BlockOP");
                expect(blockOpCalls[1].threadId).to.equal("id_0");
                expect(blockOpCalls[1].opCode).to.equal("motion_pointindirection");
                expect(blockOpCalls[1].args).to.eql({ DIRECTION: mockedDirection });
                expect(blockOpCalls[1].token).to.be.a("string");
            });
        });
    });
});
