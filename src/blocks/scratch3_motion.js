var MathUtil = require('../util/math-util');

function Scratch3MotionBlocks(runtime) {
    /**
     * The runtime instantiating this block package.
     * @type {Runtime}
     */
    this.runtime = runtime;
}

/**
 * Retrieve the block primitives implemented by this package.
 * @return {Object.<string, Function>} Mapping of opcode to Function.
 */
Scratch3MotionBlocks.prototype.getPrimitives = function() {
    return {
        'motion_movesteps': this.moveSteps,
        'motion_gotoxy': this.goToXY,
        'motion_turnright': this.turnRight,
        'motion_turnleft': this.turnLeft,
        'motion_pointindirection': this.pointInDirection,
        'motion_changexby': this.changeX,
        'motion_setx': this.setX,
        'motion_changeyby': this.changeY,
        'motion_sety': this.setY,
        'motion_xposition': this.getX,
        'motion_yposition': this.getY,
        'motion_direction': this.getDirection
    };
};

Scratch3MotionBlocks.prototype.moveSteps = function (args, util) {
    var radians = MathUtil.degToRad(util.target.direction);
    var dx = args.STEPS * Math.cos(radians);
    var dy = args.STEPS * Math.sin(radians);
    util.target.setXY(util.target.x + dx, util.target.y + dy);
};

Scratch3MotionBlocks.prototype.goToXY = function (args, util) {
    util.target.setXY(args.X, args.Y);
};

Scratch3MotionBlocks.prototype.turnRight = function (args, util) {
    util.target.setDirection(util.target.direction + args.DEGREES);
};

Scratch3MotionBlocks.prototype.turnLeft = function (args, util) {
    util.target.setDirection(util.target.direction - args.DEGREES);
};

Scratch3MotionBlocks.prototype.pointInDirection = function (args, util) {
    util.target.setDirection(args.DIRECTION);
};

Scratch3MotionBlocks.prototype.changeX = function (args, util) {
    util.target.setXY(util.target.x + args.DX, util.target.y);
};

Scratch3MotionBlocks.prototype.setX = function (args, util) {
    util.target.setXY(args.X, util.target.y);
};

Scratch3MotionBlocks.prototype.changeY = function (args, util) {
    util.target.setXY(util.target.x, util.target.y + args.DY);
};

Scratch3MotionBlocks.prototype.setY = function (args, util) {
    util.target.setXY(util.target.x, args.Y);
};

Scratch3MotionBlocks.prototype.getX = function (args, util) {
    return util.target.x;
};

Scratch3MotionBlocks.prototype.getY = function (args, util) {
    return util.target.y;
};

Scratch3MotionBlocks.prototype.getDirection = function (args, util) {
    return util.target.direction;
};

module.exports = Scratch3MotionBlocks;
