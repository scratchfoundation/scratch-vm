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
            const targetAndCode = {
                target1: ['say("Hello friends")'],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].getCustomState("Scratch.looks").type).to.equal("say");
            expect(vm.runtime.targets[0].getCustomState("Scratch.looks").text).to.equal("Hello friends");
        });

        it("Think", async () => {
            const targetAndCode = {
                target1: ['think("Hello friends")'],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].getCustomState("Scratch.looks").type).to.equal("think");
            expect(vm.runtime.targets[0].getCustomState("Scratch.looks").text).to.equal("Hello friends");
        });

        // TODO: Say and think for seconds

        it("Show", async () => {
            const targetAndCode = {
                target1: ["show()"],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].visible).to.equal(true);
        });

        it("Hide", async () => {
            const targetAndCode = {
                target1: ["hide()"],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].visible).to.equal(false);
        });

        it("Set Costume From Index", async () => {
            const targetAndCode = {
                target1: ["setCostumeTo(2)"],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].currentCostume).to.equal(1);
        });

        it("Set Costume From Name", async () => {
            const targetAndCode = {
                target1: ['setCostumeTo("cat-fly")'],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].currentCostume).to.equal(2);
        });

        it("Next Costume", async () => {
            // set costume to 0th costume, next to costume 1
            const targetAndCode = {
                target1: ["setCostumeTo(1)\nnextCostume()"],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].currentCostume).to.equal(1);
        });

        it("Set Backdrop From Index", async () => {
            const targetAndCode = {
                target1: ["setBackdropTo(1)"],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.getTargetForStage().currentCostume).to.equal(0);
        });

        it("Set Backdrop From Name", async () => {
            const targetAndCode = {
                target1: ['setBackdropTo("nebula")'],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.getTargetForStage().currentCostume).to.equal(2);
        });

        it("Next Backdrop", async () => {
            // set backdrop to 0th backdrop, next twice to backdrop 2
            const targetAndCode = {
                target1: ["setBackdropTo(1)\nnextBackdrop()\nnextBackdrop()"],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.getTargetForStage().currentCostume).to.equal(2);
        });

        it("Change Effect By", async () => {
            const targetAndCode = {
                target1: ['changeGraphicEffectBy("ghost", 50)'],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].effects.ghost).to.equal(50);
        });

        it("Set Effect To", async () => {
            const targetAndCode = {
                target1: ['setGraphicEffectTo("ghost", 50)'],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].effects.ghost).to.equal(50);
        });

        it("Clear Graphic Effects", async () => {
            const targetAndCode = {
                target1: ['setGraphicEffectTo("ghost", 50)\nsetGraphicEffectTo("brightness", 100)\nclearGraphicEffects()'],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].effects.ghost).to.equal(0);
            expect(vm.runtime.targets[0].effects.brightness).to.equal(0);
        });

        // possible range of sprite sizes depends on cosume and stage size
        // without defining these sizes, Sprite Size is limited to [100, 100]
        // I'm doing a simple 0 change function
        it("Change Size By", async () => {
            const targetAndCode = {
                target1: ["changeSizeBy(0)"],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].size).to.equal(100);
        });

        // similar to above, Sprite Size is limited to [100, 100]
        // Testing just a setSize(100)
        it("Set Size", async () => {
            const targetAndCode = {
                target1: ["setSizeTo(100)"],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].size).to.equal(100);
        });
    });
});
