import Cast from '../util/cast.mjs';
import MathUtil from '../util/math-util.mjs';
import Timer from '../util/timer.mjs';

export default class PatchCoreBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            core_endthread: this.endThread,
        };
    }

    endThread(args, util) {
        util.endThread();
    }
}


