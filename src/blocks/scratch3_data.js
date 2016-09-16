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
    var variable = util.target.lookupOrCreateVariable(args.VARIABLE);
    return variable.value;
};

Scratch3DataBlocks.prototype.setVariable = function (args, util) {
    var variable = util.target.lookupOrCreateVariable(args.VARIABLE);
    variable.value = args.VALUE;
};

Scratch3DataBlocks.prototype.changeVariable = function (args, util) {
    var variable = util.target.lookupOrCreateVariable(args.VARIABLE);
    var castedValue = Cast.toNumber(variable.value);
    var dValue = Cast.toNumber(args.VALUE);
    variable.value = castedValue + dValue;
};

module.exports = Scratch3DataBlocks;
