import Thread from './thread.mjs'

/**
 * @fileoverview
 * Interface provided to block primitive functions for interacting with the
 * runtime, thread, target, and convenient methods.
 */

export default class BlockUtility {
    constructor (target = null, runtime = null, thread = null) {
        this._target = target;
        this._runtime = runtime;

        this.thread = thread

        this.timerUtil = {};
        this.timerUtil.timer = null;
        this.timerUtil.duration = null;
        this.timerUtil.startX = null;
        this.timerUtil.startY = null;
        this.timerUtil.endX = null;
        this.timerUtil.endY = null;
        
    }

    /**
     * Set the thread to yield.
     */
    yield () {
        this.thread.setStatus(Thread.STATUS_YIELD);
    }

    /**
     * Set the thread to yield until the next tick of the runtime.
     */
    yieldTick () {
        this.thread.setStatus(Thread.STATUS_YIELD_TICK);
    }

    /**
     * End the current thread of execution as all blocks have been executed
     */
    endThread () {
        this.thread.setStatus(Thread.STATUS_DONE);
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
