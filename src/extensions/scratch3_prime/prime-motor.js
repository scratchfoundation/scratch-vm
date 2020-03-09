/**
 * Manage the state of one Prime motor.
 */

const PrimePortName = ['A', 'B', 'C', 'D', 'E', 'F'];

class PrimeMotor {
    /**
     * Construct a Prime Motor instance.
     * @param {Prime} parent - the Prime peripheral which owns this motor.
     * @param {int} index - the zero-based index of this motor on its parent peripheral.
     */
    constructor (parent, index) {
        /**
         * The Prime peripheral which owns this motor.
         * @type {Prime}
         * @private
         */
        this._parent = parent;

        /**
         * The zero-based index of this motor on its parent peripheral.
         * @type {number}
         * @private
         */
        this._index = index;

        /**
         * This motor's current direction: 1 for "this way" or -1 for "that way"
         * @type {number}
         * @private
         */
        this._direction = 1;

        /**
         * This motor's current power level, in the range [0,100].
         * @type {number}
         * @private
         */
        this._power = 100;

        /**
         * Is this motor currently moving?
         * @type {boolean}
         * @private
         */
        this._isOn = false;

        /**
         * If the motor has been turned on or is actively braking for a specific duration, this is the timeout ID for
         * the end-of-action handler. Cancel this when changing plans.
         * @type {Object}
         * @private
         */
        this._pendingTimeoutId = null;

        /**
         * The starting time for the pending timeout.
         * @type {Object}
         * @private
         */
        this._pendingTimeoutStartTime = null;

        /**
         * The delay/duration of the pending timeout.
         * @type {Object}
         * @private
         */
        this._pendingTimeoutDelay = null;

        /**
         * The starting time for the pending timeout.
         * @type {Object}
         * @private
         */
        this._pendingPromiseFunction = false;

        this._pendingPromiseId = null;

        // this.startBraking = this.startBraking.bind(this);
        this.turnOff = this.turnOff.bind(this);
    }

    /**
     * @return {number} - the duration of active braking after a call to startBraking(). Afterward, turn the motor off.
     * @constructor
     */
    static get BRAKE_TIME_MS () {
        return 1000;
    }

    /**
     * @return {int} - this motor's current direction: 1 for "this way" or -1 for "that way"
     */
    get direction () {
        return this._direction;
    }

    /**
     * @param {int} value - this motor's new direction: 1 for "this way" or -1 for "that way"
     */
    set direction (value) {
        if (value < 0) {
            this._direction = -1;
        } else {
            this._direction = 1;
        }
    }

    /**
     * @return {int} - this motor's current power level, in the range [0,100].
     */
    get power () {
        return this._power;
    }

    /**
     * @param {int} value - this motor's new power level, in the range [0,100].
     */
    set power (value) {
        const p = Math.max(0, Math.min(value, 100));
        // Lego Wedo 2.0 hub only turns motors at power range [30 - 100], so
        // map value from [0 - 100] to [30 - 100].
        if (p === 0) {
            this._power = 0;
        } else {
            const delta = 100 / p;
            this._power = 30 + (70 / delta);
        }
    }

    /**
     * @return {int} - this motor's current power level, in the range [0,100].
     */
    get position () {
        return this._position;
    }

    /**
     * @param {int} value - this motor's new power level, in the range [-180,179].
     */
    set position (value) {
        this._position = value;
    }

    /**
     * @return {boolean} - true if this motor is currently moving, false if this motor is off or braking.
     */
    get isOn () {
        return this._isOn;
    }

    /**
     * @return {boolean} - time, in milliseconds, of when the pending timeout began.
     */
    get pendingTimeoutStartTime () {
        return this._pendingTimeoutStartTime;
    }

    /**
     * @return {boolean} - delay, in milliseconds, of the pending timeout.
     */
    get pendingTimeoutDelay () {
        return this._pendingTimeoutDelay;
    }

    /**
     * @return {boolean} - delay, in milliseconds, of the pending timeout.
     */
    get pendingPromiseFunction () {
        return this._pendingPromiseFunction;
    }

    set pendingPromiseFunction (func) {
        this._pendingPromiseFunction = func;
    }

    get pendingPromiseId () {
        return this._pendingPromiseId;
    }

    set pendingPromiseId (id) {
        this._pendingPromiseId = id;
    }

    /**
     * Turn this motor on indefinitely.
     */
    turnOn () {
        if (this._power === 0) return;

        const cmd = this._parent.generateOutputCommand({
            m: 'scratch.motor_start',
            p: {
                port: PrimePortName[this._index],
                speed: this._power * this._direction,
                stall: 'False'
            }
        });

        this._parent.send(cmd);

        this._isOn = true;
        this._clearTimeout();
    }

    /**
     * Turn this motor on for a specific duration.
     * @param {number} milliseconds - run the motor for this long.
     */
    turnOnFor (milliseconds) {
        if (this._power === 0) return;
        milliseconds = Math.max(0, milliseconds);
        this.turnOn();
        this._setNewTimeout(this.turnOff, milliseconds);
    }

    /**
     * Turn this motor on for a specific duration.
     * @param {number} rotations - run the motor for this long.
     * @param {number} sign - which direction to turn the motor
     * @return {number} - id to use for feedback
     */
    turnOnForRotation (rotations, sign) {
        if (this._power === 0) return;

        const cmd = this._parent.generateOutputCommand({
            m: 'scratch.motor_run_for_degrees',
            p: {
                port: PrimePortName[this._index],
                degrees: rotations * 360,
                speed: this._power * this._direction * sign,
                stall: 'False',
                stop: 1 // 0 = STOP_FLOAT, 1 = STOP_BRAKE, 2 = STOP_HOLD
            }
        });

        this._parent.send(cmd);
        return cmd.i;
    }

    /**
     * Turn this motor off.
     * @param {boolean} [useLimiter=true] - if true, use the rate limiter
     */
    turnOff (useLimiter = true) {
        if (this._power === 0) return;

        const cmd = this._parent.generateOutputCommand({
            m: 'scratch.motor_stop',
            p: {
                port: PrimePortName[this._index],
                stop: 1 // 0 = STOP_FLOAT, 1 = STOP_BRAKE, 2 = STOP_HOLD
            }
        });
        this._parent.send(cmd);

        this._isOn = false;
    }

    /**
     * Clear the motor action timeout, if any. Safe to call even when there is no pending timeout.
     * @private
     */
    _clearTimeout () {
        if (this._pendingTimeoutId !== null) {
            clearTimeout(this._pendingTimeoutId);
            this._pendingTimeoutId = null;
            this._pendingTimeoutStartTime = null;
            this._pendingTimeoutDelay = null;
        }
    }

    /**
     * Set a new motor action timeout, after clearing an existing one if necessary.
     * @param {Function} callback - to be called at the end of the timeout.
     * @param {int} delay - wait this many milliseconds before calling the callback.
     * @private
     */
    _setNewTimeout (callback, delay) {
        this._clearTimeout();
        const timeoutID = setTimeout(() => {
            if (this._pendingTimeoutId === timeoutID) {
                this._pendingTimeoutId = null;
                this._pendingTimeoutStartTime = null;
                this._pendingTimeoutDelay = null;
            }
            callback();
        }, delay);
        this._pendingTimeoutId = timeoutID;
        this._pendingTimeoutStartTime = Date.now();
        this._pendingTimeoutDelay = delay;
    }
}

module.exports = PrimeMotor;
