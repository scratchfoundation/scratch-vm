function Scratch3LooksBlocks(runtime) {
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
Scratch3LooksBlocks.prototype.getPrimitives = function() {
    return {
        'looks_show': this.show,
        'looks_hide': this.hide,
        'looks_effectmenu': this.effectMenu,
        'looks_changeeffectby': this.changeEffect,
        'looks_seteffectto': this.setEffect,
        'looks_cleargraphiceffects': this.clearEffects,
        'looks_changesizeby': this.changeSize,
        'looks_setsizeto': this.setSize,
        'looks_size': this.getSize
    };
};

Scratch3LooksBlocks.prototype.show = function (args, util) {
    util.target.setVisible(true);
};

Scratch3LooksBlocks.prototype.hide = function (args, util) {
    util.target.setVisible(false);
};

Scratch3LooksBlocks.prototype.effectMenu = function (args) {
    return args.EFFECT.toLowerCase();
};

Scratch3LooksBlocks.prototype.changeEffect = function (args, util) {
    var newValue = args.CHANGE + util.target.effects[args.EFFECT];
    util.target.setEffect(args.EFFECT, newValue);
};

Scratch3LooksBlocks.prototype.setEffect = function (args, util) {
    util.target.setEffect(args.EFFECT, args.VALUE);
};

Scratch3LooksBlocks.prototype.clearEffects = function (args, util) {
    util.target.clearEffects();
};

Scratch3LooksBlocks.prototype.changeSize = function (args, util) {
    util.target.setSize(util.target.size + args.CHANGE);
};

Scratch3LooksBlocks.prototype.setSize = function (args, util) {
    util.target.setSize(args.SIZE);
};

Scratch3LooksBlocks.prototype.getSize = function (args, util) {
    return util.target.size;
};

module.exports = Scratch3LooksBlocks;
