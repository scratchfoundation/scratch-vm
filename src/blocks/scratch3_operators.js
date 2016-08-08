var Promise = require('promise');

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
        'math_positive_number': this.number,
        'math_whole_number': this.number,
        'text': this.text,
        'operator_add': this.add,
        'operator_subtract': this.subtract,
        'operator_multiply': this.multiply,
        'operator_divide': this.divide,
        'operator_lt': this.lt,
        'operator_equals': this.equals,
        'operator_gt': this.gt,
        'operator_and': this.and,
        'operator_or': this.or,
        'operator_not': this.not,
        'operator_random': this.random
    };
};

Scratch3OperatorsBlocks.prototype.number = function (args) {
    var num = Number(args.NUM);
    if (num !== num) {
        // NaN
        return 0;
    }
    return num;
};

Scratch3OperatorsBlocks.prototype.text = function (args) {
    return String(args.TEXT);
};

Scratch3OperatorsBlocks.prototype.add = function (args) {
    return args.NUM1 + args.NUM2;
};

Scratch3OperatorsBlocks.prototype.subtract = function (args) {
    return args.NUM1 - args.NUM2;
};

Scratch3OperatorsBlocks.prototype.multiply = function (args) {
    return args.NUM1 * args.NUM2;
};

Scratch3OperatorsBlocks.prototype.divide = function (args) {
    return args.NUM1 / args.NUM2;
};

Scratch3OperatorsBlocks.prototype.lt = function (args) {
    return Boolean(args.OPERAND1 < args.OPERAND2);
};

Scratch3OperatorsBlocks.prototype.equals = function (args) {
    return Boolean(args.OPERAND1 == args.OPERAND2);
};

Scratch3OperatorsBlocks.prototype.gt = function (args) {
    return Boolean(args.OPERAND1 > args.OPERAND2);
};

Scratch3OperatorsBlocks.prototype.and = function (args) {
    return Boolean(args.OPERAND1 && args.OPERAND2);
};

Scratch3OperatorsBlocks.prototype.or = function (args) {
    return Boolean(args.OPERAND1 || args.OPERAND2);
};

Scratch3OperatorsBlocks.prototype.not = function (args) {
    return Boolean(!args.OPERAND);
};

Scratch3OperatorsBlocks.prototype.random = function (args) {
    var low = args.FROM <= args.TO ? args.FROM : args.TO;
    var high = args.FROM <= args.TO ? args.TO : args.FROM;
    if (low == high) return low;
    // If both low and high are ints, truncate the result to an int.
    var lowInt = low == parseInt(low);
    var highInt = high == parseInt(high);
    if (lowInt && highInt) {
        return low + parseInt(Math.random() * ((high + 1) - low));
    }
    return (Math.random() * (high - low)) + low;
};

module.exports = Scratch3OperatorsBlocks;
