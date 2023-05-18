import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";

import PyatchWorker from "../../src/worker/pyatch-worker.mjs";
import WorkerMessages from "../../src/worker/worker-messages.mjs";

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
                const threads = ["id_0"];

                await pyatchWorker.run(pythonCode, threads);

                expect(spy).to.be.calledTwice;

                const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
                expect(blockOpCall.id).to.equal("BlockOP");
                expect(blockOpCall.threadId).to.equal(threads[0]);
                expect(blockOpCall.opCode).to.equal("sound_play");
                expect(blockOpCall.args).to.eql({ SOUND_MENU: "Meow" });
                expect(blockOpCall.token).to.be.a("string");
            });

            it("Play Sound Until Done", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sound", "single-target-playsounduntildone.py"), "utf8");
                const threads = ["id_0"];

                await pyatchWorker.run(pythonCode, threads);

                expect(spy).to.be.calledTwice;

                const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
                expect(blockOpCall.id).to.equal("BlockOP");
                expect(blockOpCall.threadId).to.equal(threads[0]);
                expect(blockOpCall.opCode).to.equal("sound_playuntildone");
                expect(blockOpCall.args).to.eql({ SOUND_MENU: "Meow" });
                expect(blockOpCall.token).to.be.a("string");
            });

            it("Stop All Sounds", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sound", "single-target-stopallsounds.py"), "utf8");
                const threads = ["id_0"];

                await pyatchWorker.run(pythonCode, threads);

                expect(spy).to.be.calledTwice;

                const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
                expect(blockOpCall.id).to.equal("BlockOP");
                expect(blockOpCall.threadId).to.equal(threads[0]);
                expect(blockOpCall.opCode).to.equal("sound_stopallsounds");
                expect(blockOpCall.args).to.eql({});
                expect(blockOpCall.token).to.be.a("string");
            });

            it("Set Sound Effect To", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sound", "single-target-setsoundeffectto.py"), "utf8");
                const threads = ["id_0"];

                await pyatchWorker.run(pythonCode, threads);

                expect(spy).to.be.calledTwice;

                const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
                expect(blockOpCall.id).to.equal("BlockOP");
                expect(blockOpCall.threadId).to.equal(threads[0]);
                expect(blockOpCall.opCode).to.equal("sound_seteffectto");
                expect(blockOpCall.args).to.eql({ EFFECT: "pitch", VALUE: 100 });
                expect(blockOpCall.token).to.be.a("string");
            });

            it("Change Sound Effect By", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sound", "single-target-changesoundeffectby.py"), "utf8");
                const threads = ["id_0"];

                await pyatchWorker.run(pythonCode, threads);

                expect(spy).to.be.calledTwice;

                const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
                expect(blockOpCall.id).to.equal("BlockOP");
                expect(blockOpCall.threadId).to.equal(threads[0]);
                expect(blockOpCall.opCode).to.equal("sound_changeeffectby");
                expect(blockOpCall.args).to.eql({ EFFECT: "pitch", VALUE: 10 });
                expect(blockOpCall.token).to.be.a("string");
            });

            it("Clear Sound Effects", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sound", "single-target-clearsoundeffects.py"), "utf8");
                const threads = ["id_0"];

                await pyatchWorker.run(pythonCode, threads);

                expect(spy).to.be.calledTwice;

                const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
                expect(blockOpCall.id).to.equal("BlockOP");
                expect(blockOpCall.threadId).to.equal(threads[0]);
                expect(blockOpCall.opCode).to.equal("sound_cleareffects");
                expect(blockOpCall.args).to.eql({});
                expect(blockOpCall.token).to.be.a("string");
            });

            it("Set Volume To", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sound", "single-target-setvolumeto.py"), "utf8");
                const threads = ["id_0"];

                await pyatchWorker.run(pythonCode, threads);

                expect(spy).to.be.calledTwice;

                const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
                expect(blockOpCall.id).to.equal("BlockOP");
                expect(blockOpCall.threadId).to.equal(threads[0]);
                expect(blockOpCall.opCode).to.equal("sound_setvolumeto");
                expect(blockOpCall.args).to.eql({ VOLUME: 80 });
                expect(blockOpCall.token).to.be.a("string");
            });

            it("Change Volume By", async () => {
                const pythonCode = fs.readFileSync(path.join(__dirname, "python", "sound", "single-target-changevolumeby.py"), "utf8");
                const threads = ["id_0"];

                await pyatchWorker.run(pythonCode, threads);

                expect(spy).to.be.calledTwice;

                const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
                expect(blockOpCall.id).to.equal("BlockOP");
                expect(blockOpCall.threadId).to.equal(threads[0]);
                expect(blockOpCall.opCode).to.equal("sound_changevolumeby");
                expect(blockOpCall.args).to.eql({ VOLUME: -20 });
                expect(blockOpCall.token).to.be.a("string");
            });
        });
    });
});
