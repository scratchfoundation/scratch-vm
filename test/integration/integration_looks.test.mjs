import sinonChai from "sinon-chai";
import chai from "chai";
import _ from "lodash";
import VirtualMachine from "../../src/virtual-machine.mjs";
import Sprite from "../../src/sprites/sprite.mjs";
import RenderedTarget from "../../src/sprites/rendered-target.mjs";

chai.use(sinonChai);
const { expect } = chai;

let vm = null;
let sprite = null;
let target = null;
let backdrop = null;
let backdropTarget = null;

let sprite2 = null;
let target2 = null;

before(async () => {
    vm = new VirtualMachine();

    sprite = new Sprite(null, vm.runtime);
    // NOTE: CAN ONLY RUN CODE FROM TARGET1
    target = new RenderedTarget(sprite, vm.runtime);
    target.id = "target1";
    vm.runtime.addTarget(target);

    // adding three costumes to target
    const costumeCatWalk = {
        asset: null,
        assetId: null,
        skinId: null,
        name: "cat-walk",
        bitmapResolution: null,
        rotationCenterX: 0,
        rotationCenterY: 0,
    };

    const costumeCatRun = {
        asset: null,
        assetId: null,
        skinId: null,
        name: "cat-run",
        bitmapResolution: null,
        rotationCenterX: 0,
        rotationCenterY: 0,
    };

    const costumeCatFly = {
        asset: null,
        assetId: null,
        skinId: null,
        name: "cat-fly",
        bitmapResolution: null,
        rotationCenterX: 0,
        rotationCenterY: 0,
    };

    target.addCostume(costumeCatWalk);
    target.addCostume(costumeCatRun);
    target.addCostume(costumeCatFly);

    // BACKDROP

    backdrop = new Sprite(null, vm.runtime);
    backdropTarget = new RenderedTarget(backdrop, vm.runtime);
    backdropTarget.id = "backdrop1";

    // adding three backdrops to backdropTarget
    const backdropGalaxy = {
        asset: null,
        assetId: null,
        skinId: null,
        name: "galaxy",
        bitmapResolution: null,
        rotationCenterX: 0,
        rotationCenterY: 0,
    };

    const backdropMoon = {
        asset: null,
        assetId: null,
        skinId: null,
        name: "moon",
        bitmapResolution: null,
        rotationCenterX: 0,
        rotationCenterY: 0,
    };

    const backdropNebula = {
        asset: null,
        assetId: null,
        skinId: null,
        name: "nebula",
        bitmapResolution: null,
        rotationCenterX: 0,
        rotationCenterY: 0,
    };

    backdropTarget.addCostume(backdropGalaxy);
    backdropTarget.addCostume(backdropMoon);
    backdropTarget.addCostume(backdropNebula);

    backdropTarget.isStage = true;
    vm.runtime.addTarget(backdropTarget);

    sprite2 = new Sprite(null, vm.runtime);
    target2 = new RenderedTarget(sprite2, vm.runtime);
    target2.id = "target2";
    sprite2.name = "target2";

    vm.runtime.addTarget(target2);

    await vm.runtime.workerLoadPromise;

    vm.start();
});

const resetTargets = () => {
    vm.runtime.targets.map((element) => {
        const newTarget = _.cloneDeep(element);

        newTarget.x = 0;
        newTarget.y = 0;
        newTarget.direction = 0;

        return newTarget;
    });
};

beforeEach(async () => {
    resetTargets();
});

describe("Pyatch VM Linker & Worker Integration", () => {
    describe("Looks Blocks", () => {
        it("Say", async () => {
            const message = "Hello friends";
            const targetId = "target1";
            const script = `say("${message}")`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].getCustomState("Scratch.looks").type).to.equal("say");
            expect(vm.runtime.targets[0].getCustomState("Scratch.looks").text).to.equal("Hello friends");
        });

        it("Think", async () => {
            const message = "Hello friends";
            const targetId = "target1";
            const script = `think("${message}")`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].getCustomState("Scratch.looks").type).to.equal("think");
            expect(vm.runtime.targets[0].getCustomState("Scratch.looks").text).to.equal("Hello friends");
        });

        // TODO: Say and think for seconds

        it("Show", async () => {
            const targetId = "target1";
            const script = `hide()\nshow()`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].visible).to.equal(true);
        });

        it("Hide", async () => {
            const targetId = "target1";
            const script = `show()\nhide()`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].visible).to.equal(false);
        });

        it("Set Costume From Index", async () => {
            const targetId = "target1";
            const script = `setCostumeTo(2)`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].currentCostume).to.equal(1);
        });

        it("Set Costume From Name", async () => {
            const targetId = "target1";
            const script = `setCostumeTo("cat-fly")`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].currentCostume).to.equal(2);
        });

        it("Next Costume", async () => {
            const targetId = "target1";
            const script = `setCostumeTo(1)\nnextCostume()`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].currentCostume).to.equal(1);
        });

        it("Set Backdrop From Index", async () => {
            const targetId = "target1";
            const script = `setBackdropTo(1)`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.getTargetForStage().currentCostume).to.equal(0);
        });

        it("Set Backdrop From Name", async () => {
            const targetId = "target1";
            const script = `setBackdropTo("nebula")`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.getTargetForStage().currentCostume).to.equal(2);
        });

        it("Next Backdrop", async () => {
            const targetId = "target1";
            const script = `setBackdropTo(1)\nnextBackdrop()\nnextBackdrop()`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.getTargetForStage().currentCostume).to.equal(2);
        });

        it("Change Effect By", async () => {
            const targetId = "target1";
            const script = `changeGraphicEffectBy("ghost", 50)`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].effects.ghost).to.equal(50);
        });

        it("Set Effect To", async () => {
            const targetId = "target1";
            const script = `setGraphicEffectTo("ghost", 50)`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].effects.ghost).to.equal(50);
        });

        it("Clear Graphic Effects", async () => {
            const targetId = "target1";
            const script = `setGraphicEffectTo("ghost", 50)\nsetGraphicEffectTo("brightness", 100)\nclearGraphicEffects()`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].effects.ghost).to.equal(0);
            expect(vm.runtime.targets[0].effects.brightness).to.equal(0);
        });

        // possible range of sprite sizes depends on cosume and stage size
        // without defining these sizes, Sprite Size is limited to [100, 100]
        // I'm doing a simple 0 change function
        it("Change Size By", async () => {
            const targetId = "target1";
            const script = `changeSizeBy(0)`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].size).to.equal(100);
        });

        // similar to above, Sprite Size is limited to [100, 100]
        // Testing just a setSize(100)
        it("Set Size", async () => {
            const targetId = "target1";
            const script = `setSizeTo(100)`;
            const triggerEventId = "event_whenflagclicked";

            await vm.addThread(targetId, script, triggerEventId);
            await vm.startHats(triggerEventId);

            expect(vm.runtime.targets[0].size).to.equal(100);
        });
    });
});
