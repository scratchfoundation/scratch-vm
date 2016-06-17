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
        'operator_add': this.add,
        'operator_equals': this.equals,
        'operator_random': this.random
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
    return args.OPERAND1 == args.OPERAND2;
};

Scratch3OperatorsBlocks.prototype.random = function (args, util) {
    // As a demo, this implementation of random returns after 1 second of yield.
    // @todo Match Scratch 2.0 implementation with int-truncation.
    // See: http://bit.ly/1Qc0GzC
    util.yield();
    setTimeout(function() {
        var randomValue = (Math.random() * (args.TO - args.FROM)) + args.FROM;
        util.report(randomValue);
    }, 1000);
};

module.exports = Scratch3OperatorsBlocks;
