/**
 * @fileoverview
 * Interface provided to block primitive functions for interacting with the
 * runtime, thread, target, and convenient methods.
 */

export default class BlockUtility {
    constructor(target = null, runtime = null, thread = null) {
        this._target = target;
        this._runtime = runtime;

        this._thread = thread;

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
    yield() {
        this._thread.yield();
    }

    /**
     * Set the thread to yield until the next tick of the runtime.
     */
    yieldTick() {
        this._thread.yieldTick();
    }

    /**
     * End the current thread of execution as all blocks have been executed
     */
    endThread() {
        this._thread.endThread();
    }

    /**
     * The target the primitive is working on.
     * @type {Target}
     */
    get target() {
        return this._target;
    }

    /**
     * Set the target the primitive is working on.
     */
    set target(newTarget) {
        this._target = newTarget;
    }

    /**
     * The runtime the block primitive is running in.
     * @type {Runtime}
     */
    get runtime() {
        return this._runtime;
    }

    /**
     * Set the runtime the block primitive is running in.
     */
    set runtime(newRuntime) {
        this._runtime = newRuntime;
    }

    /**
     * Query a named IO device.
     * @param {string} device The name of like the device, like keyboard.
     * @param {string} func The name of the device's function to query.
     * @param {Array.<*>} args Arguments to pass to the device's function.
     * @return {*} The expected output for the device's function.
     */
    ioQuery(device, func, args) {
        // Find the I/O device and execute the query/function call.
        if (this._runtime.ioDevices[device] && this._runtime.ioDevices[device][func]) {
            const devObject = this._runtime.ioDevices[device];
            // eslint-disable-next-line prefer-spread
            return devObject[func].apply(devObject, args);
        }
        return null;
    }
}
