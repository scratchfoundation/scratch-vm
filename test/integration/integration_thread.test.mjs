import sinonChai from "sinon-chai";
import chai from "chai";
import * as url from "url";
import fs from "fs";
import path from "path";
import VirtualMachine from "../../src/virtual-machine.mjs";
import Sprite from "../../src/sprites/sprite.mjs";
import RenderedTarget from "../../src/sprites/rendered-target.mjs";
import resetTarget from "../fixtures/reset-target.mjs";

chai.use(sinonChai);
const { expect } = chai;

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

let vm = null;
let sprite1 = null;
let target1 = null;
let sprite2 = null;
let target2 = null;

before(async () => {
    vm = new VirtualMachine();

    sprite1 = new Sprite(null, vm.runtime);
    target1 = new RenderedTarget(sprite1, vm.runtime);
    target1.id = "target1";
    vm.runtime.addTarget(target1);

    sprite2 = new Sprite(null, vm.runtime);
    target2 = new RenderedTarget(sprite2, vm.runtime);
    target2.id = "target2";
    vm.runtime.addTarget(target2);

    await vm.runtime.workerLoadPromise;

    vm.start();
});

afterEach(async () => {
    resetTarget(vm.runtime.targets[0]);
});

describe("Pyatch VM Linker & Worker Integration", () => {
    describe("Thread", () => {
        it("Script Load Restart", async () => {
            const steps = 10;

            const runningInputFile = path.join(__dirname, "./", "input", "running-thread.py");
            const runningScript = fs.readFileSync(runningInputFile, "utf8", (err, data) => data);

            const shrinkingInputFile = path.join(__dirname, "./", "input", "shrinking-thread.py");
            const shrinkingScript = fs.readFileSync(shrinkingInputFile, "utf8", (err, data) => data);

            const targetId = "target1";
            const triggerEventId = "event_whenflagclicked";

            const threadId = await vm.addThread(targetId, runningScript, triggerEventId);
            vm.startHats("event_whenflagclicked");
            setTimeout(() => {
                vm.getThreadById(threadId).updateThreadScript(shrinkingScript);
            }, 100);

            // Wait 200ms to ensure the thread has restarted
            await new Promise((resolve) => {
                setTimeout(resolve, 200);
            });

            expect(vm.runtime.targets[0].x).to.equal(steps);
            expect(vm.runtime.targets[0].y).to.equal(10);
        });
        it("Stop infinite loop", async () => {
            const steps = 10;

            const runningInputFile = path.join(__dirname, "./", "input", "running-thread.py");
            const runningScript = fs.readFileSync(runningInputFile, "utf8", (err, data) => data);

            const targetId = "target1";
            const triggerEventId = "event_whenflagclicked";

            const threadId = await vm.addThread(targetId, runningScript, triggerEventId);
            vm.startHats("event_whenflagclicked");
            setTimeout(() => {
                vm.getThreadById(threadId).stopThread();
            }, 200);

            // Wait 200ms to ensure the thread has restarted
            await new Promise((resolve) => {
                setTimeout(resolve, 200);
            });

            expect(vm.runtime.targets[0].x).to.equal(steps * 2);
            expect(vm.runtime.targets[0].y).to.equal(0);
        });
    });
});
