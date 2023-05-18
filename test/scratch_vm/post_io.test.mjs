import chai from "chai";
import sinonChai from "sinon-chai";
import VirtualMachine from "../../src/virtual-machine.mjs";

chai.use(sinonChai);
const { expect } = chai;

describe("IO Post Data", () => {
    it("Post Mouse Data", async () => {
        const vm = new VirtualMachine();
        const device = "mouse";

        vm.postIOData(device, { x: 5, y: 10 });

        expect(vm.runtime.ioDevices[device].getClientX()).to.equal(5);
        expect(vm.runtime.ioDevices[device].getClientY()).to.equal(10);
    });
});
