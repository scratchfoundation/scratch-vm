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
            it("Is Touching", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sensing", "single-target-istouching.py"), "utf8");
                const threads = ["id_0"];

                const mockedResult = false;

                pyatchWorker._blockOPCallback = createBlockOPTestCallback(spy, mockedResult);
                
                await pyatchWorker.run(pythonCode, threads);
                
                expect(spy).to.be.calledThrice;

                const blockOpCalls = extractCallsSpy(spy);

                expect(blockOpCalls[2].id).to.equal("BlockOP");
                expect(blockOpCalls[2].threadId).to.equal(threads[0]);
                expect(blockOpCalls[2].opCode).to.equal("sensing_touchingobject");
                expect(blockOpCalls[2].args).to.eql({ TOUCHINGOBJECTMENU: "Cat" });
                expect(blockOpCalls[2].token).to.be.a("string");

                // The reason for this test is to ensure that the proper value was returned in the python env
                expect(blockOpCalls[1].id).to.equal("BlockOP");
                expect(blockOpCalls[1].threadId).to.equal(threads[0]);
                expect(blockOpCalls[1].opCode).to.equal("looks_say");
                expect(blockOpCalls[1].args).to.eql({ MESSAGE: mockedResult });
                expect(blockOpCalls[1].token).to.be.a("string");
            });
            it("Is Touching Color", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sensing", "single-target-istouchingcolor.py"), "utf8");
                const threads = ["id_0"];

                const mockedResult = false;

                pyatchWorker._blockOPCallback = createBlockOPTestCallback(spy, mockedResult);
                
                await pyatchWorker.run(pythonCode, threads);
                
                expect(spy).to.be.calledThrice;

                const blockOpCalls = extractCallsSpy(spy);

                expect(blockOpCalls[2].id).to.equal("BlockOP");
                expect(blockOpCalls[2].threadId).to.equal(threads[0]);
                expect(blockOpCalls[2].opCode).to.equal("sensing_touchingcolor");
                expect(blockOpCalls[2].args).to.eql({ COLOR: "green" });
                expect(blockOpCalls[2].token).to.be.a("string");

                // The reason for this test is to ensure that the proper value was returned in the python env
                expect(blockOpCalls[1].id).to.equal("BlockOP");
                expect(blockOpCalls[1].threadId).to.equal(threads[0]);
                expect(blockOpCalls[1].opCode).to.equal("looks_say");
                expect(blockOpCalls[1].args).to.eql({ MESSAGE: mockedResult });
                expect(blockOpCalls[1].token).to.be.a("string");
            });
            it("Color Touching Color", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sensing", "single-target-coloristouchingcolor.py"), "utf8");
                const threads = ["id_0"];

                const mockedResult = false;

                pyatchWorker._blockOPCallback = createBlockOPTestCallback(spy, mockedResult);
                
                await pyatchWorker.run(pythonCode, threads);
                
                expect(spy).to.be.calledThrice;

                const blockOpCalls = extractCallsSpy(spy);

                expect(blockOpCalls[2].id).to.equal("BlockOP");
                expect(blockOpCalls[2].threadId).to.equal(threads[0]);
                expect(blockOpCalls[2].opCode).to.equal("sensing_coloristouchingcolor");
                expect(blockOpCalls[2].args).to.eql({ COLOR: "green", COLOR2: "red" });
                expect(blockOpCalls[2].token).to.be.a("string");

                // The reason for this test is to ensure that the proper value was returned in the python env
                expect(blockOpCalls[1].id).to.equal("BlockOP");
                expect(blockOpCalls[1].threadId).to.equal(threads[0]);
                expect(blockOpCalls[1].opCode).to.equal("looks_say");
                expect(blockOpCalls[1].args).to.eql({ MESSAGE: mockedResult });
                expect(blockOpCalls[1].token).to.be.a("string");
            });
            it("Distance To", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sensing", "single-target-distanceto.py"), "utf8");
                const threads = ["id_0"];

                const mockedResult = 14;

                pyatchWorker._blockOPCallback = createBlockOPTestCallback(spy, mockedResult);
                
                await pyatchWorker.run(pythonCode, threads);
                
                expect(spy).to.be.calledThrice;

                const blockOpCalls = extractCallsSpy(spy);

                expect(blockOpCalls[2].id).to.equal("BlockOP");
                expect(blockOpCalls[2].threadId).to.equal(threads[0]);
                expect(blockOpCalls[2].opCode).to.equal("sensing_distanceto");
                expect(blockOpCalls[2].args).to.eql({ DISTANCETOMENU: "Cat" });
                expect(blockOpCalls[2].token).to.be.a("string");

                // The reason for this test is to ensure that the proper value was returned in the python env
                expect(blockOpCalls[1].id).to.equal("BlockOP");
                expect(blockOpCalls[1].threadId).to.equal(threads[0]);
                expect(blockOpCalls[1].opCode).to.equal("looks_say");
                expect(blockOpCalls[1].args).to.eql({ MESSAGE: mockedResult });
                expect(blockOpCalls[1].token).to.be.a("string");
            });
            it("Get Timer", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sensing", "single-target-gettimer.py"), "utf8");
                const threads = ["id_0"];

                const mockedResult = 14.762;

                pyatchWorker._blockOPCallback = createBlockOPTestCallback(spy, mockedResult);
                
                await pyatchWorker.run(pythonCode, threads);
                
                expect(spy).to.be.calledThrice;

                const blockOpCalls = extractCallsSpy(spy);

                expect(blockOpCalls[2].id).to.equal("BlockOP");
                expect(blockOpCalls[2].threadId).to.equal(threads[0]);
                expect(blockOpCalls[2].opCode).to.equal("sensing_timer");
                expect(blockOpCalls[2].args).to.eql({});
                expect(blockOpCalls[2].token).to.be.a("string");

                // The reason for this test is to ensure that the proper value was returned in the python env
                expect(blockOpCalls[1].id).to.equal("BlockOP");
                expect(blockOpCalls[1].threadId).to.equal(threads[0]);
                expect(blockOpCalls[1].opCode).to.equal("looks_say");
                expect(blockOpCalls[1].args).to.eql({ MESSAGE: mockedResult });
                expect(blockOpCalls[1].token).to.be.a("string");
            });
            it("Get Attribute Of", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sensing", "single-target-getattributeof.py"), "utf8");
                const threads = ["id_0"];

                const mockedResult = 70;

                pyatchWorker._blockOPCallback = createBlockOPTestCallback(spy, mockedResult);
                
                await pyatchWorker.run(pythonCode, threads);
                
                expect(spy).to.be.calledThrice;

                const blockOpCalls = extractCallsSpy(spy);

                expect(blockOpCalls[2].id).to.equal("BlockOP");
                expect(blockOpCalls[2].threadId).to.equal(threads[0]);
                expect(blockOpCalls[2].opCode).to.equal("sensing_of");
                expect(blockOpCalls[2].args).to.eql({ OBJECT: "Cat", PROPERTY: "size"});
                expect(blockOpCalls[2].token).to.be.a("string");

                // The reason for this test is to ensure that the proper value was returned in the python env
                expect(blockOpCalls[1].id).to.equal("BlockOP");
                expect(blockOpCalls[1].threadId).to.equal(threads[0]);
                expect(blockOpCalls[1].opCode).to.equal("looks_say");
                expect(blockOpCalls[1].args).to.eql({ MESSAGE: mockedResult });
                expect(blockOpCalls[1].token).to.be.a("string");
            });
            it("Get Mouse X", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sensing", "single-target-getmousex.py"), "utf8");
                const threads = ["id_0"];

                const mockedResult = -70;

                pyatchWorker._blockOPCallback = createBlockOPTestCallback(spy, mockedResult);
                
                await pyatchWorker.run(pythonCode, threads);
                
                expect(spy).to.be.calledThrice;

                const blockOpCalls = extractCallsSpy(spy);

                expect(blockOpCalls[2].id).to.equal("BlockOP");
                expect(blockOpCalls[2].threadId).to.equal(threads[0]);
                expect(blockOpCalls[2].opCode).to.equal("sensing_mousex");
                expect(blockOpCalls[2].args).to.eql({});
                expect(blockOpCalls[2].token).to.be.a("string");

                // The reason for this test is to ensure that the proper value was returned in the python env
                expect(blockOpCalls[1].id).to.equal("BlockOP");
                expect(blockOpCalls[1].threadId).to.equal(threads[0]);
                expect(blockOpCalls[1].opCode).to.equal("looks_say");
                expect(blockOpCalls[1].args).to.eql({ MESSAGE: mockedResult });
                expect(blockOpCalls[1].token).to.be.a("string");
            });
            it("Get Mouse Y", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sensing", "single-target-getmousey.py"), "utf8");
                const threads = ["id_0"];

                const mockedResult = 70;

                pyatchWorker._blockOPCallback = createBlockOPTestCallback(spy, mockedResult);
                
                await pyatchWorker.run(pythonCode, threads);
                
                expect(spy).to.be.calledThrice;

                const blockOpCalls = extractCallsSpy(spy);

                expect(blockOpCalls[2].id).to.equal("BlockOP");
                expect(blockOpCalls[2].threadId).to.equal(threads[0]);
                expect(blockOpCalls[2].opCode).to.equal("sensing_mousey");
                expect(blockOpCalls[2].args).to.eql({});
                expect(blockOpCalls[2].token).to.be.a("string");

                // The reason for this test is to ensure that the proper value was returned in the python env
                expect(blockOpCalls[1].id).to.equal("BlockOP");
                expect(blockOpCalls[1].threadId).to.equal(threads[0]);
                expect(blockOpCalls[1].opCode).to.equal("looks_say");
                expect(blockOpCalls[1].args).to.eql({ MESSAGE: mockedResult });
                expect(blockOpCalls[1].token).to.be.a("string");
            });
            it("Is Mouse Down", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sensing", "single-target-ismousedown.py"), "utf8");
                const threads = ["id_0"];

                const mockedResult = true;

                pyatchWorker._blockOPCallback = createBlockOPTestCallback(spy, mockedResult);
                
                await pyatchWorker.run(pythonCode, threads);
                
                expect(spy).to.be.calledThrice;

                const blockOpCalls = extractCallsSpy(spy);

                expect(blockOpCalls[2].id).to.equal("BlockOP");
                expect(blockOpCalls[2].threadId).to.equal(threads[0]);
                expect(blockOpCalls[2].opCode).to.equal("sensing_mousedown");
                expect(blockOpCalls[2].args).to.eql({});
                expect(blockOpCalls[2].token).to.be.a("string");

                // The reason for this test is to ensure that the proper value was returned in the python env
                expect(blockOpCalls[1].id).to.equal("BlockOP");
                expect(blockOpCalls[1].threadId).to.equal(threads[0]);
                expect(blockOpCalls[1].opCode).to.equal("looks_say");
                expect(blockOpCalls[1].args).to.eql({ MESSAGE: mockedResult });
                expect(blockOpCalls[1].token).to.be.a("string");
            });
            it("Is Key Pressed", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sensing", "single-target-iskeypressed.py"), "utf8");
                const threads = ["id_0"];

                const mockedResult = true;

                pyatchWorker._blockOPCallback = createBlockOPTestCallback(spy, mockedResult);
                
                await pyatchWorker.run(pythonCode, threads);
                
                expect(spy).to.be.calledThrice;

                const blockOpCalls = extractCallsSpy(spy);

                expect(blockOpCalls[2].id).to.equal("BlockOP");
                expect(blockOpCalls[2].threadId).to.equal(threads[0]);
                expect(blockOpCalls[2].opCode).to.equal("sensing_keypressed");
                expect(blockOpCalls[2].args).to.eql({ KEY_OPTION: "g" });
                expect(blockOpCalls[2].token).to.be.a("string");

                // The reason for this test is to ensure that the proper value was returned in the python env
                expect(blockOpCalls[1].id).to.equal("BlockOP");
                expect(blockOpCalls[1].threadId).to.equal(threads[0]);
                expect(blockOpCalls[1].opCode).to.equal("looks_say");
                expect(blockOpCalls[1].args).to.eql({ MESSAGE: mockedResult });
                expect(blockOpCalls[1].token).to.be.a("string");
            });
            it("Current", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sensing", "single-target-current.py"), "utf8");
                const threads = ["id_0"];

                const mockedResult = 10;

                pyatchWorker._blockOPCallback = createBlockOPTestCallback(spy, mockedResult);
                
                await pyatchWorker.run(pythonCode, threads);
                
                expect(spy).to.be.calledThrice;

                const blockOpCalls = extractCallsSpy(spy);

                expect(blockOpCalls[2].id).to.equal("BlockOP");
                expect(blockOpCalls[2].threadId).to.equal(threads[0]);
                expect(blockOpCalls[2].opCode).to.equal("sensing_current");
                expect(blockOpCalls[2].args).to.eql({ CURRENTMENU: "hour" });
                expect(blockOpCalls[2].token).to.be.a("string");

                // The reason for this test is to ensure that the proper value was returned in the python env
                expect(blockOpCalls[1].id).to.equal("BlockOP");
                expect(blockOpCalls[1].threadId).to.equal(threads[0]);
                expect(blockOpCalls[1].opCode).to.equal("looks_say");
                expect(blockOpCalls[1].args).to.eql({ MESSAGE: mockedResult });
                expect(blockOpCalls[1].token).to.be.a("string");
            });
            it("Days Since 2000", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sensing", "single-target-dayssince2000.py"), "utf8");
                const threads = ["id_0"];

                const mockedResult = 14876;

                pyatchWorker._blockOPCallback = createBlockOPTestCallback(spy, mockedResult);
                
                await pyatchWorker.run(pythonCode, threads);
                
                expect(spy).to.be.calledThrice;

                const blockOpCalls = extractCallsSpy(spy);

                expect(blockOpCalls[2].id).to.equal("BlockOP");
                expect(blockOpCalls[2].threadId).to.equal(threads[0]);
                expect(blockOpCalls[2].opCode).to.equal("sensing_dayssince2000");
                expect(blockOpCalls[2].args).to.eql({});
                expect(blockOpCalls[2].token).to.be.a("string");

                // The reason for this test is to ensure that the proper value was returned in the python env
                expect(blockOpCalls[1].id).to.equal("BlockOP");
                expect(blockOpCalls[1].threadId).to.equal(threads[0]);
                expect(blockOpCalls[1].opCode).to.equal("looks_say");
                expect(blockOpCalls[1].args).to.eql({ MESSAGE: mockedResult });
                expect(blockOpCalls[1].token).to.be.a("string");
            });
            it("Get Loudness", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sensing", "single-target-getloudness.py"), "utf8");
                const threads = ["id_0"];

                const mockedResult = 87;

                pyatchWorker._blockOPCallback = createBlockOPTestCallback(spy, mockedResult);
                
                await pyatchWorker.run(pythonCode, threads);
                
                expect(spy).to.be.calledThrice;

                const blockOpCalls = extractCallsSpy(spy);

                expect(blockOpCalls[2].id).to.equal("BlockOP");
                expect(blockOpCalls[2].threadId).to.equal(threads[0]);
                expect(blockOpCalls[2].opCode).to.equal("sensing_loudness");
                expect(blockOpCalls[2].args).to.eql({});
                expect(blockOpCalls[2].token).to.be.a("string");

                // The reason for this test is to ensure that the proper value was returned in the python env
                expect(blockOpCalls[1].id).to.equal("BlockOP");
                expect(blockOpCalls[1].threadId).to.equal(threads[0]);
                expect(blockOpCalls[1].opCode).to.equal("looks_say");
                expect(blockOpCalls[1].args).to.eql({ MESSAGE: mockedResult });
                expect(blockOpCalls[1].token).to.be.a("string");
            });
            it("Get Username", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sensing", "single-target-getusername.py"), "utf8");
                const threads = ["id_0"];

                const mockedResult = "DuncanJohnson";

                pyatchWorker._blockOPCallback = createBlockOPTestCallback(spy, mockedResult);
                
                await pyatchWorker.run(pythonCode, threads);
                
                expect(spy).to.be.calledThrice;

                const blockOpCalls = extractCallsSpy(spy);

                expect(blockOpCalls[2].id).to.equal("BlockOP");
                expect(blockOpCalls[2].threadId).to.equal(threads[0]);
                expect(blockOpCalls[2].opCode).to.equal("sensing_username");
                expect(blockOpCalls[2].args).to.eql({});
                expect(blockOpCalls[2].token).to.be.a("string");

                // The reason for this test is to ensure that the proper value was returned in the python env
                expect(blockOpCalls[1].id).to.equal("BlockOP");
                expect(blockOpCalls[1].threadId).to.equal(threads[0]);
                expect(blockOpCalls[1].opCode).to.equal("looks_say");
                expect(blockOpCalls[1].args).to.eql({ MESSAGE: mockedResult });
                expect(blockOpCalls[1].token).to.be.a("string");
            });
            it("Reset Timer", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sensing", "single-target-resettimer.py"), "utf8");
                const threads = ["id_0"];

                await pyatchWorker.run(pythonCode, threads);

                expect(spy).to.be.calledTwice;

                const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
                expect(blockOpCall.id).to.equal("BlockOP");
                expect(blockOpCall.threadId).to.equal(threads[0]);
                expect(blockOpCall.opCode).to.equal("sensing_resettimer");
                expect(blockOpCall.args).to.eql({});
                expect(blockOpCall.token).to.be.a("string");
            });

            it("Set Drag Mode", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sensing", "single-target-setdragmode.py"), "utf8");
                const threads = ["id_0"];

                await pyatchWorker.run(pythonCode, threads);

                expect(spy).to.be.calledTwice;

                const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
                expect(blockOpCall.id).to.equal("BlockOP");
                expect(blockOpCall.threadId).to.equal(threads[0]);
                expect(blockOpCall.opCode).to.equal("sensing_setdragmode");
                expect(blockOpCall.args).to.eql({ DRAG_MODE: "draggable" });
                expect(blockOpCall.token).to.be.a("string");
            });
        });
    });
});