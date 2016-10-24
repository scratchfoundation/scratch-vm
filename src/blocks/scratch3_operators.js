var Cast = require('../util/cast.js');

var Scratch3OperatorsBlocks = function (runtime) {
    /**
     * The runtime instantiating this block package.
     * @type {Runtime}
     */
    this.runtime = runtime;
};

/**
 * Retrieve the block primitives implemented by this package.
 * @return {Object.<string, Function>} Mapping of opcode to Function.
 */
Scratch3OperatorsBlocks.prototype.getPrimitives = function () {
    return {
        operator_add: this.add,
        operator_subtract: this.subtract,
        operator_multiply: this.multiply,
        operator_divide: this.divide,
        operator_lt: this.lt,
        operator_equals: this.equals,
        operator_gt: this.gt,
        operator_and: this.and,
        operator_or: this.or,
        operator_not: this.not,
        operator_random: this.random,
        operator_join: this.join,
        operator_letter_of: this.letterOf,
        operator_length: this.length,
        operator_mod: this.mod,
        operator_round: this.round,
        operator_mathop: this.mathop
    };
};

Scratch3OperatorsBlocks.prototype.add = function (args) {
    return Cast.toNumber(args.NUM1) + Cast.toNumber(args.NUM2);
};

Scratch3OperatorsBlocks.prototype.subtract = function (args) {
    return Cast.toNumber(args.NUM1) - Cast.toNumber(args.NUM2);
};

Scratch3OperatorsBlocks.prototype.multiply = function (args) {
    return Cast.toNumber(args.NUM1) * Cast.toNumber(args.NUM2);
};

Scratch3OperatorsBlocks.prototype.divide = function (args) {
    return Cast.toNumber(args.NUM1) / Cast.toNumber(args.NUM2);
};

Scratch3OperatorsBlocks.prototype.lt = function (args) {
    return Cast.compare(args.OPERAND1, args.OPERAND2) < 0;
};

Scratch3OperatorsBlocks.prototype.equals = function (args) {
    return Cast.compare(args.OPERAND1, args.OPERAND2) === 0;
};

Scratch3OperatorsBlocks.prototype.gt = function (args) {
    return Cast.compare(args.OPERAND1, args.OPERAND2) > 0;
};

Scratch3OperatorsBlocks.prototype.and = function (args) {
    return Cast.toBoolean(args.OPERAND1) && Cast.toBoolean(args.OPERAND2);
};

Scratch3OperatorsBlocks.prototype.or = function (args) {
    return Cast.toBoolean(args.OPERAND1) || Cast.toBoolean(args.OPERAND2);
};

Scratch3OperatorsBlocks.prototype.not = function (args) {
    return !Cast.toBoolean(args.OPERAND);
};

Scratch3OperatorsBlocks.prototype.random = function (args) {
    var nFrom = Cast.toNumber(args.FROM);
    var nTo = Cast.toNumber(args.TO);
    var low = nFrom <= nTo ? nFrom : nTo;
    var high = nFrom <= nTo ? nTo : nFrom;
    if (low === high) return low;
    // If both arguments are ints, truncate the result to an int.
    if (Cast.isInt(args.FROM) && Cast.isInt(args.TO)) {
        return low + parseInt(Math.random() * ((high + 1) - low), 10);
    }
    return (Math.random() * (high - low)) + low;
};

Scratch3OperatorsBlocks.prototype.join = function (args) {
    return Cast.toString(args.STRING1) + Cast.toString(args.STRING2);
};

Scratch3OperatorsBlocks.prototype.letterOf = function (args) {
    var index = Cast.toNumber(args.LETTER) - 1;
    var str = Cast.toString(args.STRING);
    // Out of bounds?
    if (index < 0 || index >= str.length) {
        return '';
    }
    return str.charAt(index);
};

Scratch3OperatorsBlocks.prototype.length = function (args) {
    return Cast.toString(args.STRING).length;
};

Scratch3OperatorsBlocks.prototype.mod = function (args) {
    var n = Cast.toNumber(args.NUM1);
    var modulus = Cast.toNumber(args.NUM2);
    var result = n % modulus;
    // Scratch mod is kept positive.
    if (result / modulus < 0) result += modulus;
    return result;
};

Scratch3OperatorsBlocks.prototype.round = function (args) {
    return Math.round(Cast.toNumber(args.NUM));
};

Scratch3OperatorsBlocks.prototype.mathop = function (args) {
    var operator = Cast.toString(args.OPERATOR).toLowerCase();
    var n = Cast.toNumber(args.NUM);
    switch (operator) {
    case 'abs': return Math.abs(n);
    case 'floor': return Math.floor(n);
    case 'ceiling': return Math.ceil(n);
    case 'sqrt': return Math.sqrt(n);
    case 'sin': return Math.sin((Math.PI * n) / 180);
    case 'cos': return Math.cos((Math.PI * n) / 180);
    case 'tan': return Math.tan((Math.PI * n) / 180);
    case 'asin': return (Math.asin(n) * 180) / Math.PI;
    case 'acos': return (Math.acos(n) * 180) / Math.PI;
    case 'atan': return (Math.atan(n) * 180) / Math.PI;
    case 'ln': return Math.log(n);
    case 'log': return Math.log(n) / Math.LN10;
    case 'e ^': return Math.exp(n);
    case '10 ^': return Math.pow(10, n);
    }
    return 0;
};

module.exports = Scratch3OperatorsBlocks;
