/**
 * A constant value helping to transform a value in radians to degrees.
 * @type {number}
 */
const TO_DEGREE = 180 / Math.PI;

/**
 * A object reused to save on memory allocation returning u and v vector from
 * motionVector.
 * @type {UV}
 */
const _motionVectorOut = {u: 0, v: 0};

/**
 * Determine a motion vector combinations of the color component difference on
 * the x axis, y axis, and temporal axis.
 * @param {number} A2 - a sum of x axis squared
 * @param {number} A1B2 - a sum of x axis times y axis
 * @param {number} B1 - a sum of y axis squared
 * @param {number} C2 - a sum of x axis times temporal axis
 * @param {number} C1 - a sum of y axis times temporal axis
 * @param {UV} out - optional object to store return UV info in
 * @returns {UV} a uv vector representing the motion for the given input
 */
const motionVector = function (A2, A1B2, B1, C2, C1, out = _motionVectorOut) {
    // Compare sums of X * Y and sums of X squared and Y squared.
    const delta = ((A1B2 * A1B2) - (A2 * B1));
    if (delta) {
        // System is not singular - solving by Kramer method.
        const deltaX = -((C1 * A1B2) - (C2 * B1));
        const deltaY = -((A1B2 * C2) - (A2 * C1));
        const Idelta = 8 / delta;
        out.u = deltaX * Idelta;
        out.v = deltaY * Idelta;
    } else {
        // Singular system - find optical flow in gradient direction.
        const Norm = ((A1B2 + A2) * (A1B2 + A2)) + ((B1 + A1B2) * (B1 + A1B2));
        if (Norm) {
            const IGradNorm = 8 / Norm;
            const temp = -(C1 + C2) * IGradNorm;
            out.u = (A1B2 + A2) * temp;
            out.v = (B1 + A1B2) * temp;
        } else {
            out.u = 0;
            out.v = 0;
        }
    }
    return out;
};

/**
 * Translate an angle in degrees with the range -180 to 180 rotated to
 * Scratch's reference angle.
 * @param {number} degrees - angle in range -180 to 180
 * @returns {number} angle from Scratch's reference angle
 */
const scratchDegrees = function (degrees) {
    return ((degrees + 270) % 360) - 180;
};

/**
 * Get the angle of the y and x component of a 2d vector in degrees in
 * Scratch's coordinate plane.
 * @param {number} y - the y component of a 2d vector
 * @param {number} x - the x component of a 2d vector
 * @returns {number} angle in degrees in Scratch's coordinate plane
 */
const scratchAtan2 = function (y, x) {
    return scratchDegrees(Math.atan2(y, x) * TO_DEGREE);
};

module.exports = {
    motionVector,
    scratchDegrees,
    scratchAtan2
};
