import sinonChai from "sinon-chai";
import chai from "chai";
import VirtualMachine from "../../src/virtual-machine.mjs";
import Sprite from "../../src/sprites/sprite.mjs";
import RenderedTarget from "../../src/sprites/rendered-target.mjs";
import resetTarget from "../fixtures/reset-target.mjs";

chai.use(sinonChai);
const { expect } = chai;

let vm = null;
let sprite = null;
let target = null;

let sprite2 = null;
let target2 = null;

let spriteClone = null;
let targetClone = null;

before(async () => {
    vm = new VirtualMachine();

    sprite = new Sprite(null, vm.runtime);
    target = new RenderedTarget(sprite, vm.runtime);
    target.id = "target1";
    vm.runtime.addTarget(target);

    sprite2 = new Sprite(null, vm.runtime);
    target2 = new RenderedTarget(sprite2, vm.runtime);
    target2.id = "target2";
    vm.runtime.addTarget(target2);

    spriteClone = new Sprite(null, vm.runtime);
    spriteClone.name = "spriteClone";
    targetClone = new RenderedTarget(spriteClone, vm.runtime);
    targetClone.id = "targetClone";
    vm.runtime.addTarget(targetClone);

    await vm.runtime.workerLoadPromise;

    vm.start();
});

afterEach(async () => {
    vm.runtime.targets.forEach((tempTarget) => {
        resetTarget(tempTarget);
    });
    vm.runtime.runtimeErrors = [];
    vm.runtime.compileTimeErrors = [];
});

describe("Pyatch VM Linker & Worker Integration", () => {
    describe("Error Handling", () => {
        describe("Compile Time", () => {
            it("SyntaxError Single Line", async () => {
                const targetId = "target1";
                const script = `move(10,`;
                const triggerEventId = "event_whenflagclicked";

                let error = {};
                vm.on("COMPILE TIME ERROR", (message) => {
                    error = message;
                });
                const threadId = await vm.addThread(targetId, script, triggerEventId);
                await vm.startHats(triggerEventId);

                const expectedErrorMessage = { threadId, lineNumber: 1, message: "SyntaxError: '(' was never closed", type: "CompileTimeError" };

                expect(vm.runtime.compileTimeErrors).to.eql([expectedErrorMessage]);
                expect(error).to.eql(expectedErrorMessage);
            });

            it("SyntaxError Multi Line", async () => {
                const targetId = "target1";
                const script = `move(10)\nmove(10, 10`;
                const triggerEventId = "event_whenflagclicked";

                let error = {};
                vm.on("COMPILE TIME ERROR", (message) => {
                    error = message;
                });
                const threadId = await vm.addThread(targetId, script, triggerEventId);
                await vm.startHats(triggerEventId);

                const expectedErrorMessage = { threadId, lineNumber: 2, message: "SyntaxError: '(' was never closed", type: "CompileTimeError" };

                expect(vm.runtime.compileTimeErrors).to.eql([expectedErrorMessage]);
                expect(error).to.eql(expectedErrorMessage);
            });

            it("If statement", async () => {
                const targetId = "target1";
                const script = `if True\n    move(10)`;
                const triggerEventId = "event_whenflagclicked";

                let error = {};
                vm.on("COMPILE TIME ERROR", (message) => {
                    error = message;
                });
                const threadId = await vm.addThread(targetId, script, triggerEventId);
                await vm.startHats(triggerEventId);

                const expectedErrorMessage = { threadId, lineNumber: 1, message: "SyntaxError: expected ':'", type: "CompileTimeError" };

                expect(vm.runtime.compileTimeErrors).to.eql([expectedErrorMessage]);
                expect(error).to.eql(expectedErrorMessage);
            });
        });
        describe("Runtime", () => {
            it("NameError Single Line", async () => {
                const targetId = "target1";
                const script = `notafunction()`;
                const triggerEventId = "event_whenflagclicked";

                let error = {};
                vm.on("RUNTIME ERROR", (message) => {
                    error = message;
                });
                const threadId = await vm.addThread(targetId, script, triggerEventId);
                await vm.startHats(triggerEventId);

                const expectedErrorMessage = { threadId, lineNumber: 1, message: "NameError: name 'notafunction' is not defined", type: "RuntimeError" };

                expect(vm.getRuntimeErrors()).to.eql([expectedErrorMessage]);
                expect(error).to.eql(expectedErrorMessage);
            });

            it("NameError Multi Line", async () => {
                const targetId = "target1";
                const script = `move(10)\nsay()\nnotafunction()`;
                const triggerEventId = "event_whenflagclicked";

                const threadId = await vm.addThread(targetId, script, triggerEventId);
                let error = {};
                vm.on("RUNTIME ERROR", (message) => {
                    error = message;
                });
                await vm.startHats(triggerEventId);

                const expectedErrorMessage = { threadId, lineNumber: 3, message: "NameError: name 'notafunction' is not defined", type: "RuntimeError" };

                expect(vm.getRuntimeErrors()).to.eql([expectedErrorMessage]);
                expect(error).to.eql(expectedErrorMessage);
            });

            it("Double Runtime Multi Line", async () => {
                const targetId = "target1";
                const script = `mov(10)\nnotafunction()`;
                const triggerEventId = "event_whenflagclicked";

                const threadId = await vm.addThread(targetId, script, triggerEventId);
                let error = {};
                vm.on("RUNTIME ERROR", (message) => {
                    error = message;
                });
                await vm.startHats(triggerEventId);

                const expectedErrorMessage = { threadId, lineNumber: 1, message: "NameError: name 'mov' is not defined", type: "RuntimeError" };

                expect(vm.getRuntimeErrors()).to.eql([expectedErrorMessage]);
                expect(error).to.eql(expectedErrorMessage);
            });
        });
    });
});
