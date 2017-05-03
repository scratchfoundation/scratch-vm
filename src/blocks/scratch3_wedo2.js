const log = require('../util/log');

/**
 * Manage power, direction, and timers for one WeDo 2.0 motor.
 */
class WeDo2Motor {
    /**
     * Construct a WeDo2Motor instance.
     * @param {WeDo2} parent - the WeDo 2.0 device which owns this motor.
     * @param {int} index - the zero-based index of this motor on its parent device.
     */
    constructor (parent, index) {
        /**
         * The WeDo 2.0 device which owns this motor.
         * @type {WeDo2}
         * @private
         */
        this._parent = parent;

        /**
         * The zero-based index of this motor on its parent device.
         * @type {int}
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

        this.startBraking = this.startBraking.bind(this);
        this.setMotorOff = this.setMotorOff.bind(this);
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
        this._power = Math.max(0, Math.min(value, 100));
    }

    /**
     * @return {boolean} - true if this motor is currently moving, false if this motor is off or braking.
     */
    get isOn () {
        return this._isOn;
    }

    /**
     * Turn this motor on indefinitely.
     */
    setMotorOn () {
        this._parent._send('motorOn', {motorIndex: this._index, power: this._direction * this._power});
        this._isOn = true;
        this._clearTimeout();
    }

    /**
     * Turn this motor on for a specific duration.
     * @param {number} milliseconds - run the motor for this long.
     */
    setMotorOnFor (milliseconds) {
        milliseconds = Math.max(0, milliseconds);
        this.setMotorOn();
        this._setNewTimeout(this.startBraking, milliseconds);
    }

    /**
     * Start active braking on this motor. After a short time, the motor will turn off.
     */
    startBraking () {
        this._parent._send('motorBrake', {motorIndex: this._index});
        this._isOn = false;
        this._setNewTimeout(this.setMotorOff, WeDo2Motor.BRAKE_TIME_MS);
    }

    /**
     * Turn this motor off.
     */
    setMotorOff () {
        this._parent._send('motorOff', {motorIndex: this._index});
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
            }
            callback();
        }, delay);
        this._pendingTimeoutId = timeoutID;
    }
}

/**
 * Manage communication with a WeDo 2.0 device over a Device Manager client socket.
 */
class WeDo2 {

    /**
     * @return {string} - the type of Device Manager device socket that this class will handle.
     */
    static get DEVICE_TYPE () {
        return 'wedo2';
    }

    /**
     * Construct a WeDo2 communication object.
     * @param {Socket} socket - the socket for a WeDo 2.0 device, as provided by a Device Manager client.
     */
    constructor (socket) {
        /**
         * The socket-IO socket used to communicate with the Device Manager about this device.
         * @type {Socket}
         * @private
         */
        this._socket = socket;

        /**
         * The motors which this WeDo 2.0 could possibly have.
         * @type {[WeDo2Motor]}
         * @private
         */
        this._motors = [new WeDo2Motor(this, 0), new WeDo2Motor(this, 1)];

        /**
         * The most recently received value for each sensor.
         * @type {Object.<string, number>}
         * @private
         */
        this._sensors = {
            tiltX: 0,
            tiltY: 0,
            distance: 0
        };

        this._onSensorChanged = this._onSensorChanged.bind(this);
        this._onDisconnect = this._onDisconnect.bind(this);

        this._connectEvents();
    }

    /**
     * Manually dispose of this object.
     */
    dispose () {
        this._disconnectEvents();
    }

    /**
     * @return {number} - the latest value received for the tilt sensor's tilt about the X axis.
     */
    get tiltX () {
        return this._sensors.tiltX;
    }

    /**
     * @return {number} - the latest value received for the tilt sensor's tilt about the Y axis.
     */
    get tiltY () {
        return this._sensors.tiltY;
    }

    /**
     * @return {number} - the latest value received from the distance sensor.
     */
    get distance () {
        return this._sensors.distance;
    }

    /**
     * Access a particular motor on this device.
     * @param {int} index - the zero-based index of the desired motor.
     * @return {WeDo2Motor} - the WeDo2Motor instance, if any, at that index.
     */
    motor (index) {
        return this._motors[index];
    }

    /**
     * Set the WeDo 2.0 hub's LED to a specific color.
     * @param {int} rgb - a 24-bit RGB color in 0xRRGGBB format.
     */
    setLED (rgb) {
        this._send('setLED', {rgb});
    }

    /**
     * Play a tone from the WeDo 2.0 hub for a specific amount of time.
     * @param {int} tone - the pitch of the tone, in Hz.
     * @param {int} milliseconds - the duration of the note, in milliseconds.
     */
    playTone (tone, milliseconds) {
        this._send('playTone', {tone, ms: milliseconds});
    }

    /**
     * Stop the tone playing from the WeDo 2.0 hub, if any.
     */
    stopTone () {
        this._send('stopTone');
    }

    /**
     * Attach event handlers to the device socket.
     * @private
     */
    _connectEvents () {
        this._socket.on('sensorChanged', this._onSensorChanged);
        this._socket.on('deviceWasClosed', this._onDisconnect);
        this._socket.on('disconnect', this._onDisconnect);
    }

    /**
     * Detach event handlers from the device socket.
     * @private
     */
    _disconnectEvents () {
        this._socket.off('sensorChanged', this._onSensorChanged);
        this._socket.off('deviceWasClosed', this._onDisconnect);
        this._socket.off('disconnect', this._onDisconnect);
    }

    /**
     * Store the sensor value from an incoming 'sensorChanged' event.
     * @param {object} event - the 'sensorChanged' event.
     * @property {string} sensorName - the name of the sensor which changed.
     * @property {number} sensorValue - the new value of the sensor.
     * @private
     */
    _onSensorChanged (event) {
        this._sensors[event.sensorName] = event.sensorValue;
    }

    /**
     * React to device disconnection. May be called more than once.
     * @private
     */
    _onDisconnect () {
        this._disconnectEvents();
    }

    /**
     * Send a message to the device socket.
     * @param {string} message - the name of the message, such as 'playTone'.
     * @param {object} [details] - optional additional details for the message, such as tone duration and pitch.
     * @private
     */
    _send (message, details) {
        this._socket.emit(message, details);
    }
}

/**
 * Scratch 3.0 blocks to interact with a LEGO WeDo 2.0 device.
 */
class Scratch3WeDo2Blocks {

    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME () {
        return 'wedo2';
    }

    /**
     * Construct a set of WeDo 2.0 blocks.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        this.runtime.HACK_WeDo2Blocks = this;
    }

    /**
     * Use the Device Manager client to attempt to connect to a WeDo 2.0 device.
     */
    connect () {
        if (this._device || this._finder) {
            return;
        }
        const deviceManager = this.runtime.ioDevices.deviceManager;
        const finder = this._finder =
            deviceManager.searchAndConnect(Scratch3WeDo2Blocks.EXTENSION_NAME, WeDo2.DEVICE_TYPE);
        this._finder.promise.then(
            socket => {
                if (this._finder === finder) {
                    this._finder = null;
                    this._device = new WeDo2(socket);
                } else {
                    log.warn('Ignoring success from stale WeDo 2.0 connection attempt');
                }
            },
            reason => {
                if (this._finder === finder) {
                    this._finder = null;
                    log.warn(`WeDo 2.0 connection failed: ${reason}`);
                } else {
                    log.warn('Ignoring failure from stale WeDo 2.0 connection attempt');
                }
            });
    }
}

module.exports = Scratch3WeDo2Blocks;
