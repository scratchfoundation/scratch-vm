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

MathUtil.map = function (n, sMin, sMax, tMin, tMax) {
    return (n - sMin) / (sMax - sMin) * (tMax - tMin) + tMin
};

module.exports = MathUtil;
