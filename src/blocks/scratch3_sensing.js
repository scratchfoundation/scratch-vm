function Scratch3SensingBlocks(runtime) {
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
Scratch3SensingBlocks.prototype.getPrimitives = function() {
    return {
        'sensing_timer': this.getTimer,
        'sensing_resettimer': this.resetTimer,
        'sensing_mousex': this.getMouseX,
        'sensing_mousey': this.getMouseY,
        'sensing_mousedown': this.getMouseDown
    };
};

Scratch3SensingBlocks.prototype.getTimer = function (args, util) {
    return util.ioQuery('clock', 'projectTimer');
};

Scratch3SensingBlocks.prototype.resetTimer = function (args, util) {
    util.ioQuery('clock', 'resetProjectTimer');
};

Scratch3SensingBlocks.prototype.getMouseX = function (args, util) {
    return util.ioQuery('mouse', 'getX');
};

Scratch3SensingBlocks.prototype.getMouseY = function (args, util) {
    return util.ioQuery('mouse', 'getY');
};

Scratch3SensingBlocks.prototype.getMouseDown = function (args, util) {
    return util.ioQuery('mouse', 'getIsDown');
};

module.exports = Scratch3SensingBlocks;
