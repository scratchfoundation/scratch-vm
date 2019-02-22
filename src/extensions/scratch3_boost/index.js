const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const formatMessage = require('format-message');
const color = require('../../util/color');
const BLE = require('../../io/ble');
const Base64Util = require('../../util/base64-util');
const MathUtil = require('../../util/math-util');
const RateLimiter = require('../../util/rateLimiter.js');
const log = require('../../util/log');

/**
 * The LEGO Wireless Protocol documentation used to create this extension can be found at:
 * https://lego.github.io/lego-ble-wireless-protocol-docs/index.html
 */

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const iconURI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAACXBIWXMAABYlAAAWJQFJUiTwAAAF8klEQVR4Ae2cbWxTVRjH/7ctbVc2tyEMNpWBk0VIkLcEjSAQgglTE5HEaKqJi1E/mbCP/dJA0kQbvzgTQ0Ki2T7V6AeYGoEPLJmGKPiyzZDwEpYJCHSbQIcbdLvres1zOa13Xbvdu2eTDp9fst329Lnn5XfPPfece7tphmFAmDkuccdDBDIRgUxEIBMRyEQEMhGBTEQgExHIRAQyEYFMRCATEchEBDIRgUxEIBMRyEQEMhGBTEQgExHIxMPNIByNVQBoBUDb7kgo2KTS9wBoUmFNkVCwW6U3A1gP4JJKHwxHY/S+WcW2RkLBVhV7AMAOAIMAGlWstbyOSCh4QMU2Uoy1PBVL+a7IqZu1vOZIKNg20/azBarGvKxebw9HY22RULADwBFLTBcATQnZl4lVEimN4ssteXQrQfstebQpmW1q30xshyqvxRLbofYnYW9ZYgeV8C5LLOWlzbTxM3ouHI7GPgSwWx3Z0syBSBku6IYnlTbM+uQenJQaMnKHDaqAFnDrcCFbl3G1defEjas0a4N/Vz10OybyvapfrSX1sjpo+WIz0ME7QL3djgtHPTAcjb2mepw/b2ZaGh5NL5RnofR8R99dIC5fHusK5JsrCUpm7TSx21XvbcwTNwnbAsPR2GcA3qaG+H0LsHlDPZ7fca/ujZ+cRW9/Em5vCXzlNVhQUjFpf/3OTSRvXkKJz43Xt1bh1S1LUeq/5+njQ9/iVmLIfL1ieRU2b1iFtavztXNu6TrTi8PfnYI67WdPoOp5przV9Y8iuHdb9rOW9uumPI+vDIElddBckztPOqVn5X36Xj1WVQeynx1sOWbK83jc2PviM/dFXIYNax9H55leXLoyYHsfWwI14JCRRx7x5ckBU1oheYQ+1G9u39lVM0Hej7+cR7w/Yb7e9+5LqChfaLvixcK088BwNNZkAOV02ubK6+odwt3RcfOULSSPGEveG48bNj08If3kqXPmdtO6unkpDzYn0u/TLxrzcumJJ80Ut79sygzoFF6/siw75mUYupOEpmnY0/A0pw33FTsCa+hX5oJhZXgkZb5zub2O20CnL7EwkPeCPm+wI7CEBvi5wuOZ36tJW7X3uGXJXAgxk8P4eNpRPEvgskqfuR0Z/BNGejxvDM3/5gs0pboWv+motqybCc+tqUCzz43kaBJ/X+2eMjZ3ClNsjIzo5ioknXZ2b4AlkKYltLJoaY9jOJm/B0KJbtg4c4F/XOmH3+dF9dLKbBo1OD6QQGV56YQ55ODtO0jcHkZ1VSX8/n9nB9S7RkZ1rFy+NG8ZR9s70TeQQKDEh7vJUdt1Y9/OopXFB2/WcbMpyOexE9mlFS21aLlHMmKHfzBl0QT/hV2bzM9oLXv0xG8YGR0zpdLEn6RT2k+/XjDzoLX2G3u3TZBLUyral/Z5qCyAK1f/sl2/or+IWNel1Eji3MWrpjyCZHWqdNrSe6ieSHFERl4mP+q5GehgHGvvRGal5XI5uzU47f3A/R99YTgdF2wXrmkolr9ToZ5NvTjT4yOhoC2T057CJM/r9WDxoqmXa07R9THcuDVcMO8bt4ag6ynULKvkFjWBTLl0ugZKvNlyqLeSQKfYGgOpgXt2b5zVhlzrS+Dr451YvKg0b95txztxvS8xZ+VuXFuLJ5+oNgV+9c3PuHDxGs6cu+w4v//9RJo6x5bN9UgbBo4cPY1U6j+cSD8orFvzGFYuX4KxsRQGbth6FCICc9m5dY05HtN46AQRqPB5PWjY+ZT5RnMwkxGBFh5ZVmle9Z3MrGbjwfqccrC1vajrV7QCaVCfS6qrJj96nQlFK5CujPRT7MgYyEQEMhGBTGwJpAW4kJ9pBbo0zbx70X7y7AOv8HxP3LyB4YTpb2cZBt2iqL3QEwf9zDbX+waLca439QMeC7a+YBmOxugLiM/OTt2yaOoMoO+H6LOcNwf6xusrthsh/7mIh1yFmYhAJiKQiQhkIgKZiEAmIpCJCGQiApmIQCYikIkIZCICmYhAJiKQiQhkIgKZiEAmIpCJCGQiAjkA+AeOwQKMcWZqHgAAAABJRU5ErkJggg==';

/**
 * Boost BLE service UUID.
 * @type {string}
 */
const BLEService = '00001623-1212-efde-1623-785feabcd123';

/**
 * Boost BLE characteristic UUID.
 * @type {string}
 */
const BLECharacteristic = '00001624-1212-efde-1623-785feabcd123';

/**
 * A time interval to wait (in milliseconds) while a block that sends a BLE message is running.
 * @type {number}
 */
const BLESendInterval = 100;

/**
 * A maximum number of BLE message sends per second, to be enforced by the rate limiter.
 * @type {number}
 */
const BLESendRateMax = 20;

/**
 * Enum for Boost sensor and actuator types.
 * @readonly
 * @enum {number}
 */
const BoostIO = {
    MOTORINT: 0x27,
    MOTOREXT: 0x26,
    LED: 0x17,
    TILT: 0x28,
    COLOR: 0x25,
    VOLTAGE: 0x14,
    CURRENT: 0x15, 
};

/**
 * Enum for ids for various output command feedback types on the Boost.
 * @readonly
 * @enum {number}
 */
const BoostOutputCommandFeedback = {
    BUFFER_EMPTY_COMMAND_IN_PROGRESS: 0x01,
    BUFFER_EMPTY_COMMAND_COMPLETED: 0x02,
    CURRENT_COMMAND_DISCARDED: 0x04,
    IDLE: 0x08,
    BUSY_OR_FULL: 0x10,
};


/**
 * Enum for physical Boost Ports
 * @readonly
 * @enum {number}
 */
const BoostPort = {
    A: 55,
    B: 56,
    C: 1,
    D: 2
};

const BoostColor = {
    NONE: 255,
    RED: 9,
    BLUE: 3,
    GREEN: 5,
    YELLOW: 7,
    WHITE: 10,
    BLACK: 0
}

/**
 * Enum for Message Types
 * @readonly
 * @enum {number}
 */

const BoostMessage = {
    HUB_PROPERTIES: 0x01,
    HUB_ACTIONS: 0x02,
    HUB_ALERTS: 0x03,
    HUB_ATTACHED_IO: 0x04,
    ERROR: 0x05,
    PORT_INPUT_FORMAT_SETUP_SINGLE: 0x41,
    PORT_INPUT_FORMAT_SETUP_COMBINED: 0x42,
    PORT_INFORMATION: 0x43,
    PORT_MODEINFORMATION: 0x44,
    PORT_VALUE: 0x45,
    PORT_VALUE_COMBINED: 0x46,
    PORT_INPUT_FORMAT: 0x47,
    PORT_INPUT_FORMAT_COMBINED: 0x48,
    OUTPUT: 0x81,
    PORT_OUTPUT_COMMAND_FEEDBACK: 0x82
}

/**
 * Enum for Motor Subcommands (for 0x81)
 * @readonly
 * @enum {number}
 */

const BoostOutputSubCommand = {
    START_POWER_PAIR: 0x02,
    SET_ACC_TIME: 0x05,
    SET_DEC_TIME: 0x06,
    START_SPEED: 0x07,
    START_SPEED_PAIR: 0x08,
    START_SPEED_FOR_TIME: 0x09,
    START_SPEED_FOR_TIME_PAIR: 0x0A,
    START_SPEED_FOR_DEGREES: 0x0B,
    START_SPEED_FOR_DEGREES_PAIR: 0x0C,
    GO_TO_ABS_POSITION: 0x0D,
    GO_TO_ABS_POSITION_PAIR: 0x0E,
    PRESET_ENCODER: 0x14,
    WRITE_DIRECT_MODE_DATA: 0x51,
}

/**
 * Enum for Startup/Completion information for an output command.
 * Startup and completion bytes must be OR'ed to be combined to a single byte.
 * @readonly
 * @enum {number}
 */

const BoostOutputExecution = {
    // Startup information
    BUFFER_IF_NECESSARY: 0x00,
    EXECUTE_IMMEDIATELY: 0x10,
    // Completion information
    NO_ACTION: 0x00,
    COMMAND_FEEDBACK: 0x01,


}



/**
 * Enum for Boost Motor end states
 * @readonly
 * @enum {number}
 */

const BoostMotorEndState = {
    FLOAT: 0,
    HOLD: 126,
    BRAKE: 127 
}

/**
 * Enum for Boost Motor Acceleration/Deceleration profiles
 * @readyonly
 * @enum {number}
 */

const BoostMotorProfile = {
    DO_NOT_USE: 0x00,
    ACCELERATION: 0x01,
    DECELERATION: 0x02
}


/**
 * Enum for when Boost IO's are attached/detached
 * @readonly
 * @enum {number}
 */

const BoostIOEvent = {
    ATTACHED: 0x01,
    DETACHED: 0x00,
    ATTACHED_VIRTUAL: 0x02
}

/**
 * Enum for modes for input sensors on the Boost.
 * @enum {number}
 */
const BoostMode = {
    TILT: 0, // angle (pitch/yaw)
    LED: 1, // Set LED to accept RGB values
    COLOR: 0, // Read indexed colors from Vision Sensor
    MOTOR_SENSOR: 2, // Set motors to report their position
    MOTOR_OUTPUT: 0,
    UNKNOWN: 0 // Anything else will use the default mode (mode 0)
};

// Debug function
function buf2hex(buffer) { // buffer is an ArrayBuffer
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join(' ');
}

/**
 * Helper function for converting a number to a Int32Array
 * @param {number} number 
 */
function numberToInt32Array(number) {
    var buffer = new ArrayBuffer(4)        
    var dataview = new DataView(buffer)
    dataview.setInt32(0, number)
    return [dataview.getInt8(3),
            dataview.getInt8(2),
            dataview.getInt8(1),
            dataview.getInt8(0)];
}

/**
 * Helper function for converting a regular array to a Little Endian INT32-value
 * @param {Array} array 
 */
function int32ArrayToNumber(array) {
    var i = Uint8Array.from(array)
    var d = new DataView(i.buffer);
    return d.getInt32(0,true);
}

/**
 * Manage power, direction, position, and timers for one Boost motor.
 */
class BoostMotor {
    /**
     * Construct a Boost Motor instance.
     * @param {Boost} parent - the Boost peripheral which owns this motor.
     * @param {int} index - the zero-based index of this motor on its parent peripheral.
     */
    constructor (parent, index) {
        /**
         * The Boost peripheral which owns this motor.
         * @type {Boost}
         * @private
         */
        this._parent = parent;

        /**
         * The zero-based index of this motor on its parent peripheral.
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
         * This motor's current relative position
         * @type {number}
         * @private
         */
        this._position = 0;

        /**
         * This motor's current zero position, which the relative position can be calculated against.
         * @type {number}
         * @private
         */
        this._positionZero = 0;

        /**
         * Is this motor currently moving?
         * @type {boolean}
         * @private
         */
        this._status = BoostOutputCommandFeedback.IDLE;

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
         * If the motor has been turned on run for a specific duration, 
         * this is the function that will be called once Scratch VM gets a notification from the Move Hub.
         * @type {Object}
         * @private
         */
        this._pendingPromiseFunction = null;

        this.startBraking = this.startBraking.bind(this);
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

        // Lego Boost hub only turns motors at power range [20 - 100], so
        // map value from [0 - 100] to [20 - 100].
        if (p === 0) {
            this._power = 0;
        } else {
            const delta = 100 / p;
            this._power = 20 + (80 / delta);
        }
    }

    /**
     * @return {int} - 
     */
    get position () {
        return this._position;
    }

    /**
     * @param {int} value - 
     */
    set position (value) {
        this._position = value;
    }

    /**
     * @return {int} - 
     */
    get positionZero () {
        return this._positionZero;
    }

    /**
     * @param {int} value - 
     */
    set positionZero (value) {
        this._positionZero = value;
    }

    /**
     * @return {boolean} - true if this motor is currently moving, false if this motor is off or braking.
     */
    get isOn () {
        return this._status;
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
     * @return {boolean} - true if this motor is currently moving, false if this motor is off or braking.
     */
    get pendingPromiseFunction () {
        return this._pendingPromiseFunction;
    }


    /**
     * Turn this motor on indefinitely.
     */
    turnOn () {
        if (this._power === 0) return;
        const cmd = this._parent.generateOutputCommand(
            this._index,
            BoostOutputExecution.EXECUTE_IMMEDIATELY ^ BoostOutputExecution.COMMAND_FEEDBACK,
            BoostOutputSubCommand.START_SPEED,
            [this._power * this._direction,
            this._power * this._direction,
            BoostMotorProfile.DO_NOT_USE]);

        this._parent.send(BLECharacteristic, cmd);

        this._status = BoostOutputCommandFeedback.BUFFER_EMPTY_COMMAND_IN_PROGRESS;
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
        this._setNewTimeout(this.startBraking, milliseconds);
    }

    /**
     * Turn this motor on for a specific rotation in degrees.
     * @param {number} degrees - run the motor for this amount of degrees.
     */
    turnOnForDegrees (degrees) {
        if (this._power === 0) return;
        degrees = Math.max(0, degrees);

        const cmd = this._parent.generateOutputCommand(
            this._index,
            BoostOutputExecution.EXECUTE_IMMEDIATELY ^ BoostOutputExecution.COMMAND_FEEDBACK,
            BoostOutputSubCommand.START_SPEED_FOR_DEGREES,
            [...numberToInt32Array(degrees),
            this._power * this._direction, // power in range 0-100
            0xFF, // max speed
            BoostMotorEndState.FLOAT, 
            BoostMotorProfile.DO_NOT_USE] // byte for using acceleration/braking profile
        );

        this._status = BoostOutputCommandFeedback.BUFFER_EMPTY_COMMAND_IN_PROGRESS;

        this._parent.send(BLECharacteristic, cmd);        
    }    

    /**
     * Start active braking on this motor. After a short time, the motor will turn off.
     * // TODO: rename this to coastAfter?
     */
    startBraking () {
        if (this._power === 0) return;

        const cmd = this._parent.generateOutputCommand(
            this._index,
            BoostOutputExecution.EXECUTE_IMMEDIATELY ^ BoostOutputExecution.COMMAND_FEEDBACK,
            BoostOutputSubCommand.START_SPEED,
            [BoostMotorEndState.FLOAT,
            BoostMotorEndState.FLOAT,
            BoostMotorProfile.DO_NOT_USE]
        );

        this._parent.send(BLECharacteristic, cmd);

        this._status = BoostOutputCommandFeedback.IDLE;
        this._setNewTimeout(this.turnOff, BoostMotor.BRAKE_TIME_MS);
    }

    /**
     * Turn this motor off.
     * @param {boolean} [useLimiter=true] - if true, use the rate limiter
     */
    turnOff (useLimiter = true) {
        if (this._power === 0) return;

        const cmd = this._parent.generateOutputCommand(
            this._index,
            BoostOutputExecution.EXECUTE_IMMEDIATELY ^ BoostOutputExecution.COMMAND_FEEDBACK,
            BoostOutputSubCommand.START_SPEED,
            [BoostMotorEndState.FLOAT,
            BoostMotorEndState.FLOAT,
            BoostMotorProfile.DO_NOT_USE]
        );

        this._parent.send(BLECharacteristic, cmd, useLimiter);

        this._status = BoostOutputCommandFeedback.IDLE;
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

/**
 * Manage communication with a Boost peripheral over a Bluetooth Low Energy client socket.
 */
class Boost {

    constructor (runtime, extensionId) {

        /**
         * The Scratch 3.0 runtime used to trigger the green flag button.
         * @type {Runtime}
         * @private
         */
        this._runtime = runtime;
        this._runtime.on('PROJECT_STOP_ALL', this.stopAll.bind(this));

        /**
         * The id of the extension this peripheral belongs to.
         */
        this._extensionId = extensionId;

        /**
         * A list of the ids of the physical or virtual sensors.
         * @type {string[]}
         * @private
         */
        this._ports = [];

        /**
         * A list of motors registered by the Boost hardware.
         * @type {BoostMotor[]}
         * @private
         */
        this._motors = [];

        /**
         * The most recently received value for each sensor.
         * @type {Object.<string, number>}
         * @private
         */
        this._sensors = {
            tiltX: 0,
            tiltY: 0,
            distance: 0,
            color: 0,
        };

        /*
        ** TODO: Clean up
        */
       
        this._led = 50

        /**
         * The Bluetooth connection socket for reading/writing peripheral data.
         * @type {BLE}
         * @private
         */
        this._ble = null;
        this._runtime.registerPeripheralExtension(extensionId, this);

        /**
         * A rate limiter utility, to help limit the rate at which we send BLE messages
         * over the socket to Scratch Link to a maximum number of sends per second.
         * @type {RateLimiter}
         * @private
         */
        this._rateLimiter = new RateLimiter(BLESendRateMax);

        this.disconnect = this.disconnect.bind(this);
        this._onConnect = this._onConnect.bind(this);
        this._onMessage = this._onMessage.bind(this);
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
     * @return {number} - the latest color value received from the vision sensor.
     */
    get color () {
        return this._sensors.color;
    }

    /**
     * Access a particular motor on this peripheral.
     * @param {int} index - the index of the desired motor.
     * @return {BoostMotor} - the BoostMotor instance, if any, at that index.
     */
    motor (index) {
        return this._motors[index];
    }

    /**
     * Stop all the motors that are currently running.
     */
    stopAllMotors () {
        this._motors.forEach(motor => {
            if (motor) {
                // Send the motor off command without using the rate limiter.
                // This allows the stop button to stop motors even if we are
                // otherwise flooded with commands.
                motor.turnOff(false);
            }
        });
    }

    /**
     * Set the Boost peripheral's LED to a specific color.
     * @param {int} inputRGB - a 24-bit RGB color in 0xRRGGBB format.
     * @return {Promise} - a promise of the completion of the set led send operation.
     */
    setLED (inputRGB) {
        const rgb = [
            (inputRGB >> 16) & 0x000000FF,
            (inputRGB >> 8) & 0x000000FF,
            (inputRGB) & 0x000000FF
        ];

        const cmd = this.generateOutputCommand(
            this._ports.indexOf(BoostIO.LED),
            BoostOutputExecution.EXECUTE_IMMEDIATELY ^ BoostOutputExecution.COMMAND_FEEDBACK,
            BoostOutputSubCommand.WRITE_DIRECT_MODE_DATA,
            [BoostMode.LED,
            ...rgb]
        );

        return this.send(BLECharacteristic, cmd);
    }

    /**
     * Sets the input mode of the LED to RGB.
     * @return {Promise} - a promise returned by the send operation.
     */
    setLEDMode () {
        const cmd = this.generateInputCommand(
            this._ports.indexOf(BoostIO.LED),
            BoostMode.LED,
            0,
            false
        );

        return this.send(BLECharacteristic, cmd);
    }

    /**
     * Stop the motors on the Boost peripheral.
     */
    stopAll () {
        if (!this.isConnected()) return;
        this.stopAllMotors();
    }

    /**
     * Called by the runtime when user wants to scan for a Boost peripheral.
     */
    scan () {
        if (this._ble) {
            this._ble.disconnect();
        }
        this._ble = new BLE(this._runtime, this._extensionId, {
            filters: [{
                services: [BLEService],
                manufacturerData: {
                    0: {
                        dataPrefix: [0x97, 0x03, 0x00, 0x40],
                        mask: [0xFF, 0xFF, 0, 0xFF]
                    }
                }
            }],
            optionalServices: []
        }, this._onConnect, this.disconnect);
    }

    /**
     * Called by the runtime when user wants to connect to a certain Boost peripheral.
     * @param {number} id - the id of the peripheral to connect to.
     */
    connect (id) {
        if (this._ble) {
            this._ble.connectPeripheral(id);
        }
    }

    /**
     * Disconnects from the current BLE socket.
     */
    disconnect () {
        this._ports = [];
        this._motors = [];
        this._sensors = {
            tiltX: 0,
            tiltY: 0,
            distance: 0,
            color: 0
        };

        if (this._ble) {
            this._ble.disconnect();
        }
    }

    /**
     * Called by the runtime to detect whether the Boost peripheral is connected.
     * @return {boolean} - the connected state.
     */
    isConnected () {
        let connected = false;
        if (this._ble) {
            connected = this._ble.isConnected();
        }
        return connected;
    }

    /**
     * Write a message to the Boost peripheral BLE socket.
     * @param {number} uuid - the UUID of the characteristic to write to
     * @param {Array} message - the message to write.
     * @param {boolean} [useLimiter=true] - if true, use the rate limiter
     * @return {Promise} - a promise result of the write operation
     */
    send (uuid, message, useLimiter = true) {
        if (!this.isConnected()) return Promise.resolve();

        if (useLimiter) {
            if (!this._rateLimiter.okayToSend()) return Promise.resolve();
        }

        return this._ble.write(
            BLEService,
            uuid,
            Base64Util.uint8ArrayToBase64(message),
            'base64'
        );
    }

    /**
     * Generate a Boost 'Output Command' in the byte array format
     * (COMMON HEADER, PORT ID, EXECUTION BYTE, SUBCOMMAND ID, PAYLOAD).
     *
     * Payload is accepted as an array since these vary across different subcommands.
     *
     * @param  {number} portID - the port (Connect ID) to send a command to.
     * @param  {number} execution - Byte containing startup/completion information
     * @param  {number} subCommandID - the id of the subcommand byte.
     * @param  {array}  payload    - the list of bytes to send as subcommand payload
     * @return {array}            - a generated output command.
     */
    generateOutputCommand (portID, execution, subCommand, payload) {
        let hubID = 0x00
        let command = [hubID, BoostMessage.OUTPUT, portID, execution, subCommand, ...payload]
        command.unshift(command.length +1)
        return command;
    }

    /**
     * Generate a Boost 'Input Command' in the byte array format
     * (COMMAND ID, COMMAND TYPE, CONNECT ID, TYPE ID, MODE, DELTA INTERVAL (4 BYTES),
     * UNIT, NOTIFICATIONS ENABLED).
     *
     * This sends a command to the Boost that sets that input format
     * of the specified inputs and sets value change notifications.
     *
     * @param  {number}  portID           - the port (Connect ID) to send a command to.
     * @param  {number}  mode                - the mode of the input sensor.
     * @param  {number}  delta               - the delta change needed to trigger notification.
     * @param  {boolean} enableNotifications - whether to enable notifications.
     * @return {array}                       - a generated input command.
     */
    generateInputCommand (portID, mode, delta, enableNotifications) {
        var command = [
            0x00, // Hub ID
            BoostMessage.PORT_INPUT_FORMAT_SETUP_SINGLE,
            portID,
            mode,
        ].concat(numberToInt32Array(delta)).concat([
            enableNotifications
        ]);

        command.unshift(command.length+1) // Prepend payload with length byte

        return command;
    }

    /**
     * Sets LED mode and initial color and starts reading data from peripheral after BLE has connected.
     * @private
     */
    _onConnect () {
        this._ble.startNotifications(
            BLEService,
            BLECharacteristic,
            this._onMessage
        );
    }

    /**
     * Process the sensor data from the incoming BLE characteristic.
     * @param {object} base64 - the incoming BLE data.
     * @private
     */
    _onMessage (base64) {
        const data = Base64Util.base64ToUint8Array(base64);

        /**
         * First three bytes are the common header:
         * 0: Length of message
         * 1: Hub ID (always 0x00 at the moment)
         * 2: Message Type
         * 
         * We base our switch-case on Message Type
         */

        const messageType = data[2];
        const portID = data[3];

        switch (messageType) {
            
        /*
         * 4: Event
         * 5: IO Type ID
        */

            case BoostMessage.HUB_ATTACHED_IO: // IO Attach/Detach events

            const event = data[4]
            const typeId = data[5]
            
            switch (event) {
                    case BoostIOEvent.ATTACHED:
                        this._registerSensorOrMotor(portID, typeId)
                        break;
                    case BoostIOEvent.DETACHED:
                        this._clearPort(portID);
                        break;
                    case BoostIOEvent.ATTACHED_VIRTUAL:
                    default:
                        // Ignore
                        //console.log("No I/O Event case found!")
                }
                break;
            case BoostMessage.PORT_VALUE:
                var type = this._ports[portID];
                // TODO: Build a proper value-formatting based on the PORT_INPUT_FORMAT-messages instead of hardcoding value-handling
                switch(type) {
                    case BoostIO.TILT:
                        this._sensors.tiltX = data[4]
                        this._sensors.tiltY = data[5]
                        break;
                    case BoostIO.COLOR:
                        this._sensors.color = data[4];
                        break;
                    case BoostIO.MOTOREXT:
                    case BoostIO.MOTORINT:
                        // Taken from EV3 extension tacho motor calculation
                        /*let value = data[4] + (data[5] * 256) + (data[6] * 256 * 256) + (data[7] * 256 * 256 * 256);
                        if (value > 0x7fffffff) {
                            value = value - 0x100000000;
                        }*/
                        this._motors[portID]._position = int32ArrayToNumber(data.slice(4,8))
                        break;
                    case BoostIO.CURRENT:
                    case BoostIO.VOLTAGE:
                        break;
                    default:
                        console.log("Unknown sensor value! Type: " + type)
                }
                break;
            case BoostMessage.PORT_OUTPUT_COMMAND_FEEDBACK:
                //TODO: Handle messages that contain feedback from more than one port.
                var feedback = data[4];
                switch(feedback) {
                    case BoostOutputCommandFeedback.BUFFER_EMPTY_COMMAND_COMPLETED ^ BoostOutputCommandFeedback.IDLE:
                    case BoostOutputCommandFeedback.CURRENT_COMMAND_DISCARDED ^ BoostOutputCommandFeedback.IDLE: // Resolve even if command didn't complete successfully
                        if(this._motors[portID] && this._motors[portID].pendingPromiseFunction) {
                            this._motors[portID].pendingPromiseFunction();
                        }
                        break;
                    case BoostOutputCommandFeedback.BUFFER_EMPTY_COMMAND_IN_PROGRESS:
                        break;
                    default:
                        console.log(buf2hex(data))
                        console.log("Got it but didn't find a motor on: " + portID)
                }
                break;
            case BoostMessage.PORT_INPUT_FORMAT:
            case BoostMessage.ERROR:
                //DEBUG
                console.log(buf2hex(data))
                break;
            default:
                //DEBUG
                console.log(buf2hex(data))                
        }
    }

    /**
     * Register a new sensor or motor connected at a port.  Store the type of
     * sensor or motor internally, and then register for notifications on input
     * values if it is a sensor.
     * @param {number} portID - the port to register a sensor or motor on.
     * @param {number} type - the type ID of the sensor or motor
     * @private
     */
    _registerSensorOrMotor (portID, type) {
        // Record which port is connected to what type of device
        this._ports[portID] = type;

        // Record motor port
        if (type === BoostIO.MOTORINT || type === BoostIO.MOTOREXT) {
            this._motors[portID] = new BoostMotor(this, portID);
        } 

        // Set input format for tilt or distance sensor
        var typeString = ''
        switch(type) {
            case BoostIO.MOTORINT:
            case BoostIO.MOTOREXT:
                typeString = 'MOTOR_SENSOR'
                break;
            case BoostIO.COLOR:
                typeString = 'COLOR'
                break;
            case BoostIO.LED:
                typeString = 'LED'
                this.setLEDMode();
                this.setLED(0x00FF00);
                break;
            case BoostIO.TILT:
                typeString = 'TILT'
                break;
            default:
                typeString = 'UNKNOWN'
        }
        
        const cmd = this.generateInputCommand(
            portID,
            BoostMode[typeString],
            1,
            true
        );

        this.send(BLECharacteristic, cmd);
    }

    /**
     * Clear the sensor or motor present at port 1 or 2.
     * @param {number} portID - the port to clear.
     * @private
     */
    _clearPort (portID) {
        const type = this._ports[portID];
        if (type === BoostIO.TILT) {
            this._sensors.tiltX = this._sensors.tiltY = 0;
        }
        if (type === BoostIO.DISTANCE) {
            this._sensors.distance = 0;
        }
        this._ports[portID] = 'none';
        this._motors[portID] = null;
    }
}

/**
 * Enum for motor specification.
 * @readonly
 * @enum {string}
 */
const BoostMotorLabel = {
    DEFAULT: 'motor',
    A: 'motor A',
    B: 'motor B',
    C: 'motor C',
    D: 'motor D',
    ALL: 'all motors'
};

/**
 * Enum for motor direction specification.
 * @readonly
 * @enum {string}
 */
const BoostMotorDirection = {
    FORWARD: 'this way',
    BACKWARD: 'that way',
    REVERSE: 'reverse'
};

/**
 * Enum for tilt sensor direction.
 * @readonly
 * @enum {string}
 */
const BoostTiltDirection = {
    UP: 'up',
    DOWN: 'down',
    LEFT: 'left',
    RIGHT: 'right',
    ANY: 'any'
};

/**
 * Scratch 3.0 blocks to interact with a LEGO Boost peripheral.
 */
class Scratch3BoostBlocks {

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return 'boost';
    }

    /**
     * @return {number} - the tilt sensor counts as "tilted" if its tilt angle meets or exceeds this threshold.
     */
    static get TILT_THRESHOLD () {
        return 15;
    }

    /**
     * Construct a set of Boost blocks.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        // Create a new Boost peripheral instance
        this._peripheral = new Boost(this.runtime, Scratch3BoostBlocks.EXTENSION_ID);
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: Scratch3BoostBlocks.EXTENSION_ID,
            name: 'Boost',
            blockIconURI: iconURI,
            showStatusButton: true,
            blocks: [
                {
                    opcode: 'motorOnFor',
                    text: formatMessage({
                        id: 'boost.motorOnFor',
                        default: 'turn motor [MOTOR_ID] on for [DURATION] seconds',
                        description: 'turn a motor on for some time'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        MOTOR_ID: {
                            type: ArgumentType.STRING,
                            menu: 'MOTOR_ID',
                            defaultValue: BoostMotorLabel.A
                        },
                        DURATION: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'motorOnForRotation',
                    text: formatMessage({
                        id: 'boost.motorOnForRotation',
                        default: 'turn motor [MOTOR_ID] on for [ROTATION] rotations',
                        description: 'turn a motor on for rotation'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        MOTOR_ID: {
                            type: ArgumentType.STRING,
                            menu: 'MOTOR_ID',
                            defaultValue: BoostMotorLabel.A
                        },
                        ROTATION: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'motorOn',
                    text: formatMessage({
                        id: 'boost.motorOn',
                        default: 'turn motor [MOTOR_ID] on',
                        description: 'turn a motor on indefinitely'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        MOTOR_ID: {
                            type: ArgumentType.STRING,
                            menu: 'MOTOR_ID',
                            defaultValue: BoostMotorLabel.A
                        }
                    }
                },
                {
                    opcode: 'motorOff',
                    text: formatMessage({
                        id: 'boost.motorOff',
                        default: 'turn motor [MOTOR_ID] off',
                        description: 'turn a motor off'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        MOTOR_ID: {
                            type: ArgumentType.STRING,
                            menu: 'MOTOR_ID',
                            defaultValue: BoostMotorLabel.A
                        }
                    }
                },
                {
                    opcode: 'startMotorPower',
                    text: formatMessage({
                        id: 'boost.startMotorPower',
                        default: 'set motor [MOTOR_ID] power to [POWER] %',
                        description: 'set the motor\'s power and turn it on'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        MOTOR_ID: {
                            type: ArgumentType.STRING,
                            menu: 'MOTOR_ID',
                            defaultValue: BoostMotorLabel.A
                        },
                        POWER: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 100
                        }
                    }
                },
                {
                    opcode: 'setMotorDirection',
                    text: formatMessage({
                        id: 'boost.setMotorDirection',
                        default: 'set motor [MOTOR_ID] direction to [MOTOR_DIRECTION]',
                        description: 'set the motor\'s turn direction'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        MOTOR_ID: {
                            type: ArgumentType.STRING,
                            menu: 'MOTOR_ID',
                            defaultValue: BoostMotorLabel.A
                        },
                        MOTOR_DIRECTION: {
                            type: ArgumentType.STRING,
                            menu: 'MOTOR_DIRECTION',
                            defaultValue: BoostMotorDirection.FORWARD
                        }
                    }
                },
                {
                    opcode: 'motorZero',
                    text: formatMessage({
                        id: 'boost.motorZero',
                        default: 'reset motor position [MOTOR_ID]',
                        description: 'set a motor\'s position to 0'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        MOTOR_ID: {
                            type: ArgumentType.STRING,
                            menu: 'MOTOR_ID',
                            defaultValue: BoostMotorLabel.A
                        }
                    }
                },
                {
                    opcode: 'setLightHue',
                    text: formatMessage({
                        id: 'boost.setLightHue',
                        default: 'set light color to [HUE]',
                        description: 'set the LED color'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        HUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 50
                        }
                    }
                },
                {
                    opcode: 'changeLightHueBy',
                    text: formatMessage({
                        id: 'boost.changeLightHueBy',
                        default: 'change light color by [HUE]',
                        description: 'change the LED color by a given amount'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        HUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 5
                        }
                    }
                },                
                /*{
                    opcode: 'whenDistance',
                    text: formatMessage({
                        id: 'boost.whenDistance',
                        default: 'when distance [OP] [REFERENCE]',
                        description: 'check for when distance is < or > than reference'
                    }),
                    blockType: BlockType.HAT,
                    arguments: {
                        OP: {
                            type: ArgumentType.STRING,
                            menu: 'OP',
                            defaultValue: '<'
                        },
                        REFERENCE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 50
                        }
                    }
                },*/
                {
                    opcode: 'whenColor',
                    text: formatMessage({
                        id: 'boost.whenColor',
                        default: 'when color [COLOR]',
                        description: 'check for when color'
                    }),
                    blockType: BlockType.HAT,
                    arguments: {
                        COLOR: {
                            type: ArgumentType.NUMBER,
                            menu: 'COLOR',
                            defaultValue: BoostColor.RED
                        }
                    }
                },                
                {
                    opcode: 'whenTilted',
                    text: formatMessage({
                        id: 'boost.whenTilted',
                        default: 'when tilted [TILT_DIRECTION_ANY]',
                        description: 'check when tilted in a certain direction'
                    }),
                    func: 'isTilted',
                    blockType: BlockType.HAT,
                    arguments: {
                        TILT_DIRECTION_ANY: {
                            type: ArgumentType.STRING,
                            menu: 'TILT_DIRECTION_ANY',
                            defaultValue: BoostTiltDirection.ANY
                        }
                    }
                },
                /*{
                    opcode: 'getDistance',
                    text: formatMessage({
                        id: 'boost.getDistance',
                        default: 'distance',
                        description: 'the value returned by the distance sensor'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'isTilted',
                    text: formatMessage({
                        id: 'boost.isTilted',
                        default: 'tilted [TILT_DIRECTION_ANY]?',
                        description: 'whether the tilt sensor is tilted'
                    }),
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        TILT_DIRECTION_ANY: {
                            type: ArgumentType.STRING,
                            menu: 'TILT_DIRECTION_ANY',
                            defaultValue: BoostTiltDirection.ANY
                        }
                    }
                },*/
                {
                    opcode: 'getTiltAngle',
                    text: formatMessage({
                        id: 'boost.getTiltAngle',
                        default: 'tilt angle [TILT_DIRECTION]',
                        description: 'the angle returned by the tilt sensor'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        TILT_DIRECTION: {
                            type: ArgumentType.STRING,
                            menu: 'TILT_DIRECTION',
                            defaultValue: BoostTiltDirection.UP
                        }
                    }
                },
                {
                    opcode: 'getColor',
                    text: formatMessage({
                        id: 'boost.getColor',
                        default: 'color',
                        description: 'the color returned by the vision sensor'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'getMotorPosition',
                    text: formatMessage({
                        id: 'boost.getMotorPosition',
                        default: 'motor position [MOTOR_REPORTER_ID]',
                        description: 'the position returned by the motor'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        MOTOR_REPORTER_ID: {
                            type: ArgumentType.STRING,
                            menu: 'MOTOR_REPORTER_ID',
                            defaultValue: BoostMotorLabel.A
                        }
                    }
                }
            ],
            menus: {
                MOTOR_ID: [
                    {
                        text: formatMessage({
                            id: 'boost.motorId.a',
                            default: 'A',
                            description: 'label for motor A element in motor menu for LEGO Boost extension'
                        }),
                        value: BoostMotorLabel.A
                    },
                    {
                        text: formatMessage({
                            id: 'boost.motorId.b',
                            default: 'B',
                            description: 'label for motor B element in motor menu for LEGO Boost extension'
                        }),
                        value: BoostMotorLabel.B
                    },
                    {
                        text: formatMessage({
                            id: 'boost.motorId.c',
                            default: 'C',
                            description: 'label for motor C element in motor menu for LEGO Boost extension'
                        }),
                        value: BoostMotorLabel.C
                    },
                    {
                        text: formatMessage({
                            id: 'boost.motorId.d',
                            default: 'D',
                            description: 'label for motor D element in motor menu for LEGO Boost extension'
                        }),
                        value: BoostMotorLabel.D
                    },
                    {
                        text: formatMessage({
                            id: 'boost.motorId.all',
                            default: 'all motors',
                            description: 'label for all motors element in motor menu for LEGO Boost extension'
                        }),
                        value: BoostMotorLabel.ALL
                    }
                ],
                MOTOR_REPORTER_ID: [
                    {
                        text: formatMessage({
                            id: 'boost.motorReporterId.a',
                            default: 'A',
                            description: 'label for motor A element in motor menu for LEGO Boost extension'
                        }),
                        value: BoostMotorLabel.A
                    },
                    {
                        text: formatMessage({
                            id: 'boost.motorReporterId.b',
                            default: 'B',
                            description: 'label for motor B element in motor menu for LEGO Boost extension'
                        }),
                        value: BoostMotorLabel.B
                    },
                    {
                        text: formatMessage({
                            id: 'boost.motorReporterId.c',
                            default: 'C',
                            description: 'label for motor C element in motor menu for LEGO Boost extension'
                        }),
                        value: BoostMotorLabel.C
                    },
                    {
                        text: formatMessage({
                            id: 'boost.motorReporterId.d',
                            default: 'D',
                            description: 'label for motor D element in motor menu for LEGO Boost extension'
                        }),
                        value: BoostMotorLabel.D
                    }
                ],
                MOTOR_DIRECTION: [
                    {
                        text: formatMessage({
                            id: 'boost.motorDirection.forward',
                            default: 'this way',
                            description: 'label for forward element in motor direction menu for LEGO Boost extension'
                        }),
                        value: BoostMotorDirection.FORWARD
                    },
                    {
                        text: formatMessage({
                            id: 'boost.motorDirection.backward',
                            default: 'that way',
                            description: 'label for backward element in motor direction menu for LEGO Boost extension'
                        }),
                        value: BoostMotorDirection.BACKWARD
                    },
                    {
                        text: formatMessage({
                            id: 'boost.motorDirection.reverse',
                            default: 'reverse',
                            description: 'label for reverse element in motor direction menu for LEGO Boost extension'
                        }),
                        value: BoostMotorDirection.REVERSE
                    }
                ],
                TILT_DIRECTION: [
                    {
                        text: formatMessage({
                            id: 'boost.tiltDirection.up',
                            default: 'up',
                            description: 'label for up element in tilt direction menu for LEGO Boost extension'
                        }),
                        value: BoostTiltDirection.UP
                    },
                    {
                        text: formatMessage({
                            id: 'boost.tiltDirection.down',
                            default: 'down',
                            description: 'label for down element in tilt direction menu for LEGO Boost extension'
                        }),
                        value: BoostTiltDirection.DOWN
                    },
                    {
                        text: formatMessage({
                            id: 'boost.tiltDirection.left',
                            default: 'left',
                            description: 'label for left element in tilt direction menu for LEGO Boost extension'
                        }),
                        value: BoostTiltDirection.LEFT
                    },
                    {
                        text: formatMessage({
                            id: 'boost.tiltDirection.right',
                            default: 'right',
                            description: 'label for right element in tilt direction menu for LEGO Boost extension'
                        }),
                        value: BoostTiltDirection.RIGHT
                    }
                ],
                TILT_DIRECTION_ANY: [
                    {
                        text: formatMessage({
                            id: 'boost.tiltDirection.up',
                            default: 'up'
                        }),
                        value: BoostTiltDirection.UP
                    },
                    {
                        text: formatMessage({
                            id: 'boost.tiltDirection.down',
                            default: 'down'
                        }),
                        value: BoostTiltDirection.DOWN
                    },
                    {
                        text: formatMessage({
                            id: 'boost.tiltDirection.left',
                            default: 'left'
                        }),
                        value: BoostTiltDirection.LEFT
                    },
                    {
                        text: formatMessage({
                            id: 'boost.tiltDirection.right',
                            default: 'right'
                        }),
                        value: BoostTiltDirection.RIGHT
                    },
                    {
                        text: formatMessage({
                            id: 'boost.tiltDirection.any',
                            default: 'any',
                            description: 'label for any element in tilt direction menu for LEGO Boost extension'
                        }),
                        value: BoostTiltDirection.ANY
                    }
                ],
                COLOR: [
                    {
                        text: formatMessage({
                            id: 'boost.color.red',
                            default: 'red'
                        }),
                        value: BoostColor.RED
                    },
                    {
                        text: formatMessage({
                            id: 'boost.color.blue',
                            default: 'blue'
                        }),
                        value: BoostColor.BLUE
                    },
                    {
                        text: formatMessage({
                            id: 'boost.color.green',
                            default: 'green'
                        }),
                        value: BoostColor.GREEN
                    },
                    {
                        text: formatMessage({
                            id: 'boost.color.yellow',
                            default: 'yellow'
                        }),
                        value: BoostColor.YELLOW
                    },
                    {
                        text: formatMessage({
                            id: 'boost.color.white',
                            default: 'white'
                        }),
                        value: BoostColor.WHITE
                    },
                    {
                        text: formatMessage({
                            id: 'boost.color.black',
                            default: 'black',
                            description: 'black'
                        }),
                        value: BoostColor.BLACK
                    }
                ],
                OP: ['<', '>']
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
        // TODO: cast args.MOTOR_ID?
        let durationMS = Cast.toNumber(args.DURATION) * 1000;
        durationMS = MathUtil.clamp(durationMS, 0, 15000);
        return new Promise(resolve => {
            this._forEachMotor(args.MOTOR_ID, motorIndex => {
                const motor = this._peripheral.motor(motorIndex);
                if (motor) {
                    motor.turnOnFor(durationMS);
                }
            });

            // Run for some time even when no motor is connected
            setTimeout(resolve, durationMS);
        });
    }

    /**
     * Turn specified motor(s) on for a specified rotation in full rotations.
     * @param {object} args - the block's arguments.
     * @property {MotorID} MOTOR_ID - the motor(s) to activate.
     * @property {int} ROTATION - the amount of full rotations to turn the motors.
     * @return {Promise} - a promise which will resolve at the end of the duration.
     */
    motorOnForRotation (args) {
        // TODO: cast args.MOTOR_ID?
        let degrees = Cast.toNumber(args.ROTATION) * 360;
        degrees = MathUtil.clamp(degrees, 0, 36000);
        return new Promise(resolve => {
            this._forEachMotor(args.MOTOR_ID, motorIndex => {
                const motor = this._peripheral.motor(motorIndex);
                if (motor) {
                    motor.turnOnForDegrees(degrees);
                    motor._pendingPromiseFunction = resolve
                }
            });
        });
    }    

    /**
     * Turn specified motor(s) on indefinitely.
     * @param {object} args - the block's arguments.
     * @property {MotorID} MOTOR_ID - the motor(s) to activate.
     * @return {Promise} - a Promise that resolves after some delay.
     */
    motorOn (args) {
        // TODO: cast args.MOTOR_ID?
        this._forEachMotor(args.MOTOR_ID, motorIndex => {
            const motor = this._peripheral.motor(motorIndex);
            if (motor) {
                motor.turnOn();
            }
        });

        return new Promise(resolve => {
            window.setTimeout(() => {
                resolve();
            }, BLESendInterval);
        });
    }

    /**
     * Turn specified motor(s) off.
     * @param {object} args - the block's arguments.
     * @property {MotorID} MOTOR_ID - the motor(s) to deactivate.
     * @return {Promise} - a Promise that resolves after some delay.
     */
    motorOff (args) {
        // TODO: cast args.MOTOR_ID?
        this._forEachMotor(args.MOTOR_ID, motorIndex => {
            const motor = this._peripheral.motor(motorIndex);
            if (motor) {
                motor.turnOff();
            }
        });

        return new Promise(resolve => {
            window.setTimeout(() => {
                resolve();
            }, BLESendInterval);
        });
    }

    /**
     * Turn specified motor(s) off.
     * @param {object} args - the block's arguments.
     * @property {MotorID} MOTOR_ID - the motor(s) to be affected.
     * @property {int} POWER - the new power level for the motor(s).
     * @return {Promise} - a Promise that resolves after some delay.
     */
    startMotorPower (args) {
        // TODO: cast args.MOTOR_ID?
        this._forEachMotor(args.MOTOR_ID, motorIndex => {
            const motor = this._peripheral.motor(motorIndex);
            if (motor) {
                motor.power = MathUtil.clamp(Cast.toNumber(args.POWER), 0, 100);
                //motor.turnOn();
            }
        });

        return new Promise(resolve => {
            window.setTimeout(() => {
                resolve();
            }, BLESendInterval);
        });
    }

    /**
     * Set the direction of rotation for specified motor(s).
     * If the direction is 'reverse' the motor(s) will be reversed individually.
     * @param {object} args - the block's arguments.
     * @property {MotorID} MOTOR_ID - the motor(s) to be affected.
     * @property {MotorDirection} MOTOR_DIRECTION - the new direction for the motor(s).
     * @return {Promise} - a Promise that resolves after some delay.
     */
    setMotorDirection (args) {
        // TODO: cast args.MOTOR_ID?
        this._forEachMotor(args.MOTOR_ID, motorIndex => {
            const motor = this._peripheral.motor(motorIndex);
            if (motor) {
                switch (args.MOTOR_DIRECTION) {
                case BoostMotorDirection.FORWARD:
                    motor.direction = 1;
                    break;
                case BoostMotorDirection.BACKWARD:
                    motor.direction = -1;
                    break;
                case BoostMotorDirection.REVERSE:
                    motor.direction = -motor.direction;
                    break;
                default:
                    log.warn(`Unknown motor direction in setMotorDirection: ${args.DIRECTION}`);
                    break;
                }
                // keep the motor on if it's running, and update the pending timeout if needed
                if (motor.isOn) {
                    if (motor.pendingTimeoutDelay) {
                        motor.turnOnFor(motor.pendingTimeoutStartTime + motor.pendingTimeoutDelay - Date.now());
                    } else {
                        motor.turnOn();
                    }
                }
            }
        });

        return new Promise(resolve => {
            window.setTimeout(() => {
                resolve();
            }, BLESendInterval);
        });
    }

    /**
     * Set the motor(s) position to 0.
     * @param {object} args - the block's arguments.
     * @property {MotorID} MOTOR_ID - the motor(s) to activate.
     * @return {Promise} - a Promise that resolves after some delay.
     */
    motorZero (args) {
        // TODO: cast args.MOTOR_ID?
        this._forEachMotor(args.MOTOR_ID, motorIndex => {
            const motor = this._peripheral.motor(motorIndex);
            if (motor) {
                // TODO: Do this on the hardware, i.e. https://lego.github.io/lego-ble-wireless-protocol-docs/index.html#encoding-of-writedirectmodedata-0x81-0x51
                motor.positionZero = motor.position;
            }
        });

        return new Promise(resolve => {
            window.setTimeout(() => {
                resolve();
            }, BLESendInterval);
        });
    }    

    /**
     * Set the LED's hue.
     * @param {object} args - the block's arguments.
     * @property {number} HUE - the hue to set, in the range [0,100].
     * @return {Promise} - a Promise that resolves after some delay.
     */
    setLightHue (args) {
        // Convert from [0,100] to [0,360]
        let inputHue = Cast.toNumber(args.HUE);
        inputHue = MathUtil.wrapClamp(inputHue, 0, 100);
        const hue = inputHue * 360 / 100;

        const rgbObject = color.hsvToRgb({h: hue, s: 1, v: 1});

        const rgbDecimal = color.rgbToDecimal(rgbObject);

        this._peripheral._led = inputHue;
        this._peripheral.setLED(rgbDecimal);

        return new Promise(resolve => {
            window.setTimeout(() => {
                resolve();
            }, BLESendInterval);
        });
    }

    /**
     * Change the LED's hue by a give number.
     * @param {object} args - the block's arguments.
     * @property {number} HUE - the hue to set, in the range [0,100].
     * @return {Promise} - a Promise that resolves after some delay.
     */
    changeLightHueBy (args) {
        // TODO: Clean up this block and its opcode
        let n = {};
        n.HUE = Cast.toNumber(args.HUE) + this._peripheral._led;
        this.setLightHue(n);
    }

    /**
     * Compare the distance sensor's value to a reference.
     * @param {object} args - the block's arguments.
     * @property {string} OP - the comparison operation: '<' or '>'.
     * @property {number} REFERENCE - the value to compare against.
     * @return {boolean} - the result of the comparison, or false on error.
     
    whenDistance (args) {
        switch (args.OP) {
        case '<':
            return this._peripheral.distance < Cast.toNumber(args.REFERENCE);
        case '>':
            return this._peripheral.distance > Cast.toNumber(args.REFERENCE);
        default:
            log.warn(`Unknown comparison operator in whenDistance: ${args.OP}`);
            return false;
        }
    }
    */

    /**
     * Test whether the tilt sensor is currently tilted.
     * @param {object} args - the block's arguments.
     * @property {TiltDirection} TILT_DIRECTION_ANY - the tilt direction to test (up, down, left, right, or any).
     * @return {boolean} - true if the tilt sensor is tilted past a threshold in the specified direction.
     */
    whenTilted (args) {
        return this._isTilted(args.TILT_DIRECTION_ANY);
    }

    /**
     * Test whether the tilt sensor is currently tilted.
     * @param {object} args - the block's arguments.
     * @property {Color} COLOR - the color to test.
     * @return {boolean} - true if the tilt sensor is tilted past a threshold in the specified direction.
     */
    whenColor (args) {
        return this._isColor(args.COLOR);
    }    

    /**
     * @return {number} - the distance sensor's value, scaled to the [0,100] range.
     
    getDistance () {
        return this._peripheral.distance;
    }*/

    /**
     * @return {number} - the vision sensor's color value. Indexed LEGO brick colors.
     */
    getColor () {
        return this._peripheral.color;
    }    

    /**
     * @return {number} 
     */
    getMotorPosition (args) {
        switch(args.MOTOR_REPORTER_ID) {
            case BoostMotorLabel.A:
                return this._peripheral._motors[BoostPort.A].position - this._peripheral._motors[BoostPort.A].positionZero
            case BoostMotorLabel.B:
                return this._peripheral._motors[BoostPort.B].position - this._peripheral._motors[BoostPort.B].positionZero
            case BoostMotorLabel.C:
                return this._peripheral._motors[BoostPort.C].position - this._peripheral._motors[BoostPort.C].positionZero
            case BoostMotorLabel.D:
                return this._peripheral._motors[BoostPort.D].position - this._peripheral._motors[BoostPort.D].positionZero
            default:
                log.warn("Asked for a motor position that doesnt exist!")
                return false;
        }
    }        

    /**
     * Test whether the tilt sensor is currently tilted.
     * @param {object} args - the block's arguments.
     * @property {TiltDirection} TILT_DIRECTION_ANY - the tilt direction to test (up, down, left, right, or any).
     * @return {boolean} - true if the tilt sensor is tilted past a threshold in the specified direction.
     */
    isTilted (args) {
        return this._isTilted(args.TILT_DIRECTION_ANY);
    }

    /**
     * @param {object} args - the block's arguments.
     * @property {TiltDirection} TILT_DIRECTION - the direction (up, down, left, right) to check.
     * @return {number} - the tilt sensor's angle in the specified direction.
     * Note that getTiltAngle(up) = -getTiltAngle(down) and getTiltAngle(left) = -getTiltAngle(right).
     */
    getTiltAngle (args) {
        return this._getTiltAngle(args.TILT_DIRECTION);
    }

    /**
     * Test whether the tilt sensor is currently tilted.
     * @param {TiltDirection} direction - the tilt direction to test (up, down, left, right, or any).
     * @return {boolean} - true if the tilt sensor is tilted past a threshold in the specified direction.
     * @private
     */
    _isTilted (direction) {
        switch (direction) {
        case BoostTiltDirection.ANY:
            return (Math.abs(this._peripheral.tiltX) >= Scratch3BoostBlocks.TILT_THRESHOLD) ||
                (Math.abs(this._peripheral.tiltY) >= Scratch3BoostBlocks.TILT_THRESHOLD);
        default:
            return this._getTiltAngle(direction) >= Scratch3BoostBlocks.TILT_THRESHOLD;
        }
    }

    /**
     * Test whether the vision sensor is detecting a certain color.
     * @param {Color} color - the color to test.
     * @return {boolean} - true when the color sensor senses the specified color.
     * @private
     */
    _isColor (color) {
        return this.getColor() == color;
    }

    /**
     * @param {TiltDirection} direction - the direction (up, down, left, right) to check.
     * @return {number} - the tilt sensor's angle in the specified direction.
     * Note that getTiltAngle(up) = -getTiltAngle(down) and getTiltAngle(left) = -getTiltAngle(right).
     * @private
     */
    _getTiltAngle (direction) {
        switch (direction) {
        case BoostTiltDirection.UP:
            return this._peripheral.tiltY > 90 ? 256 - this._peripheral.tiltY : -this._peripheral.tiltY;
        case BoostTiltDirection.DOWN:
            return this._peripheral.tiltY > 90 ? this._peripheral.tiltY - 256 : this._peripheral.tiltY;
        case BoostTiltDirection.LEFT:
            return this._peripheral.tiltX > 90 ? 256 - this._peripheral.tiltX : -this._peripheral.tiltX;
        case BoostTiltDirection.RIGHT:
            return this._peripheral.tiltX > 90 ? this._peripheral.tiltX - 256 : this._peripheral.tiltX;
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
        case BoostMotorLabel.A:
            motors = [BoostPort.A];
            break;
        case BoostMotorLabel.B:
            motors = [BoostPort.B];
            break;
        case BoostMotorLabel.C:
            motors = [BoostPort.C];
            break;
        case BoostMotorLabel.D:
            motors = [BoostPort.D];
            break;
        case BoostMotorLabel.ALL:
        case BoostMotorLabel.DEFAULT:
            motors = [BoostPort.A, BoostPort.B, BoostPort.C, BoostPort.D];
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
}

module.exports = Scratch3BoostBlocks;
