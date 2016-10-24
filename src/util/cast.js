var Color = require('../util/color');

var Cast = function () {};

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
        if ((value === '') ||
            (value === '0') ||
            (value.toLowerCase() === 'false')) {
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
 * Cast any Scratch argument to an RGB color object to be used for the renderer.
 * @param {*} value Value to convert to RGB color object.
 * @return {Array.<number>} [r,g,b], values between 0-255.
 */
Cast.toRgbColorList = function (value) {
    var color;
    if (typeof value === 'string' && value.substring(0, 1) === '#') {
        color = Color.hexToRgb(value);
    } else {
        color = Color.decimalToRgb(Cast.toNumber(value));
    }
    return [color.r, color.g, color.b];
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

/**
 * Determine if a Scratch argument number represents a round integer.
 * @param {*} val Value to check.
 * @return {boolean} True if number looks like an integer.
 */
Cast.isInt = function (val) {
    // Values that are already numbers.
    if (typeof val === 'number') {
        if (isNaN(val)) { // NaN is considered an integer.
            return true;
        }
        // True if it's "round" (e.g., 2.0 and 2).
        return val === parseInt(val, 10);
    } else if (typeof val === 'boolean') {
        // `True` and `false` always represent integer after Scratch cast.
        return true;
    } else if (typeof val === 'string') {
        // If it contains a decimal point, don't consider it an int.
        return val.indexOf('.') < 0;
    }
    return false;
};

Cast.LIST_INVALID = 'INVALID';
Cast.LIST_ALL = 'ALL';
/**
 * Compute a 1-based index into a list, based on a Scratch argument.
 * Two special cases may be returned:
 * LIST_ALL: if the block is referring to all of the items in the list.
 * LIST_INVALID: if the index was invalid in any way.
 * @param {*} index Scratch arg, including 1-based numbers or special cases.
 * @param {number} length Length of the list.
 * @return {(number|string)} 1-based index for list, LIST_ALL, or LIST_INVALID.
 */
Cast.toListIndex = function (index, length) {
    if (typeof index !== 'number') {
        if (index === 'all') {
            return Cast.LIST_ALL;
        }
        if (index === 'last') {
            if (length > 0) {
                return length;
            }
            return Cast.LIST_INVALID;
        } else if (index === 'random' || index === 'any') {
            if (length > 0) {
                return 1 + Math.floor(Math.random() * length);
            }
            return Cast.LIST_INVALID;
        }
    }
    index = Math.floor(Cast.toNumber(index));
    if (index < 1 || index > length) {
        return Cast.LIST_INVALID;
    }
    return index;
};

module.exports = Cast;
