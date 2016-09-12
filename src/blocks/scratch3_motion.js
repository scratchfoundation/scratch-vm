var Cast = require('../util/cast');
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
    var steps = Cast.toNumber(args.STEPS);
    var radians = MathUtil.degToRad(util.target.direction);
    var dx = steps * Math.cos(radians);
    var dy = steps * Math.sin(radians);
    util.target.setXY(util.target.x + dx, util.target.y + dy);
};

Scratch3MotionBlocks.prototype.goToXY = function (args, util) {
    var x = Cast.toNumber(args.X);
    var y = Cast.toNumber(args.Y);
    util.target.setXY(x, y);
};

Scratch3MotionBlocks.prototype.turnRight = function (args, util) {
    var degrees = Cast.toNumber(args.DEGREES);
    util.target.setDirection(util.target.direction + degrees);
};

Scratch3MotionBlocks.prototype.turnLeft = function (args, util) {
    var degrees = Cast.toNumber(args.DEGREES);
    util.target.setDirection(util.target.direction - degrees);
};

Scratch3MotionBlocks.prototype.pointInDirection = function (args, util) {
    var direction = Cast.toNumber(args.DIRECTION);
    util.target.setDirection(direction);
};

Scratch3MotionBlocks.prototype.changeX = function (args, util) {
    var dx = Cast.toNumber(args.DX);
    util.target.setXY(util.target.x + dx, util.target.y);
};

Scratch3MotionBlocks.prototype.setX = function (args, util) {
    var x = Cast.toNumber(args.X);
    util.target.setXY(x, util.target.y);
};

Scratch3MotionBlocks.prototype.changeY = function (args, util) {
    var dy = Cast.toNumber(args.DY);
    util.target.setXY(util.target.x, util.target.y + dy);
};

Scratch3MotionBlocks.prototype.setY = function (args, util) {
    var y = Cast.toNumber(args.Y);
    util.target.setXY(util.target.x, y);
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
