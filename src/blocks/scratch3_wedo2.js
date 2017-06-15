const EventEmitter = require('events');

const color = require('../util/color');
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
class WeDo2 extends EventEmitter {

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
        super();

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
        this.emit('disconnect');
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
 * Enum for motor specification.
 * @readonly
 * @enum {string}
 */
const MotorID = {
    DEFAULT: 'motor',
    A: 'motor A',
    B: 'motor B',
    ALL: 'all motors'
};

/**
 * Enum for motor direction specification.
 * @readonly
 * @enum {string}
 */
const MotorDirection = {
    FORWARD: 'this way',
    BACKWARD: 'that way',
    REVERSE: 'reverse'
};

/**
 * Enum for tilt sensor direction.
 * @readonly
 * @enum {string}
 */
const TiltDirection = {
    UP: 'up',
    DOWN: 'down',
    LEFT: 'left',
    RIGHT: 'right',
    ANY: 'any'
};

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
     * @return {number} - the tilt sensor counts as "tilted" if its tilt angle meets or exceeds this threshold.
     */
    static get TILT_THRESHOLD () {
        return 15;
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
                    const device = new WeDo2(socket);
                    device.on('disconnect', () => this._onDeviceDisconnect(device));
                    this._device = device;
                } else {
                    log.warn('Ignoring success from stale WeDo 2.0 connection attempt');
                }
            },
            reason => {
                if (this._finder === finder) {
                    this._finder = null;
                    log.warn(`WeDo 2.0 connection failed: ${reason}. Retrying...`);
                    this.connect();
                } else {
                    log.warn('Ignoring failure from stale WeDo 2.0 connection attempt');
                }
            });
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            wedo2_motorOnFor: this.motorOnFor,
            wedo2_motorOn: this.motorOn,
            wedo2_motorOff: this.motorOff,
            wedo2_startMotorPower: this.startMotorPower,
            wedo2_setMotorDirection: this.setMotorDirection,
            wedo2_setLightHue: this.setLightHue,
            wedo2_playNoteFor: this.playNoteFor,
            wedo2_whenDistance: this.whenDistance,
            wedo2_whenTilted: this.whenTilted,
            wedo2_getDistance: this.getDistance,
            wedo2_isTilted: this.isTiltedReporter,
            wedo2_getTiltAngle: this.getTiltAngle
        };
    }

    getHats () {
        return {
            wedo2_whenDistance: {
                restartExistingThreads: true,
                edgeActivated: true
            },
            wedo2_whenTilted: {
                restartExistingThreads: true,
                edgeActivated: true
            }
        };
    }

    /**
     * Turn specified motor(s) on for a specified duration.
     * @param {object} args - the block's arguments.
     * @property {MotorID} MOTOR_ID - the motor(s) to activate.
     * @property {int} DURATION - the amount of time to run the motors.
     * @return {Promise} - a promise which will resolve at the end of the duration.
     */
    motorOnFor (args) {
        const durationMS = args.DURATION * 1000;
        return new Promise(resolve => {
            if (this._device) {
                this._forEachMotor(args.MOTOR_ID, motorIndex => {
                    this._device.motor(motorIndex).setMotorOnFor(durationMS);
                });
            }
            // Ensure this block runs for a fixed amount of time even when no device is connected.
            setTimeout(resolve, durationMS);
        });
    }

    /**
     * Turn specified motor(s) on indefinitely.
     * @param {object} args - the block's arguments.
     * @property {MotorID} MOTOR_ID - the motor(s) to activate.
     * @return {Promise} - a promise which will resolve after a short wait.
     */
    motorOn (args) {
        if (this._device) {
            this._forEachMotor(args.MOTOR_ID, motorIndex => {
                this._device.motor(motorIndex).setMotorOn();
            });
        }
        return this._shortWait();
    }

    /**
     * Turn specified motor(s) off.
     * @param {object} args - the block's arguments.
     * @property {MotorID} MOTOR_ID - the motor(s) to deactivate.
     * @return {Promise} - a promise which will resolve after a short wait.
     */
    motorOff (args) {
        if (this._device) {
            this._forEachMotor(args.MOTOR_ID, motorIndex => {
                this._device.motor(motorIndex).setMotorOff();
            });
        }
        return this._shortWait();
    }

    /**
     * Turn all motors off.
     */
    allMotorsOff () {
        if (this._device) {
            this._forEachMotor(MotorID.ALL, motorIndex => {
                this._device.motor(motorIndex).setMotorOff();
            });
        }
    }

    /**
     * Set the power level of the specified motor(s).
     * @param {object} args - the block's arguments.
     * @property {MotorID} MOTOR_ID - the motor(s) to be affected.
     * @property {int} POWER - the new power level for the motor(s).
     * @return {Promise} - a promise which will resolve after a short wait.
    */
    startMotorPower (args) {
        if (this._device) {
            this._forEachMotor(args.MOTOR_ID, motorIndex => {
                const motor = this._device.motor(motorIndex);
                motor.power = args.POWER;
                motor.setMotorOn();
            });
        }
        return this._shortWait();
    }

    /**
     * Set the direction of rotation for specified motor(s).
     * If the direction is 'reverse' the motor(s) will be reversed individually.
     * @param {object} args - the block's arguments.
     * @property {MotorID} MOTOR_ID - the motor(s) to be affected.
     * @property {MotorDirection} DIRECTION - the new direction for the motor(s).
     */
    setMotorDirection (args) {
        if (!this._device) {
            return;
        }
        this._forEachMotor(args.MOTOR_ID, motorIndex => {
            const motor = this._device.motor(motorIndex);
            switch (args.DIRECTION) {
            case MotorDirection.FORWARD:
                motor.direction = 1;
                break;
            case MotorDirection.BACKWARD:
                motor.direction = -1;
                break;
            case MotorDirection.REVERSE:
                motor.direction = -motor.direction;
                break;
            default:
                log.warn(`Unknown motor direction in setMotorDirection: ${args.DIRECTION}`);
                break;
            }
        });
    }

    /**
     * Set the LED's hue.
     * @param {object} args - the block's arguments.
     * @property {number} HUE - the hue to set, in the range [0,100].
     * @return {Promise} - a promise which will resolve at the end of a short wait.
     */
    setLightHue (args) {
        // Convert from [0,100] to [0,360]
        const hue = args.HUE * 360 / 100;

        const rgbObject = color.hsvToRgb({h: hue, s: 1, v: 1});

        const rgbDecimal = color.rgbToDecimal(rgbObject);

        if (this._device) {
            this._device.setLED(rgbDecimal);
        }
        return this._shortWait();
    }

    /**
     * Make the WeDo 2.0 hub play a MIDI note for the specified duration.
     * @param {object} args - the block's arguments.
     * @property {number} NOTE - the MIDI note to play.
     * @property {number} DURATION - the duration of the note, in seconds.
     * @return {Promise} - a promise which will resolve at the end of the duration.
     */
    playNoteFor (args) {
        return new Promise(resolve => {
            const durationMS = args.DURATION * 1000;
            const tone = this._noteToTone(args.NOTE);
            if (this._device) {
                this._device.playTone(tone, durationMS);
            }
            // Ensure this block runs for a fixed amount of time even when no device is connected.
            setTimeout(resolve, durationMS);
        });
    }

    /**
     * Compare the distance sensor's value to a reference.
     * @param {object} args - the block's arguments.
     * @property {string} OP - the comparison operation: '<' or '>'.
     * @property {number} REFERENCE - the value to compare against.
     * @return {boolean} - the result of the comparison, or false on error.
     */
    whenDistance (args) {
        if (!this._device) {
            return false;
        }
        switch (args.OP) {
        case '&lt;': // @todo: prevent this arg from sometimes getting encoded
        case '<':
            return this.getDistance() < args.REFERENCE;
        case '&gt;':
        case '>':
            return this.getDistance() > args.REFERENCE;
        default:
            log.warn(`Unknown comparison operator in whenDistance: ${args.OP}`);
            return false;
        }
    }

    /**
     * Test whether the tilt sensor is currently tilted.
     * @param {object} args - the block's arguments.
     * @property {TiltDirection} DIRECTION - the tilt direction to test (up, down, left, right, or any).
     * @return {boolean} - true if the tilt sensor is tilted past a threshold in the specified direction.
     */
    whenTilted (args) {
        return this._isTilted(args.DIRECTION);
    }

    /**
     * @return {number} - the distance sensor's value, scaled to the [0,100] range.
     */
    getDistance () {
        if (!this._device) {
            return 0;
        }
        return this._device.distance * 10;
    }

    /**
     * For the boolean reporter, test whether the tilt sensor is currently tilted.
     * If the "any" direction is selected, return true if at least one of the directions is tilted.
     * @param {object} args - the block's arguments.
     * @property {TiltDirection} DIRECTION - the tilt direction to test (up, down, left, right, or any).
     * @return {boolean} - true if the tilt sensor is tilted past a threshold in the specified direction.
     */
    isTiltedReporter (args) {
        switch (args.DIRECTION) {
        case TiltDirection.ANY:
            return (Math.abs(this._device.tiltX) >= Scratch3WeDo2Blocks.TILT_THRESHOLD) ||
                (Math.abs(this._device.tiltY) >= Scratch3WeDo2Blocks.TILT_THRESHOLD);
        default:
            return this._getTiltAngle(args.DIRECTION) >= Scratch3WeDo2Blocks.TILT_THRESHOLD;
        }
    }

    /**
     * @param {object} args - the block's arguments.
     * @property {TiltDirection} DIRECTION - the direction (up, down, left, right) to check.
     * @return {number} - the tilt sensor's angle in the specified direction.
     * Note that getTiltAngle(up) = -getTiltAngle(down) and getTiltAngle(left) = -getTiltAngle(right).
     */
    getTiltAngle (args) {
        return this._getTiltAngle(args.DIRECTION);
    }

    /**
     * Test whether the tilt sensor is currently tilted.
     * @param {TiltDirection} direction - the tilt direction to test (up, down, left, right, or any).
     * @return {boolean} - true if the tilt sensor is tilted past a threshold in the specified direction.
     * @private
     */
    _isTilted (direction) {
        if (!this._device) {
            return false;
        }
        switch (direction) {
        case TiltDirection.ANY:
            if (!this._getPrevTilted(TiltDirection.UP) && this._isTilted(TiltDirection.UP)) {
                this._updatePrevTilted();
                return true;
            }
            if (!this._getPrevTilted(TiltDirection.DOWN) && this._isTilted(TiltDirection.DOWN)) {
                this._updatePrevTilted();
                return true;
            }
            if (!this._getPrevTilted(TiltDirection.LEFT) && this._isTilted(TiltDirection.LEFT)) {
                this._updatePrevTilted();
                return true;
            }
            if (!this._getPrevTilted(TiltDirection.RIGHT) && this._isTilted(TiltDirection.RIGHT)) {
                this._updatePrevTilted();
                return true;
            }
            return false;
        default:
            return this._getTiltAngle(direction) >= Scratch3WeDo2Blocks.TILT_THRESHOLD;
        }
    }

    /**
     * Get the previous state for whether the tilt sensor was tilted. This is used by the "when tilted
     * block, with direction "any" selected.
     * @param {TiltDirection} direction - the previous tilt direction (up, down, left, right).
     * @return {boolean} - true if the tilt sensor is was previously tilted past a threshold in the specified direction.
     * @private
     */
    _getPrevTilted (direction) {
        if (!this._device) {
            return false;
        }
        switch (direction) {
        case TiltDirection.UP:
            if (!this.prevTiltedUp) {
                this.prevTiltedUp = false;
            }
            return this.prevTiltedUp;
        case TiltDirection.DOWN:
            if (!this.prevTiltedDown) {
                this.prevTiltedDown = false;
            }
            return this.prevTiltedDown;
        case TiltDirection.LEFT:
            if (!this.prevTiltedLeft) {
                this.prevTiltedLeft = false;
            }
            return this.prevTiltedLeft;
        case TiltDirection.RIGHT:
            if (!this.prevTiltedRight) {
                this.prevTiltedRight = false;
            }
            return this.prevTiltedRight;
        default:
            return false;
        }
    }

    /**
     * Update the value of the variables storing previous tilt information.
     * This is used by the "when tilted block, with direction "any" selected.
     */
    _updatePrevTilted () {
        this.prevTiltedUp = this._isTilted(TiltDirection.UP);
        this.prevTiltedDown = this._isTilted(TiltDirection.DOWN);
        this.prevTiltedLeft = this._isTilted(TiltDirection.LEFT);
        this.prevTiltedRight = this._isTilted(TiltDirection.RIGHT);
    }

    /**
     * @param {TiltDirection} direction - the direction (up, down, left, right) to check.
     * @return {number} - the tilt sensor's angle in the specified direction.
     * Note that getTiltAngle(up) = -getTiltAngle(down) and getTiltAngle(left) = -getTiltAngle(right).
     * @private
     */
    _getTiltAngle (direction) {
        if (!this._device) {
            return 0;
        }
        switch (direction) {
        case TiltDirection.UP:
            return -this._device.tiltY;
        case TiltDirection.DOWN:
            return this._device.tiltY;
        case TiltDirection.LEFT:
            return -this._device.tiltX;
        case TiltDirection.RIGHT:
            return this._device.tiltX;
        default:
            log.warn(`Unknown tilt direction in _getTiltAngle: ${direction}`);
        }
    }

    /**
     * Call a callback for each motor indexed by the provided motor ID.
     * @param {MotorID} motorID - the ID specifier.
     * @param {Function} callback - the function to call with the numeric motor index for each motor.
     * @private
     */
    _forEachMotor (motorID, callback) {
        let motors;
        switch (motorID) {
        case MotorID.A:
            motors = [0];
            break;
        case MotorID.B:
            motors = [1];
            break;
        case MotorID.ALL:
        case MotorID.DEFAULT:
            motors = [0, 1];
            break;
        default:
            log.warn(`Invalid motor ID: ${motorID}`);
            motors = [];
            break;
        }
        for (const index of motors) {
            callback(index);
        }
    }

    /**
     * @param {number} midiNote - the MIDI note value to convert.
     * @return {number} - the frequency, in Hz, corresponding to that MIDI note value.
     * @private
     */
    _noteToTone (midiNote) {
        // Note that MIDI note 69 is A4, 440 Hz
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    }

    /**
     * Wait for a short time, to prevent sending messages too fast.
     * @return {Promise} - a promise which will resolve at the end of the wait time.
      */
    _shortWait () {
        return new Promise(resolve => {
            setTimeout(resolve, 200);
        });
    }

    /**
     * React to a device becoming disconnected.
     * @param {WeDo2} device - the device which has become disconnected.
     * @private
     */
    _onDeviceDisconnect (device) {
        if (this._device === device) {
            this._device = null;

            log.warn('WeDo 2.0 disconnected. Attempting to reconnect...');

            this.connect();
        }
    }
}

module.exports = Scratch3WeDo2Blocks;
