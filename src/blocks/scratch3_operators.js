function Scratch3OperatorsBlocks(runtime) {
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
Scratch3OperatorsBlocks.prototype.getPrimitives = function() {
    return {
        'math_number': this.number,
        'text': this.text,
        'math_add': this.add,
        'logic_equals': this.equals
    };
};

Scratch3OperatorsBlocks.prototype.number = function (args) {
    return Number(args.NUM);
};

Scratch3OperatorsBlocks.prototype.text = function (args) {
    return String(args.TEXT);
};

Scratch3OperatorsBlocks.prototype.add = function (args) {
    return args.NUM1 + args.NUM2;
};

Scratch3OperatorsBlocks.prototype.equals = function (args) {
    return args.VALUE1 == args.VALUE2;
};

module.exports = Scratch3OperatorsBlocks;
