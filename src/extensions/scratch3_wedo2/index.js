const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const color = require('../../util/color');
const log = require('../../util/log');
const BLESession = require('../../io/bleSession');
const Base64Util = require('../../util/base64-util');

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const iconURI = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+d2VkbzItYmxvY2staWNvbjwvdGl0bGU+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMzUuMzEzIDEwLjQ2N0gzMi4wOVY4Ljg2NWMwLS4yMjMuMTgtLjQwNC40MDUtLjQwNGgyLjQxMmMuMjI0IDAgLjQwNi4xODIuNDA2LjQwNXYxLjYwMnpNMzAuNDc3IDEwLjQ2N2gtMy4yMjRWOC44NjVjMC0uMjIzLjE4My0uNDA0LjQwNy0uNDA0aDIuNDFjLjIyNiAwIC40MDcuMTgyLjQwNy40MDV2MS42MDJ6TTI1LjY0IDEwLjQ2N0gyMi40MlY4Ljg2NWMwLS4yMjMuMTgyLS40MDQuNDA2LS40MDRoMi40MWMuMjI2IDAgLjQwNy4xODIuNDA3LjQwNXYxLjYwMnpNMjAuODA2IDEwLjQ2N2gtMy4yMjRWOC44NjVjMC0uMjIzLjE4Mi0uNDA0LjQwNi0uNDA0SDIwLjRjLjIyNCAwIC40MDYuMTgyLjQwNi40MDV2MS42MDJ6TTE1Ljk3IDEwLjQ2N2gtMy4yMjRWOC44NjVjMC0uMjIzLjE4Mi0uNDA0LjQwNy0uNDA0aDIuNDFjLjIyNiAwIC40MDcuMTgyLjQwNy40MDV2MS42MDJ6TTExLjEzNSAxMC40NjdINy45MVY4Ljg2NWMwLS4yMjMuMTgzLS40MDQuNDA3LS40MDRoMi40MTJjLjIyMyAwIC40MDUuMTgyLjQwNS40MDV2MS42MDJ6IiBzdHJva2U9IiM2Rjc4OTMiIGZpbGw9IiNGRkYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0zNy43MyAxMC40NjdINi4zYy0yLjY3IDAtNC44MzYgMi4xNTMtNC44MzYgNC44MDh2My4yMDVoMzcuMDczdi03LjIxYzAtLjQ0NC0uMzYyLS44MDMtLjgwNy0uODAzeiIgc3Ryb2tlPSIjNkY3ODkzIiBmaWxsPSIjRkZGIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNMzguMTM0IDMwLjk4SDEuODY3Yy0uMjI0IDAtLjQwMy0uMTgtLjQwMy0uNFYxNi4yMzZoMzIuNzFjLjczIDAgMS40My4yODcgMS45NDUuOC41MTUuNTE0IDEuMjE1LjgwMiAxLjk0NC44MDJoLjQ3M3YxMi43NGMwIC4yMi0uMTguNC0uNDAzLjR6IiBzdHJva2U9IiM2Rjc4OTMiIGZpbGw9IiNFNkU3RTgiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIHN0cm9rZT0iIzZGNzg5MyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMzQuODMgMTYuMjM3bC40ODMtMi41NjVoMy4yMjMiLz48cGF0aCBkPSJNMzguNTM2IDExLjI2OFYzMC41OGMwIC4yMi0uMTguNC0uNDAzLjRIMS44NjZjLS4yMiAwLS40MDMtLjE4LS40MDMtLjR2LTEuMjAzaDM0LjI4MmMuNjUgMCAxLjE4LS41MjQgMS4xOC0xLjE3M1YxMC40NjdoLjgwNWMuNDQ2IDAgLjgwNi4zNi44MDYuOHoiIHN0cm9rZT0iIzZGNzg5MyIgZmlsbD0iIzZGNzg5MyIgb3BhY2l0eT0iLjE1IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNMTEuNTM4IDE2LjI4aDIwLjE0OGMuMjIyIDAgLjQwMy4xOC40MDMuNHY2LjUyN2MwIC4yMjItLjE4Mi40LS40MDQuNEgxMS41MzhjLS4yMjMgMC0uNDA0LS4xNzgtLjQwNC0uNFYxNi42OGMwLS4yMi4xOC0uNC40MDQtLjQiIGZpbGw9IiNFNkU3RTgiLz48cGF0aCBkPSJNMTEuNTM4IDE2LjI4aDIwLjE0OGMuMjIyIDAgLjQwMy4xOC40MDMuNHY2LjUyN2MwIC4yMjItLjE4Mi40LS40MDQuNEgxMS41MzhjLS4yMjMgMC0uNDA0LS4xNzgtLjQwNC0uNFYxNi42OGMwLS4yMi4xOC0uNC40MDQtLjR6IiBzdHJva2U9IiM2Rjc4OTMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0zMi4wOSAxNi4yOHY2LjkyN2MwIC4yMjItLjE4LjQtLjQwNC40aC0yMC4xNWMtLjIyIDAtLjQtLjE4LS40LS40di0xLjJoMTguMTZjLjY1MyAwIDEuMTgtLjUyNiAxLjE4LTEuMTc0VjE2LjI4aDEuNjEzeiIgc3Ryb2tlPSIjNkY3ODkzIiBmaWxsPSIjNkU3NzkyIiBvcGFjaXR5PSIuMTUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0zMC40NzcgMTYuMjhoLTMuMjI0di0xLjYwNGMwLS4yMjMuMTgzLS40MDQuNDA3LS40MDRoMi40MWMuMjI2IDAgLjQwNy4xOC40MDcuNDA0djEuNjAzek0xNS45NyAxNi4yOGgtMy4yMjR2LTEuNjA0YzAtLjIyMy4xODItLjQwNC40MDctLjQwNGgyLjQxYy4yMjYgMCAuNDA3LjE4LjQwNy40MDR2MS42MDN6TTI1LjY0IDE2LjI4SDIyLjQydi0xLjYwNGMwLS4yMjMuMTgyLS40MDQuNDA2LS40MDRoMi40MWMuMjI2IDAgLjQwNy4xOC40MDcuNDA0djEuNjAzek0yMC44MDYgMTYuMjhoLTMuMjI0di0xLjYwNGMwLS4yMjMuMTgyLS40MDQuNDA2LS40MDRIMjAuNGMuMjI0IDAgLjQwNi4xOC40MDYuNDA0djEuNjAzeiIgc3Ryb2tlPSIjNkY3ODkzIiBmaWxsPSIjRTZFN0U4IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNMTguNTU3IDE5LjkxYzAgMS4wMjUtLjgzNyAxLjg1Ny0xLjg3IDEuODU3LTEuMDMgMC0xLjg2Ny0uODMyLTEuODY3LTEuODU4IDAtMS4wMjcuODM3LTEuODU4IDEuODY4LTEuODU4IDEuMDMyIDAgMS44Ny44MyAxLjg3IDEuODU3ek0yMy40OCAxOS45MWMwIDEuMDI1LS44MzYgMS44NTctMS44NjggMS44NTdzLTEuODctLjgzMi0xLjg3LTEuODU4YzAtMS4wMjcuODM4LTEuODU4IDEuODctMS44NThzMS44NjguODMgMS44NjggMS44NTd6TTI4LjQwNCAxOS45MWMwIDEuMDI1LS44MzcgMS44NTctMS44NjggMS44NTctMS4wMzIgMC0xLjg3LS44MzItMS44Ny0xLjg1OCAwLTEuMDI3LjgzOC0xLjg1OCAxLjg3LTEuODU4IDEuMDMgMCAxLjg2OC44MyAxLjg2OCAxLjg1N3oiIHN0cm9rZT0iIzZGNzg5MyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTE4LjU1NyAxOS45MjJjMCAxLjAyNi0uODM3IDEuODU4LTEuODcgMS44NTgtMS4wMyAwLTEuODY3LS44MzItMS44NjctMS44NTggMC0xLjAyNS44MzctMS44NTcgMS44NjgtMS44NTcgMS4wMzIgMCAxLjg3LjgzMiAxLjg3IDEuODU3TTIzLjQ4IDE5LjkyMmMwIDEuMDI2LS44MzYgMS44NTgtMS44NjggMS44NThzLTEuODctLjgzMi0xLjg3LTEuODU4YzAtMS4wMjUuODM4LTEuODU3IDEuODctMS44NTdzMS44NjguODMyIDEuODY4IDEuODU3TTI4LjQwNCAxOS45MjJjMCAxLjAyNi0uODM3IDEuODU4LTEuODY4IDEuODU4LTEuMDMyIDAtMS44Ny0uODMyLTEuODctMS44NTggMC0xLjAyNS44MzgtMS44NTcgMS44Ny0xLjg1NyAxLjAzIDAgMS44NjguODMyIDEuODY4IDEuODU3IiBmaWxsPSIjNkY3ODkzIiBvcGFjaXR5PSIuNSIvPjwvZz48L3N2Zz4=';

const UUID = {
    DEVICE_SERVICE: '00001523-1212-efde-1523-785feabcd123',
    IO_SERVICE: '00004f0e-1212-efde-1523-785feabcd123',
    ATTACHED_IO: '00001527-1212-efde-1523-785feabcd123',
    INPUT_VALUES: '00001560-1212-efde-1523-785feabcd123',
    INPUT_COMMAND: '00001563-1212-efde-1523-785feabcd123',
    OUTPUT_COMMAND: '00001565-1212-efde-1523-785feabcd123'
};

/**
 * Enum for WeDo2 sensor and output types.
 * @readonly
 * @enum {number}
 */
const WeDo2Types = {
    MOTOR: 1,
    PIEZO: 22,
    LED: 23,
    TILT: 34,
    DISTANCE: 35
};

/**
 * Enum for connection/port ids assigned to internal WeDo2 output devices.
 * @readonly
 * @enum {number}
 */
const WeDo2ConnectIDs = {
    LED: 6,
    PIEZO: 5
};

/**
 * Enum for ids for various output commands on the WeDo2.
 * @readonly
 * @enum {number}
 */
const WeDo2Commands = {
    MOTOR_POWER: 1,
    PLAY_TONE: 2,
    STOP_TONE: 3,
    WRITE_RGB: 4,
    SET_VOLUME: 255
};

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
        const cmd = new Uint8Array(4);
        cmd[0] = this._index + 1; // connect id
        cmd[1] = WeDo2Commands.MOTOR_POWER; // command
        cmd[2] = 1; // 1 byte to follow
        cmd[3] = this._power * this._direction; // power in range 0-100

        this._parent._send(UUID.OUTPUT_COMMAND, Base64Util.uint8ArrayToBase64(cmd));

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
        const cmd = new Uint8Array(4);
        cmd[0] = this._index + 1; // connect id
        cmd[1] = WeDo2Commands.MOTOR_POWER; // command
        cmd[2] = 1; // 1 byte to follow
        cmd[3] = 127; // power in range 0-100

        this._parent._send(UUID.OUTPUT_COMMAND, Base64Util.uint8ArrayToBase64(cmd));

        this._isOn = false;
        this._setNewTimeout(this.setMotorOff, WeDo2Motor.BRAKE_TIME_MS);
    }

    /**
     * Turn this motor off.
     */
    setMotorOff () {
        const cmd = new Uint8Array(4);
        cmd[0] = this._index + 1; // connect id
        cmd[1] = WeDo2Commands.MOTOR_POWER; // command
        cmd[2] = 1; // 1 byte to follow
        cmd[3] = 0; // power in range 0-100

        this._parent._send(UUID.OUTPUT_COMMAND, Base64Util.uint8ArrayToBase64(cmd));

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
 * Manage communication with a WeDo 2.0 device over a Bluetooth Low Energy client socket.
 */
class WeDo2 {

    constructor (runtime, extensionId) {

        /**
         * The Scratch 3.0 runtime used to trigger the green flag button.
         * @type {Runtime}
         * @private
         */
        this._runtime = runtime;
        this._runtime.on('PROJECT_STOP_ALL', this._stopAll.bind(this));

        /**
         * The device ports that connect to motors and sensors.
         * @type {string[]}
         * @private
         */
        this._ports = ['none', 'none']; // TODO: rename?

        /**
         * The motors which this WeDo 2.0 could possibly have.
         * @type {WeDo2Motor[]}
         * @private
         */
        this._motors = [null, null];

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

        /**
         * The Bluetooth connection session for reading/writing device data.
         * @type {BLESession}
         * @private
         */
        this._ble = null;
        this._runtime.registerExtensionDevice(extensionId, this);

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
     * Access a particular motor on this device.
     * @param {int} index - the zero-based index of the desired motor.
     * @return {WeDo2Motor} - the WeDo2Motor instance, if any, at that index.
     */
    motor (index) {
        return this._motors[index];
    }

    /**
     * Stop all the motors that are currently running.
     */
    stopAllMotors () {
        this._motors.forEach(motor => {
            if (motor && motor.isOn) {
                motor.setMotorOff();
            }
        });
    }

    /**
     * Set the WeDo 2.0 hub's LED to a specific color.
     * @param {int} rgb - a 24-bit RGB color in 0xRRGGBB format.
     */
    setLED (rgb) {
        const cmd = new Uint8Array(6);
        cmd[0] = WeDo2ConnectIDs.LED; // connect id
        cmd[1] = WeDo2Commands.WRITE_RGB; // command
        cmd[2] = 3; // 3 bytes to follow
        cmd[3] = (rgb >> 16) & 0x000000FF;
        cmd[4] = (rgb >> 8) & 0x000000FF;
        cmd[5] = (rgb) & 0x000000FF;

        this._send(UUID.OUTPUT_COMMAND, Base64Util.uint8ArrayToBase64(cmd));
    }

    /**
     * Switch off the LED on the WeDo2.
     */
    stopLED () {
        const cmd = new Uint8Array(6);
        cmd[0] = WeDo2ConnectIDs.LED; // connect id
        cmd[1] = WeDo2Commands.WRITE_RGB; // command
        cmd[2] = 3; // 3 bytes to follow
        cmd[3] = 0x000000; // off
        cmd[4] = 0x000000;
        cmd[5] = 0x000000;

        this._send(UUID.OUTPUT_COMMAND, Base64Util.uint8ArrayToBase64(cmd));
    }

    /**
     * Play a tone from the WeDo 2.0 hub for a specific amount of time.
     * @param {int} tone - the pitch of the tone, in Hz.
     * @param {int} milliseconds - the duration of the note, in milliseconds.
     */
    playTone (tone, milliseconds) {
        const cmd = new Uint8Array(7);
        cmd[0] = WeDo2ConnectIDs.PIEZO; // connect id
        cmd[1] = WeDo2Commands.PLAY_TONE; // command
        cmd[2] = 4; // 4 bytes to follow
        cmd[3] = tone;
        cmd[4] = tone >> 8;
        cmd[5] = milliseconds;
        cmd[6] = milliseconds >> 8;

        this._send(UUID.OUTPUT_COMMAND, Base64Util.uint8ArrayToBase64(cmd));
    }

    /**
     * Stop the tone playing from the WeDo 2.0 hub, if any.
     */
    stopTone () {
        const cmd = new Uint8Array(2);
        cmd[0] = WeDo2ConnectIDs.PIEZO; // connect id
        cmd[1] = WeDo2Commands.STOP_TONE; // command

        this._send(UUID.OUTPUT_COMMAND, Base64Util.uint8ArrayToBase64(cmd));
    }

    /**
     * Called by the runtime when user wants to scan for a device.
     */
    // TODO: rename scan?
    startDeviceScan () {
        this._ble = new BLESession(this._runtime, {
            filters: [{services: [UUID.DEVICE_SERVICE]}],
            optionalServices: [UUID.IO_SERVICE]
        }, this._onConnect);
    }

    /**
     * Called by the runtime when user wants to connect to a certain device.
     * @param {number} id - the id of the device to connect to.
     */
    // TODO: rename connect?
    connectDevice (id) {
        this._ble.connectDevice(id);
    }

    /**
     * Disconnects from the current BLE session.
     */
    // TODO: rename disconnect?
    disconnectSession () {
        // window.clearInterval(this._timeoutID);
        this._ble.disconnectSession();
    }

    /**
     * Called by the runtime to detect whether the device is connected.
     * @return {boolean} - the connected state.
     */
    // TODO: rename isConnected
    getPeripheralIsConnected () {
        let connected = false;
        if (this._ble) {
            connected = this._ble.getPeripheralIsConnected();
        }
        return connected;
    }

    /**
     * Sets LED mode and starts reading data from device after BLE has connected.
     * @private
     */
    _onConnect () {
        // set LED input mode to RGB
        this._setLEDMode()
            .then(() => {
                // register for attached io notifications
                this._ble.read(UUID.DEVICE_SERVICE, UUID.ATTACHED_IO, true, this._onMessage);
            });

        // this._setVolume();
    }

    /**
     * Process the sensor data from the incoming BLE characteristic.
     * @param {object} base64 - the incoming BLE data.
     * @private
     */
    _onMessage (base64) {
        const data = Base64Util.base64ToUint8Array(base64);
        // log.info(data);

        if (data.length === 2) { // disconnect sensor
            const connectID = data[0];
            // zero out tilt
            if (this._ports[connectID - 1] === WeDo2Types.TILT) {
                this._sensors.tiltX = this._sensors.tiltY = 0;
            }
            // zero out distance
            if (this._ports[connectID - 1] === WeDo2Types.DISTANCE) {
                this._sensors.distance = 0;
            }
            // remove references to ports and motors
            if (connectID === 1 || connectID === 2) {
                this._ports[connectID - 1] = 'none';
                this._motors[connectID - 1] = null;
                // log.info(`this._ports = ${this._ports}`);
                // log.info(`this._motors = ${this._mtors}`);
            }
        }

        if (data.length === 3) { // distance sensor value?
            this._sensors.distance = data[2];
        }

        if (data.length === 4) { // tilt sensor value?
            this._sensors.tiltX = data[2];
            this._sensors.tiltY = data[3];
        }

        if (data.length === 12) { // attached io?

            const connectID = data[0];
            const type = data[3];

            // Record which port is connected to what type of device
            if (connectID === 1 || connectID === 2) {
                this._ports[connectID - 1] = type;
            }

            // Motor
            if (type === WeDo2Types.MOTOR) {
                this._motors[connectID - 1] = new WeDo2Motor(this, connectID - 1);
            }

            // Tilt Sensor
            if (type === WeDo2Types.TILT) {
                const cmd = new Uint8Array(11);
                cmd[0] = 1; // sensor format
                cmd[1] = 2; // command type: write
                cmd[2] = connectID; // connect id
                cmd[3] = WeDo2Types.TILT; // type
                cmd[4] = 0; // mode: angle
                cmd[5] = 1; // delta interval, 4 bytes
                cmd[6] = 0;
                cmd[7] = 0;
                cmd[8] = 0;
                cmd[9] = 0; // unit: raw
                cmd[10] = 1; // notifications enabled: true

                this._send(UUID.INPUT_COMMAND, Base64Util.uint8ArrayToBase64(cmd))
                    .then(() => {
                        this._ble.read(UUID.IO_SERVICE, UUID.INPUT_VALUES, true, this._onMessage.bind(this));
                    });
            }

            // Distance Sensor
            if (type === WeDo2Types.DISTANCE) {
                const cmd = new Uint8Array(11);
                cmd[0] = 1; // sensor format
                cmd[1] = 2; // command type: write
                cmd[2] = connectID; // connect id
                cmd[3] = WeDo2Types.DISTANCE; // type
                cmd[4] = 0; // mode: detect
                cmd[5] = 1; // delta interval, 4 bytes
                cmd[6] = 0;
                cmd[7] = 0;
                cmd[8] = 0;
                cmd[9] = 1; // unit: percent
                cmd[10] = 1; // notifications enabled: true

                this._send(UUID.INPUT_COMMAND, Base64Util.uint8ArrayToBase64(cmd))
                    .then(() => {
                        this._ble.read(UUID.IO_SERVICE, UUID.INPUT_VALUES, true, this._onMessage.bind(this));
                    });
            }
        }
    }

    /**
     * Write a message to the device BLE session.
     * @param {number} uuid - the UUID of the characteristic to write to
     * @param {Uint8Array} message - the message to write.
     * @return {Promise} - a promise result of the write operation
     * @private
     */
    _send (uuid, message) {
        if (!this.getPeripheralIsConnected()) return;
        return this._ble.write(UUID.IO_SERVICE, uuid, message, 'base64');
    }

    /**
     * Sets the volume for the piezo.
     * @private
     */
    _setVolume () {
        const cmd = new Uint8Array(4);
        cmd[0] = WeDo2ConnectIDs.PIEZO; // connect id
        cmd[1] = WeDo2Commands.SET_VOLUME; // command
        cmd[2] = 1; // 1 byte to follow
        cmd[3] = 100; // volume in range 0-100

        this._send(UUID.OUTPUT_COMMAND, Base64Util.uint8ArrayToBase64(cmd));
    }

    /**
     * Sets the input mode of the LED to RGB.
     * @return {Promise} - a promise returned by the send operation.
     * @private
     */
    _setLEDMode () {
        const cmd = new Uint8Array(11);
        cmd[0] = 1; // sensor format
        cmd[1] = 2; // command type: 2 = write
        cmd[2] = WeDo2ConnectIDs.LED; // port
        cmd[3] = WeDo2Types.LED; // type
        cmd[4] = 1; // mode
        cmd[5] = 0; // delta interval, 4 bytes
        cmd[6] = 0;
        cmd[7] = 0;
        cmd[8] = 0;
        cmd[9] = 0; // unit = raw
        cmd[10] = 0; // notifications enabled: false

        return this._send(UUID.INPUT_COMMAND, Base64Util.uint8ArrayToBase64(cmd));
    }

    /**
     * Stop the tone playing, LED output and motors on the WeDo 2.0 hub.
     */
    _stopAll () {
        this.stopTone();
        this.stopAllMotors();
        this.stopLED();
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
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
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

        // Create a new WeDo2 device instance
        this._device = new WeDo2(this.runtime, Scratch3WeDo2Blocks.EXTENSION_ID);
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: Scratch3WeDo2Blocks.EXTENSION_ID,
            name: 'WeDo 2.0',
            iconURI: iconURI,
            showStatusButton: true,
            blocks: [
                {
                    opcode: 'motorOnFor',
                    text: 'turn [MOTOR_ID] on for [DURATION] seconds',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        MOTOR_ID: {
                            type: ArgumentType.STRING,
                            menu: 'motorID',
                            defaultValue: MotorID.DEFAULT
                        },
                        DURATION: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'motorOn',
                    text: 'turn [MOTOR_ID] on',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        MOTOR_ID: {
                            type: ArgumentType.STRING,
                            menu: 'motorID',
                            defaultValue: MotorID.DEFAULT
                        }
                    }
                },
                {
                    opcode: 'motorOff',
                    text: 'turn [MOTOR_ID] off',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        MOTOR_ID: {
                            type: ArgumentType.STRING,
                            menu: 'motorID',
                            defaultValue: MotorID.DEFAULT
                        }
                    }
                },
                {
                    opcode: 'startMotorPower',
                    text: 'set [MOTOR_ID] power to [POWER]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        MOTOR_ID: {
                            type: ArgumentType.STRING,
                            menu: 'motorID',
                            defaultValue: MotorID.DEFAULT
                        },
                        POWER: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 100
                        }
                    }
                },
                {
                    opcode: 'setMotorDirection',
                    text: 'set [MOTOR_ID] direction to [DIRECTION]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        MOTOR_ID: {
                            type: ArgumentType.STRING,
                            menu: 'motorID',
                            defaultValue: MotorID.DEFAULT
                        },
                        DIRECTION: {
                            type: ArgumentType.STRING,
                            menu: 'motorDirection',
                            defaultValue: MotorDirection.FORWARD
                        }
                    }
                },
                {
                    opcode: 'setLightHue',
                    text: 'set light color to [HUE]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        HUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 50
                        }
                    }
                },
                {
                    opcode: 'playNoteFor',
                    text: 'play note [NOTE] for [DURATION] seconds',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        NOTE: {
                            type: ArgumentType.NUMBER, // TODO: ArgumentType.MIDI_NOTE?
                            defaultValue: 60
                        },
                        DURATION: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0.5
                        }
                    }
                },
                {
                    opcode: 'whenDistance',
                    text: 'when distance [OP] [REFERENCE]',
                    blockType: BlockType.HAT,
                    arguments: {
                        OP: {
                            type: ArgumentType.STRING,
                            menu: 'lessMore',
                            defaultValue: '<'
                        },
                        REFERENCE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 50
                        }
                    }
                },
                {
                    opcode: 'whenTilted',
                    text: 'when tilted [DIRECTION]',
                    func: 'isTilted',
                    blockType: BlockType.HAT,
                    arguments: {
                        DIRECTION: {
                            type: ArgumentType.STRING,
                            menu: 'tiltDirectionAny',
                            defaultValue: TiltDirection.ANY
                        }
                    }
                },
                {
                    opcode: 'getDistance',
                    text: 'distance',
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'isTilted',
                    text: 'tilted [DIRECTION]?',
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        DIRECTION: {
                            type: ArgumentType.STRING,
                            menu: 'tiltDirectionAny',
                            defaultValue: TiltDirection.ANY
                        }
                    }
                },
                {
                    opcode: 'getTiltAngle',
                    text: 'tilt angle [DIRECTION]',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        DIRECTION: {
                            type: ArgumentType.STRING,
                            menu: 'tiltDirection',
                            defaultValue: TiltDirection.UP
                        }
                    }
                }
            ],
            menus: {
                motorID: [MotorID.DEFAULT, MotorID.A, MotorID.B, MotorID.ALL],
                motorDirection: [MotorDirection.FORWARD, MotorDirection.BACKWARD, MotorDirection.REVERSE],
                tiltDirection: [TiltDirection.UP, TiltDirection.DOWN, TiltDirection.LEFT, TiltDirection.RIGHT],
                tiltDirectionAny:
                    [TiltDirection.UP, TiltDirection.DOWN, TiltDirection.LEFT, TiltDirection.RIGHT, TiltDirection.ANY],
                lessMore: ['<', '>']
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
            this._forEachMotor(args.MOTOR_ID, motorIndex => {
                const motor = this._device.motor(motorIndex);
                if (motor) {
                    motor.setMotorOnFor(durationMS);
                }
            });

            // Ensure this block runs for a fixed amount of time even when no device is connected.
            setTimeout(resolve, durationMS);
        });
    }

    /**
     * Turn specified motor(s) on indefinitely.
     * @param {object} args - the block's arguments.
     * @property {MotorID} MOTOR_ID - the motor(s) to activate.
     */
    motorOn (args) {
        this._forEachMotor(args.MOTOR_ID, motorIndex => {
            const motor = this._device.motor(motorIndex);
            if (motor) {
                motor.setMotorOn();
            }
        });
    }

    /**
     * Turn specified motor(s) off.
     * @param {object} args - the block's arguments.
     * @property {MotorID} MOTOR_ID - the motor(s) to deactivate.
     */
    motorOff (args) {
        this._forEachMotor(args.MOTOR_ID, motorIndex => {
            const motor = this._device.motor(motorIndex);
            if (motor) {
                motor.setMotorOff();
            }
        });
    }

    /**
     * Turn specified motor(s) off.
     * @param {object} args - the block's arguments.
     * @property {MotorID} MOTOR_ID - the motor(s) to be affected.
     * @property {int} POWER - the new power level for the motor(s).
     */
    startMotorPower (args) {
        this._forEachMotor(args.MOTOR_ID, motorIndex => {
            const motor = this._device.motor(motorIndex);
            if (motor) {
                motor.power = args.POWER;
                motor.setMotorOn();
            }
        });
    }

    /**
     * Set the direction of rotation for specified motor(s).
     * If the direction is 'reverse' the motor(s) will be reversed individually.
     * @param {object} args - the block's arguments.
     * @property {MotorID} MOTOR_ID - the motor(s) to be affected.
     * @property {MotorDirection} DIRECTION - the new direction for the motor(s).
     */
    setMotorDirection (args) {
        this._forEachMotor(args.MOTOR_ID, motorIndex => {
            const motor = this._device.motor(motorIndex);
            if (motor) {
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
            }
        });
    }

    /**
     * Set the LED's hue.
     * @param {object} args - the block's arguments.
     * @property {number} HUE - the hue to set, in the range [0,100].
     */
    setLightHue (args) {
        // Convert from [0,100] to [0,360]
        const hue = args.HUE * 360 / 100;

        const rgbObject = color.hsvToRgb({h: hue, s: 1, v: 1});

        const rgbDecimal = color.rgbToDecimal(rgbObject);

        this._device.setLED(rgbDecimal);
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
            this._device.playTone(tone, durationMS);

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
        switch (args.OP) {
        case '<':
        case '&lt;':
            return this._device.distance < args.REFERENCE;
        case '>':
        case '&gt;':
            return this._device.distance > args.REFERENCE;
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
        return this._device.distance;
    }

    /**
     * Test whether the tilt sensor is currently tilted.
     * @param {object} args - the block's arguments.
     * @property {TiltDirection} DIRECTION - the tilt direction to test (up, down, left, right, or any).
     * @return {boolean} - true if the tilt sensor is tilted past a threshold in the specified direction.
     */
    isTilted (args) {
        return this._isTilted(args.DIRECTION);
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
        switch (direction) {
        case TiltDirection.ANY:
            return (Math.abs(this._device.tiltX) >= Scratch3WeDo2Blocks.TILT_THRESHOLD) ||
                (Math.abs(this._device.tiltY) >= Scratch3WeDo2Blocks.TILT_THRESHOLD);
        default:
            return this._getTiltAngle(direction) >= Scratch3WeDo2Blocks.TILT_THRESHOLD;
        }
    }

    /**
     * @param {TiltDirection} direction - the direction (up, down, left, right) to check.
     * @return {number} - the tilt sensor's angle in the specified direction.
     * Note that getTiltAngle(up) = -getTiltAngle(down) and getTiltAngle(left) = -getTiltAngle(right).
     * @private
     */
    _getTiltAngle (direction) {
        switch (direction) {
        case TiltDirection.UP:
            return this._device.tiltY > 45 ? 256 - this._device.tiltY : -this._device.tiltY;
        case TiltDirection.DOWN:
            return this._device.tiltY > 45 ? this._device.tiltY - 256 : this._device.tiltY;
        case TiltDirection.LEFT:
            return this._device.tiltX > 45 ? 256 - this._device.tiltX : -this._device.tiltX;
        case TiltDirection.RIGHT:
            return this._device.tiltX > 45 ? this._device.tiltX - 256 : this._device.tiltX;
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
}

module.exports = Scratch3WeDo2Blocks;
