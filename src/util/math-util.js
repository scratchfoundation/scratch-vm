class MathUtil {
    /**
     * Convert a value from degrees to radians.
     * @param {!number} deg Value in degrees.
     * @return {!number} Equivalent value in radians.
     */
    static degToRad (deg) {
        return deg * Math.PI / 180;
    }

    /**
     * Convert a value from radians to degrees.
     * @param {!number} rad Value in radians.
     * @return {!number} Equivalent value in degrees.
     */
    static radToDeg (rad) {
        return rad * 180 / Math.PI;
    }

    /**
     * Clamp a number between two limits.
     * If n < min, return min. If n > max, return max. Else, return n.
     * @param {!number} n Number to clamp.
     * @param {!number} min Minimum limit.
     * @param {!number} max Maximum limit.
     * @return {!number} Value of n clamped to min and max.
     */
    static clamp (n, min, max) {
        return Math.min(Math.max(n, min), max);
    }

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
    static wrapClamp (n, min, max) {
        const range = (max - min) + 1;
        return n - (Math.floor((n - min) / range) * range);
    }


    /**
     * Convert a value from tan function in degrees.
     * @param {!number} angle in degrees
     * @return {!number} Correct tan value
     */
    static tan (angle) {
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
    }

    /**
     * Given an array of unique numbers,
     * returns a reduced array such that each element of the reduced array
     * represents the position of that element in a sorted version of the
     * original array.
     * E.g. [5, 19. 13, 1] => [1, 3, 2, 0]
     * @param {Array<number>} elts The elements to sort and reduce
     * @return {Array<number>} The array of reduced orderings
     */
    static reducedSortOrdering (elts) {
        const sorted = elts.slice(0).sort((a, b) => a - b);
        return elts.map(e => sorted.indexOf(e));
    }

    /**
     * Return a random number given an inclusive range and a set
     * of numbers that should be excluded.
     * For instance, (1, 5, [2, 3]) will only pick 1, 4, or 5 (with equal
     * probability)
     *
     * @param {number} lower - The lower bound (inlcusive)
     * @param {number} upper - The upper bound (inclusive), such that lower <= upper
     * @param {number} exclude - The numbers to exclude (MUST be in the range)
     */
    static inclusiveRandIntWithout(lower, upper, excluded) {
        /**
         * By excluding a random integer, we are lowering the number
         * of possible options by one.
         *
         * The algorithm is to pick a random integer in the range
         * [lower, upper-1]. If we accidentally pick the exlcuded number,
         * we will instead pikc "upper".
         *
         * So if C is excluded, and we are picking A..F then:
         *
         * A B C D E (no F)
         * = = = = =
         * A B F D E
         *
         * In the event that our excluded number isn't in the range, we will never pick it,
         * and so we don't need to worry about remapping it to something else. For example,
         * if we want to exclude 'F':
         *
         * A B C D E (no F)
         * = = = = =
         * A B C D E
         */

        // Note that 5 - 3 = 2, but there are 3 options (3, 4, 5).
        // As a result, there isn't a need to subtract 1 as we've
        // already got one less than the size of the range.
        const possibleOptions = upper - lower;

        const randInt = lower + Math.floor(Math.random() * possibleOptions);
        if (randInt === excluded) {
            // We've picked the excluded number.
            return upper;
        } else {
            // We haven't picked the excluded number, so this
            // value maps to itself.
            return randInt;
        }
    }
}

module.exports = MathUtil;
