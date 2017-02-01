var MathUtil = function () {};

/**
 * Convert a value from degrees to radians.
 * @param {!number} deg Value in degrees.
 * @return {!number} Equivalent value in radians.
 */
MathUtil.degToRad = function (deg) {
    return deg * Math.PI / 180;
};

/**
 * Convert a value from radians to degrees.
 * @param {!number} rad Value in radians.
 * @return {!number} Equivalent value in degrees.
 */
MathUtil.radToDeg = function (rad) {
    return rad * 180 / Math.PI;
};

/**
 * Clamp a number between two limits.
 * If n < min, return min. If n > max, return max. Else, return n.
 * @param {!number} n Number to clamp.
 * @param {!number} min Minimum limit.
 * @param {!number} max Maximum limit.
 * @return {!number} Value of n clamped to min and max.
 */
MathUtil.clamp = function (n, min, max) {
    return Math.min(Math.max(n, min), max);
};

/**
 * Keep a number between two limits, wrapping "extra" into the range.
 * e.g., wrapClamp(7, 1, 5) == 2
 * wrapClamp(0, 1, 5) == 5
 * wrapClamp(-11, -10, 6) == 6, etc.
 * @param {!number} n Number to wrap.
 * @param {!number} min Minimum limit.
 * @param {!number} max Maximum limit.
 * @return {!number} Value of n wrapped between min and max.
 */
MathUtil.wrapClamp = function (n, min, max) {
    var range = (max - min) + 1;
    return n - (Math.floor((n - min) / range) * range);
};


/**
 * Convert a value from tan function in degrees.
 * @param {!number} angle in degrees
 * @return {!number} Correct tan value
 */
MathUtil.tan = function (angle) {
    angle = angle % 360;
    switch (angle) {
    case -270:
    case 90:
        return Infinity;
    case -90:
    case 270:
        return -Infinity;
    default:
        return parseFloat(Math.tan((Math.PI * angle) / 180).toFixed(10));
    }
};

module.exports = MathUtil;
