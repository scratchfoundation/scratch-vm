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
        describe("Sound Primitive Functions", () => {
            it("Play Sound", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sound", "single-target-playsound.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const spyCalls = extractCallsSpy(spy);
                expect(spyCalls[1].id).to.equal("BlockOP");
                expect(spyCalls[1].threadId).to.equal("id_0");
                expect(spyCalls[1].opCode).to.equal("sound_play");
                expect(spyCalls[1].args).to.eql({ SOUND_MENU: "Meow" });
                expect(spyCalls[1].token).to.be.a("string");
            });

            it("Play Sound Until Done", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sound", "single-target-playsounduntildone.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const spyCalls = extractCallsSpy(spy);
                expect(spyCalls[1].id).to.equal("BlockOP");
                expect(spyCalls[1].threadId).to.equal("id_0");
                expect(spyCalls[1].opCode).to.equal("sound_playuntildone");
                expect(spyCalls[1].args).to.eql({ SOUND_MENU: "Meow" });
                expect(spyCalls[1].token).to.be.a("string");
            });

            it("Stop All Sounds", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sound", "single-target-stopallsounds.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const spyCalls = extractCallsSpy(spy);
                expect(spyCalls[1].id).to.equal("BlockOP");
                expect(spyCalls[1].threadId).to.equal("id_0");
                expect(spyCalls[1].opCode).to.equal("sound_stopallsounds");
                expect(spyCalls[1].args).to.eql({});
                expect(spyCalls[1].token).to.be.a("string");
            });

            it("Set Sound Effect To", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sound", "single-target-setsoundeffectto.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const spyCalls = extractCallsSpy(spy);
                expect(spyCalls[1].id).to.equal("BlockOP");
                expect(spyCalls[1].threadId).to.equal("id_0");
                expect(spyCalls[1].opCode).to.equal("sound_seteffectto");
                expect(spyCalls[1].args).to.eql({ EFFECT: "pitch", VALUE: 100 });
                expect(spyCalls[1].token).to.be.a("string");
            });

            it("Change Sound Effect By", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sound", "single-target-changesoundeffectby.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const spyCalls = extractCallsSpy(spy);
                expect(spyCalls[1].id).to.equal("BlockOP");
                expect(spyCalls[1].threadId).to.equal("id_0");
                expect(spyCalls[1].opCode).to.equal("sound_changeeffectby");
                expect(spyCalls[1].args).to.eql({ EFFECT: "pitch", VALUE: 10 });
                expect(spyCalls[1].token).to.be.a("string");
            });

            it("Clear Sound Effects", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sound", "single-target-clearsoundeffects.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const spyCalls = extractCallsSpy(spy);
                expect(spyCalls[1].id).to.equal("BlockOP");
                expect(spyCalls[1].threadId).to.equal("id_0");
                expect(spyCalls[1].opCode).to.equal("sound_cleareffects");
                expect(spyCalls[1].args).to.eql({});
                expect(spyCalls[1].token).to.be.a("string");
            });

            it("Set Volume To", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sound", "single-target-setvolumeto.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const spyCalls = extractCallsSpy(spy);
                expect(spyCalls[1].id).to.equal("BlockOP");
                expect(spyCalls[1].threadId).to.equal("id_0");
                expect(spyCalls[1].opCode).to.equal("sound_setvolumeto");
                expect(spyCalls[1].args).to.eql({ VOLUME: 80 });
                expect(spyCalls[1].token).to.be.a("string");
            });

            it("Change Volume By", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sound", "single-target-changevolumeby.py"), "utf8");
                const executionObject = { event_whenflagclicked: ["id_0"] };

                await pyatchWorker.registerThreads(pythonCode, executionObject);
                await pyatchWorker.startHats("event_whenflagclicked");

                expect(spy).to.be.calledTwice;

                const spyCalls = extractCallsSpy(spy);
                expect(spyCalls[1].id).to.equal("BlockOP");
                expect(spyCalls[1].threadId).to.equal("id_0");
                expect(spyCalls[1].opCode).to.equal("sound_changevolumeby");
                expect(spyCalls[1].args).to.eql({ VOLUME: -20 });
                expect(spyCalls[1].token).to.be.a("string");
            });
        });
    });
});
