import sinonChai from "sinon-chai";
import chai from "chai";
import PrimProxy from "../../src/worker/prim-proxy.js";
import VirtualMachine from "../../src/virtual-machine.mjs";
import Sprite from "../../src/sprites/sprite.mjs";
import RenderedTarget from "../../src/sprites/rendered-target.mjs";
import resetTarget from "../fixtures/reset-target.mjs";

chai.use(sinonChai);
const { expect } = chai;

let vm = null;
let sprite = null;
let target = null;

const sprite2 = null;
const target2 = null;

const spriteClone = null;
const targetClone = null;

before(async () => {
    vm = new VirtualMachine();

    sprite = new Sprite(null, vm.runtime);
    sprite.name = "target1";
    target = new RenderedTarget(sprite, vm.runtime);
    target.id = "target1";
    vm.runtime.addTarget(target);

    await vm.runtime.workerLoadPromise;

    vm.start();
});

afterEach(async () => {
    vm.runtime.targets.forEach((tempTarget) => {
        resetTarget(tempTarget);
    });
});

describe("Pyatch VM Linker & Worker Integration", () => {
    describe("Dynamic Api Info", () => {
        it("move", async () => {
            const { opcode, parameters, exampleParameters } = PrimProxy.getDynamicFunctionInfo("move", vm);
            expect(opcode).to.equal("motion_movesteps");
            expect(parameters).to.deep.equal(["steps"]);
            expect(exampleParameters).to.deep.equal({ steps: 10 });
        });
        it("goTo", async () => {
            const { opcode, parameters, exampleParameters } = PrimProxy.getDynamicFunctionInfo("goTo", vm);
            expect(opcode).to.equal("motion_goto");
            expect(parameters).to.deep.equal(["name"]);
            expect(exampleParameters).to.deep.equal({ name: ["target1", "_mouse_", "_random_"] });
        });
        it("say", async () => {
            const { opcode, parameters, exampleParameters } = PrimProxy.getDynamicFunctionInfo("say", vm);
            expect(opcode).to.equal("looks_say");
            expect(parameters).to.deep.equal(["message"]);
            expect(exampleParameters).to.deep.equal({ message: "'Hello!'" });
        });
        it("say called twice", async () => {
            PrimProxy.getDynamicFunctionInfo("say", vm);
            const { opcode, parameters, exampleParameters } = PrimProxy.getDynamicFunctionInfo("say", vm);
            expect(opcode).to.equal("looks_say");
            expect(parameters).to.deep.equal(["message"]);
            expect(exampleParameters).to.deep.equal({ message: "'Hello!'" });
        });
    });
});
