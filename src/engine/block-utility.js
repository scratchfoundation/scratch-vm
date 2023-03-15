/**
 * @fileoverview
 * Interface provided to block primitive functions for interacting with the
 * runtime, thread, target, and convenient methods.
 */

export default class BlockUtility {
    constructor (target = null, runtime = null) {
        this._target = target;
        this._runtime = runtime;
    }

    /**
     * The target the primitive is working on.
     * @type {Target}
     */
    get target () {
        return this._target;
    }

    /**
     * Set the target the primitive is working on.
     */
    set target (newTarget) {
        this._target = newTarget;
    }

    /**
     * The runtime the block primitive is running in.
     * @type {Runtime}
     */
    get runtime () {
        return this._runtime;
    }

    /**
     * Set the runtime the block primitive is running in.
     */
    set runtime (newRuntime) {
        this._runtime = newRuntime;
    }
}
