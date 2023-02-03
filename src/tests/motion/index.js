console.log("Motion Test Running...");

const Runtime = require("../../engine/runtime");
const Motion = require("../../blocks/scratch3_motion");
const Sprite = require("../../sprites/sprite");
const RenderedTarget = require("../../sprites/rendered-target");
const BlockUtility = require("../../engine/block-utility");

const rt = new Runtime();
const motion = new Motion(rt);
const sprite = new Sprite(rt);
const target = new RenderedTarget(sprite, rt);
const util = new BlockUtility(target, rt);

function logCoordinates() {
    console.log(motion.getX({}, util));
    console.log(motion.getY({}, util));
}

motion.moveSteps({ STEPS: 100 }, util);
logCoordinates();
motion.turnRight({ DEGREES: 45 }, util);
motion.moveSteps({ STEPS: 100 }, util);
logCoordinates();
