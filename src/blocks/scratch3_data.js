var Cast = require('../util/cast');

function Scratch3DataBlocks(runtime) {
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
Scratch3DataBlocks.prototype.getPrimitives = function () {
    return {
        'data_variable': this.getVariable,
        'data_setvariableto': this.setVariable,
        'data_changevariableby': this.changeVariable
    };
};

Scratch3DataBlocks.prototype.getVariable = function (args, util) {
    return util.target.getVariable(args.VARIABLE);
};

Scratch3DataBlocks.prototype.setVariable = function (args, util) {
    util.target.setVariable(args.VARIABLE, args.VALUE);
};

Scratch3DataBlocks.prototype.changeVariable = function (args, util) {
    var value = util.target.getVariable(args.VARIABLE);
    var castedValue = Cast.toNumber(value);
    var dValue = Cast.toNumber(args.VALUE);
    util.target.setVariable(args.VARIABLE, castedValue + dValue);
};

module.exports = Scratch3DataBlocks;
