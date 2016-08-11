function Cast () {}

/**
 * @fileoverview
 * Utilities for casting and comparing Scratch data-types.
 * Scratch behaves slightly differently from JavaScript in many respects,
 * and these differences should be encapsulated below.
 * For example, in Scratch, add(1, join("hello", world")) -> 1.
 * This is because "hello world" is cast to 0.
 * In JavaScript, 1 + Number("hello" + "world") would give you NaN.
 * Use when coercing a value before computation.
 */

/**
 * Scratch cast to number.
 * Treats NaN as 0.
 * In Scratch 2.0, this is captured by `interp.numArg.`
 * @param {*} value Value to cast to number.
 * @return {number} The Scratch-casted number value.
 */
Cast.toNumber = function (value) {
    var n = Number(value);
    if (isNaN(n)) {
        // Scratch treats NaN as 0, when needed as a number.
        // E.g., 0 + NaN -> 0.
        return 0;
    }
    return n;
};

/**
 * Scratch cast to boolean.
 * In Scratch 2.0, this is captured by `interp.boolArg.`
 * Treats some string values differently from JavaScript.
 * @param {*} value Value to cast to boolean.
 * @return {boolean} The Scratch-casted boolean value.
 */
Cast.toBoolean = function (value) {
    // Already a boolean?
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        // These specific strings are treated as false in Scratch.
        if ((value == '') ||
            (value == '0') ||
            (value.toLowerCase() == 'false')) {
            return false;
        }
        // All other strings treated as true.
        return true;
    }
    // Coerce other values and numbers.
    return Boolean(value);
};

/**
 * Scratch cast to string.
 * @param {*} value Value to cast to string.
 * @return {string} The Scratch-casted string value.
 */
Cast.toString = function (value) {
    return String(value);
};

/**
 * Compare two values, using Scratch cast, case-insensitive string compare, etc.
 * In Scratch 2.0, this is captured by `interp.compare.`
 * @param {*} v1 First value to compare.
 * @param {*} v2 Second value to compare.
 * @returns {Number} Negative number if v1 < v2; 0 if equal; positive otherwise.
 */
Cast.compare = function (v1, v2) {
    var n1 = Number(v1);
    var n2 = Number(v2);
    if (isNaN(n1) || isNaN(n2)) {
        // At least one argument can't be converted to a number.
        // Scratch compares strings as case insensitive.
        var s1 = String(v1).toLowerCase();
        var s2 = String(v2).toLowerCase();
        return s1.localeCompare(s2);
    } else {
        // Compare as numbers.
        return n1 - n2;
    }
};

module.exports = Cast;
