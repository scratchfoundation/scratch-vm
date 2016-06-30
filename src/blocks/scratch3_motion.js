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
        'motion_gotoxy': this.goToXY,
        'motion_turnright': this.turnRight
    };
};

Scratch3MotionBlocks.prototype.goToXY = function (args, util) {
    util.target.setXY(args.X, args.Y);
};

Scratch3MotionBlocks.prototype.turnRight = function (args, util) {
    if (args.DEGREES !== args.DEGREES) {
        throw "Bad degrees" + args.DEGREES;
    }
    util.target.setDirection(args.DEGREES + util.target.direction);
};

module.exports = Scratch3MotionBlocks;
