const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const color = require('../../util/color');
const log = require('../../util/log');

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const iconURI = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+d2VkbzItYmxvY2staWNvbjwvdGl0bGU+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMzUuMzEzIDEwLjQ2N0gzMi4wOVY4Ljg2NWMwLS4yMjMuMTgtLjQwNC40MDUtLjQwNGgyLjQxMmMuMjI0IDAgLjQwNi4xODIuNDA2LjQwNXYxLjYwMnpNMzAuNDc3IDEwLjQ2N2gtMy4yMjRWOC44NjVjMC0uMjIzLjE4My0uNDA0LjQwNy0uNDA0aDIuNDFjLjIyNiAwIC40MDcuMTgyLjQwNy40MDV2MS42MDJ6TTI1LjY0IDEwLjQ2N0gyMi40MlY4Ljg2NWMwLS4yMjMuMTgyLS40MDQuNDA2LS40MDRoMi40MWMuMjI2IDAgLjQwNy4xODIuNDA3LjQwNXYxLjYwMnpNMjAuODA2IDEwLjQ2N2gtMy4yMjRWOC44NjVjMC0uMjIzLjE4Mi0uNDA0LjQwNi0uNDA0SDIwLjRjLjIyNCAwIC40MDYuMTgyLjQwNi40MDV2MS42MDJ6TTE1Ljk3IDEwLjQ2N2gtMy4yMjRWOC44NjVjMC0uMjIzLjE4Mi0uNDA0LjQwNy0uNDA0aDIuNDFjLjIyNiAwIC40MDcuMTgyLjQwNy40MDV2MS42MDJ6TTExLjEzNSAxMC40NjdINy45MVY4Ljg2NWMwLS4yMjMuMTgzLS40MDQuNDA3LS40MDRoMi40MTJjLjIyMyAwIC40MDUuMTgyLjQwNS40MDV2MS42MDJ6IiBzdHJva2U9IiM2Rjc4OTMiIGZpbGw9IiNGRkYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0zNy43MyAxMC40NjdINi4zYy0yLjY3IDAtNC44MzYgMi4xNTMtNC44MzYgNC44MDh2My4yMDVoMzcuMDczdi03LjIxYzAtLjQ0NC0uMzYyLS44MDMtLjgwNy0uODAzeiIgc3Ryb2tlPSIjNkY3ODkzIiBmaWxsPSIjRkZGIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNMzguMTM0IDMwLjk4SDEuODY3Yy0uMjI0IDAtLjQwMy0uMTgtLjQwMy0uNFYxNi4yMzZoMzIuNzFjLjczIDAgMS40My4yODcgMS45NDUuOC41MTUuNTE0IDEuMjE1LjgwMiAxLjk0NC44MDJoLjQ3M3YxMi43NGMwIC4yMi0uMTguNC0uNDAzLjR6IiBzdHJva2U9IiM2Rjc4OTMiIGZpbGw9IiNFNkU3RTgiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIHN0cm9rZT0iIzZGNzg5MyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMzQuODMgMTYuMjM3bC40ODMtMi41NjVoMy4yMjMiLz48cGF0aCBkPSJNMzguNTM2IDExLjI2OFYzMC41OGMwIC4yMi0uMTguNC0uNDAzLjRIMS44NjZjLS4yMiAwLS40MDMtLjE4LS40MDMtLjR2LTEuMjAzaDM0LjI4MmMuNjUgMCAxLjE4LS41MjQgMS4xOC0xLjE3M1YxMC40NjdoLjgwNWMuNDQ2IDAgLjgwNi4zNi44MDYuOHoiIHN0cm9rZT0iIzZGNzg5MyIgZmlsbD0iIzZGNzg5MyIgb3BhY2l0eT0iLjE1IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNMTEuNTM4IDE2LjI4aDIwLjE0OGMuMjIyIDAgLjQwMy4xOC40MDMuNHY2LjUyN2MwIC4yMjItLjE4Mi40LS40MDQuNEgxMS41MzhjLS4yMjMgMC0uNDA0LS4xNzgtLjQwNC0uNFYxNi42OGMwLS4yMi4xOC0uNC40MDQtLjQiIGZpbGw9IiNFNkU3RTgiLz48cGF0aCBkPSJNMTEuNTM4IDE2LjI4aDIwLjE0OGMuMjIyIDAgLjQwMy4xOC40MDMuNHY2LjUyN2MwIC4yMjItLjE4Mi40LS40MDQuNEgxMS41MzhjLS4yMjMgMC0uNDA0LS4xNzgtLjQwNC0uNFYxNi42OGMwLS4yMi4xOC0uNC40MDQtLjR6IiBzdHJva2U9IiM2Rjc4OTMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0zMi4wOSAxNi4yOHY2LjkyN2MwIC4yMjItLjE4LjQtLjQwNC40aC0yMC4xNWMtLjIyIDAtLjQtLjE4LS40LS40di0xLjJoMTguMTZjLjY1MyAwIDEuMTgtLjUyNiAxLjE4LTEuMTc0VjE2LjI4aDEuNjEzeiIgc3Ryb2tlPSIjNkY3ODkzIiBmaWxsPSIjNkU3NzkyIiBvcGFjaXR5PSIuMTUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0zMC40NzcgMTYuMjhoLTMuMjI0di0xLjYwNGMwLS4yMjMuMTgzLS40MDQuNDA3LS40MDRoMi40MWMuMjI2IDAgLjQwNy4xOC40MDcuNDA0djEuNjAzek0xNS45NyAxNi4yOGgtMy4yMjR2LTEuNjA0YzAtLjIyMy4xODItLjQwNC40MDctLjQwNGgyLjQxYy4yMjYgMCAuNDA3LjE4LjQwNy40MDR2MS42MDN6TTI1LjY0IDE2LjI4SDIyLjQydi0xLjYwNGMwLS4yMjMuMTgyLS40MDQuNDA2LS40MDRoMi40MWMuMjI2IDAgLjQwNy4xOC40MDcuNDA0djEuNjAzek0yMC44MDYgMTYuMjhoLTMuMjI0di0xLjYwNGMwLS4yMjMuMTgyLS40MDQuNDA2LS40MDRIMjAuNGMuMjI0IDAgLjQwNi4xOC40MDYuNDA0djEuNjAzeiIgc3Ryb2tlPSIjNkY3ODkzIiBmaWxsPSIjRTZFN0U4IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNMTguNTU3IDE5LjkxYzAgMS4wMjUtLjgzNyAxLjg1Ny0xLjg3IDEuODU3LTEuMDMgMC0xLjg2Ny0uODMyLTEuODY3LTEuODU4IDAtMS4wMjcuODM3LTEuODU4IDEuODY4LTEuODU4IDEuMDMyIDAgMS44Ny44MyAxLjg3IDEuODU3ek0yMy40OCAxOS45MWMwIDEuMDI1LS44MzYgMS44NTctMS44NjggMS44NTdzLTEuODctLjgzMi0xLjg3LTEuODU4YzAtMS4wMjcuODM4LTEuODU4IDEuODctMS44NThzMS44NjguODMgMS44NjggMS44NTd6TTI4LjQwNCAxOS45MWMwIDEuMDI1LS44MzcgMS44NTctMS44NjggMS44NTctMS4wMzIgMC0xLjg3LS44MzItMS44Ny0xLjg1OCAwLTEuMDI3LjgzOC0xLjg1OCAxLjg3LTEuODU4IDEuMDMgMCAxLjg2OC44MyAxLjg2OCAxLjg1N3oiIHN0cm9rZT0iIzZGNzg5MyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTE4LjU1NyAxOS45MjJjMCAxLjAyNi0uODM3IDEuODU4LTEuODcgMS44NTgtMS4wMyAwLTEuODY3LS44MzItMS44NjctMS44NTggMC0xLjAyNS44MzctMS44NTcgMS44NjgtMS44NTcgMS4wMzIgMCAxLjg3LjgzMiAxLjg3IDEuODU3TTIzLjQ4IDE5LjkyMmMwIDEuMDI2LS44MzYgMS44NTgtMS44NjggMS44NThzLTEuODctLjgzMi0xLjg3LTEuODU4YzAtMS4wMjUuODM4LTEuODU3IDEuODctMS44NTdzMS44NjguODMyIDEuODY4IDEuODU3TTI4LjQwNCAxOS45MjJjMCAxLjAyNi0uODM3IDEuODU4LTEuODY4IDEuODU4LTEuMDMyIDAtMS44Ny0uODMyLTEuODctMS44NTggMC0xLjAyNS44MzgtMS44NTcgMS44Ny0xLjg1NyAxLjAzIDAgMS44NjguODMyIDEuODY4IDEuODU3IiBmaWxsPSIjNkY3ODkzIiBvcGFjaXR5PSIuNSIvPjwvZz48L3N2Zz4=';

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
        return this._sensors.distance * 10;
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

        this.connect();
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: Scratch3WeDo2Blocks.EXTENSION_ID,
            name: 'WeDo 2.0',
            iconURI: iconURI,
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
     * Use the Device Manager client to attempt to connect to a WeDo 2.0 device.
     */
    connect () {
        if (this._device || this._finder) {
            return;
        }
        const deviceManager = this.runtime.ioDevices.deviceManager;
        const finder = this._finder =
            deviceManager.searchAndConnect(Scratch3WeDo2Blocks.EXTENSION_ID, WeDo2.DEVICE_TYPE);
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
                this._device.motor(motorIndex).setMotorOnFor(durationMS);
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
            this._device.motor(motorIndex).setMotorOn();
        });
    }

    /**
     * Turn specified motor(s) off.
     * @param {object} args - the block's arguments.
     * @property {MotorID} MOTOR_ID - the motor(s) to deactivate.
     */
    motorOff (args) {
        this._forEachMotor(args.MOTOR_ID, motorIndex => {
            this._device.motor(motorIndex).setMotorOff();
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
            motor.power = args.POWER;
            motor.setMotorOn();
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
}

module.exports = Scratch3WeDo2Blocks;
