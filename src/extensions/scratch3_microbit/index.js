const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const log = require('../../util/log');
const cast = require('../../util/cast');
const BLESession = require('../../io/bleSession');
const Base64Util = require('../../util/base64-util');

/**
 * Icon png to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/png;base64,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';

/**
 * Enum for micro:bit BLE command protocol.
 * https://github.com/LLK/scratch-microbit-firmware/blob/master/protocol.md
 * @readonly
 * @enum {number}
 */
const BLECommand = {
    CMD_PIN_CONFIG: 0x80,
    CMD_DISPLAY_TEXT: 0x81,
    CMD_DISPLAY_LED: 0x82
};

/**
 * Enum for micro:bit protocol.
 * https://github.com/LLK/scratch-microbit-firmware/blob/master/protocol.md
 * @readonly
 * @enum {string}
 */
const BLEUUID = {
    service: 0xf005,
    rxChar: '5261da01-fa7e-42ab-850b-7c80220097cc',
    txChar: '5261da02-fa7e-42ab-850b-7c80220097cc'
};

/**
 * Manage communication with a MicroBit device over a Scrath Link client socket.
 */
class MicroBit {

    /**
     * Construct a MicroBit communication object.
     * @param {Runtime} runtime - the Scratch 3.0 runtime
     * @param {string} extensionId - the id of the extension
     */
    constructor (runtime, extensionId) {

        /**
         * The Scratch 3.0 runtime used to trigger the green flag button.
         * @type {Runtime}
         * @private
         */
        this._runtime = runtime;

        /**
         * The BluetoothLowEnergy connection session for reading/writing device data.
         * @type {BLESession}
         * @private
         */
        this._ble = null;
        this._runtime.registerExtensionDevice(extensionId, this);

        /**
         * The most recently received value for each sensor.
         * @type {Object.<string, number>}
         * @private
         */
        this._sensors = {
            tiltX: 0,
            tiltY: 0,
            buttonA: 0,
            buttonB: 0,
            touchPins: [0, 0, 0],
            gestureState: 0,
            ledMatrixState: new Uint8Array(5)
        };

        /**
         * The most recently received value for each gesture.
         * @type {Object.<string, Object>}
         * @private
         */
        this._gestures = {
            moving: false,
            move: {
                active: false,
                timeout: false
            },
            shake: {
                active: false,
                timeout: false
            },
            jump: {
                active: false,
                timeout: false
            }
        };
    }

    // TODO: keep here?
    /**
     * Called by the runtime when user wants to scan for a device.
     */
    startDeviceScan () {
        this._ble = new BLESession(this._runtime, {
            filters: [
                {services: [BLEUUID.service]}
            ]
        }, this._onSessionConnect.bind(this));
    }

    // TODO: keep here?
    /**
     * Called by the runtime when user wants to connect to a certain device.
     * @param {number} id - the id of the device to connect to.
     */
    connectDevice (id) {
        this._ble.connectDevice(id);
    }

    disconnectSession () {
        this._ble.disconnectSession();
    }

    getPeripheralIsConnected () {
        let connected = false;
        if (this._ble) {
            connected = this._ble.getPeripheralIsConnected();
        }
        return connected;
    }

    /**
     * @param {string} text - the text to display.
     * @return {Promise} - a Promise that resolves when writing to device.
     */
    displayText (text) {
        const output = new Uint8Array(text.length);
        for (let i = 0; i < text.length; i++) {
            output[i] = text.charCodeAt(i);
        }
        return this._writeSessionData(BLECommand.CMD_DISPLAY_TEXT, output);
    }

    /**
     * @param {Uint8Array} matrix - the matrix to display.
     * @return {Promise} - a Promise that resolves when writing to device.
     */
    displayMatrix (matrix) {
        return this._writeSessionData(BLECommand.CMD_DISPLAY_LED, matrix);
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
     * @return {boolean} - the latest value received for the A button.
     */
    get buttonA () {
        return this._sensors.buttonA;
    }

    /**
     * @return {boolean} - the latest value received for the B button.
     */
    get buttonB () {
        return this._sensors.buttonB;
    }

    /**
     * @return {number} - the latest value received for the motion gesture states.
     */
    get gestureState () {
        return this._sensors.gestureState;
    }

    /**
     * @return {Uint8Array} - the current state of the 5x5 LED matrix.
     */
    get ledMatrixState () {
        return this._sensors.ledMatrixState;
    }

    /**
     * @param {number} pin - the pin to check touch state.
     * @return {number} - the latest value received for the touch pin states.
     */
    _checkPinState (pin) {
        return this._sensors.touchPins[pin];
    }

    /**
     * Starts reading data from device after BLE has connected to it.
     */
    _onSessionConnect () {
        const callback = this._processSessionData.bind(this);
        this._ble.read(BLEUUID.service, BLEUUID.rxChar, true, callback);
    }

    /**
     * Process the sensor data from the incoming BLE characteristic.
     * @param {object} base64 - the incoming BLE data.
     * @private
     */
    _processSessionData (base64) {
        const data = Base64Util.base64ToUint8Array(base64);

        this._sensors.tiltX = data[1] | (data[0] << 8);
        if (this._sensors.tiltX > (1 << 15)) this._sensors.tiltX -= (1 << 16);
        this._sensors.tiltY = data[3] | (data[2] << 8);
        if (this._sensors.tiltY > (1 << 15)) this._sensors.tiltY -= (1 << 16);

        this._sensors.buttonA = data[4];
        this._sensors.buttonB = data[5];

        this._sensors.touchPins[0] = data[6];
        this._sensors.touchPins[1] = data[7];
        this._sensors.touchPins[2] = data[8];

        this._sensors.gestureState = data[9];
    }

    /**
     * Write a message to the device BLE session.
     * @param {number} command - the BLE command hex.
     * @param {Uint8Array} message - the message to write.
     * @return {Promise} - a Promise that resolves when writing to device.
     * @private
     */
    _writeSessionData (command, message) {
        if (!this.getPeripheralIsConnected()) return;
        const output = new Uint8Array(message.length + 1);
        output[0] = command; // attach command to beginning of message
        for (let i = 0; i < message.length; i++) {
            output[i + 1] = message[i];
        }
        const data = Base64Util.uint8ArrayToBase64(output);
        return this._ble.write(BLEUUID.service, BLEUUID.txChar, data, 'base64');
    }
}

/**
 * Enum for tilt sensor direction.
 * @readonly
 * @enum {string}
 */
const TiltDirection = {
    FRONT: 'front',
    BACK: 'back',
    LEFT: 'left',
    RIGHT: 'right',
    ANY: 'any'
};

/**
 * Scratch 3.0 blocks to interact with a MicroBit device.
 */
class Scratch3MicroBitBlocks {

    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME () {
        return 'micro:bit';
    }

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return 'microbit';
    }

    /**
     * @return {number} - the tilt sensor counts as "tilted" if its tilt angle meets or exceeds this threshold.
     */
    static get TILT_THRESHOLD () {
        return 15;
    }

    /**
     * Construct a set of MicroBit blocks.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        // Create a new MicroBit device instance
        this._device = new MicroBit(this.runtime, Scratch3MicroBitBlocks.EXTENSION_ID);
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: Scratch3MicroBitBlocks.EXTENSION_ID,
            name: Scratch3MicroBitBlocks.EXTENSION_NAME,
            blockIconURI: blockIconURI,
            showStatusButton: true,
            blocks: [
                {
                    opcode: 'whenButtonPressed',
                    text: 'when [BTN] button pressed',
                    blockType: BlockType.HAT,
                    arguments: {
                        BTN: {
                            type: ArgumentType.STRING,
                            menu: 'buttons',
                            defaultValue: 'A'
                        }
                    }
                },
                {
                    opcode: 'isButtonPressed',
                    text: '[BTN] button pressed?',
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        BTN: {
                            type: ArgumentType.STRING,
                            menu: 'buttons',
                            defaultValue: 'A'
                        }
                    }
                },
                '---',
                {
                    opcode: 'whenGesture',
                    text: 'when [GESTURE]',
                    blockType: BlockType.HAT,
                    arguments: {
                        GESTURE: {
                            type: ArgumentType.STRING,
                            menu: 'gestures',
                            defaultValue: 'moved'
                        }
                    }
                },
                '---',
                {
                    opcode: 'displaySymbol',
                    text: 'display [MATRIX]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        MATRIX: {
                            type: ArgumentType.MATRIX,
                            defaultValue: '0101010101100010101000100'
                        }
                    }
                },
                {
                    opcode: 'displayText',
                    text: 'display [TEXT]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Hello!'
                        }
                    }
                },
                {
                    opcode: 'displayClear',
                    text: 'clear display',
                    blockType: BlockType.COMMAND
                },
                '---',
                {
                    opcode: 'whenTilted',
                    text: 'when tilted [DIRECTION]',
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
                            defaultValue: TiltDirection.FRONT
                        }
                    }
                },
                '---',
                {
                    opcode: 'whenPinConnected',
                    text: 'when pin [PIN] connected',
                    blockType: BlockType.HAT,
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            menu: 'touchPins',
                            defaultValue: '0'
                        }
                    }
                }
            ],
            menus: {
                buttons: ['A', 'B', 'any'],
                gestures: ['moved', 'shaken', 'jumped'],
                pinState: ['on', 'off'],
                tiltDirection: [TiltDirection.FRONT, TiltDirection.BACK, TiltDirection.LEFT, TiltDirection.RIGHT],
                tiltDirectionAny: [
                    TiltDirection.FRONT, TiltDirection.BACK, TiltDirection.LEFT,
                    TiltDirection.RIGHT, TiltDirection.ANY
                ],
                touchPins: ['0', '1', '2']
            }
        };
    }

    /**
     * Test whether the A or B button is pressed
     * @param {object} args - the block's arguments.
     * @return {boolean} - true if the button is pressed.
     */
    whenButtonPressed (args) {
        if (args.BTN === 'any') {
            return this._device.buttonA | this._device.buttonB;
        } else if (args.BTN === 'A') {
            return this._device.buttonA;
        } else if (args.BTN === 'B') {
            return this._device.buttonB;
        }
        return false;
    }

    /**
     * Test whether the A or B button is pressed
     * @param {object} args - the block's arguments.
     * @return {boolean} - true if the button is pressed.
     */
    isButtonPressed (args) {
        if (args.BTN === 'any') {
            return this._device.buttonA | this._device.buttonB;
        } else if (args.BTN === 'A') {
            return this._device.buttonA;
        } else if (args.BTN === 'B') {
            return this._device.buttonB;
        }
        return false;
    }

    /**
     * Test whether the micro:bit is moving
     * @param {object} args - the block's arguments.
     * @return {boolean} - true if the micro:bit is moving.
     */
    whenGesture (args) {
        const gesture = cast.toString(args.GESTURE);
        if (gesture === 'moved') {
            return (this._device.gestureState >> 2) & 1;
        } else if (gesture === 'shaken') {
            return this._device.gestureState & 1;
        } else if (gesture === 'jumped') {
            return (this._device.gestureState >> 1) & 1;
        }
        return false;
    }

    /**
     * Display a predefined symbol on the 5x5 LED matrix.
     * @param {object} args - the block's arguments.
     * @return {Promise} - a Promise that resolves after a tick.
     */
    displaySymbol (args) {
        const symbol = cast.toString(args.MATRIX);
        const reducer = (accumulator, c, index) => {
            const value = (c === '0') ? accumulator : accumulator + Math.pow(2, index);
            return value;
        };
        const hex = symbol.split('').reduce(reducer, 0);
        if (hex !== null) {
            this._device.ledMatrixState[0] = hex & 0x1F;
            this._device.ledMatrixState[1] = (hex >> 5) & 0x1F;
            this._device.ledMatrixState[2] = (hex >> 10) & 0x1F;
            this._device.ledMatrixState[3] = (hex >> 15) & 0x1F;
            this._device.ledMatrixState[4] = (hex >> 20) & 0x1F;
            this._device.displayMatrix(this._device.ledMatrixState);
        }

        return Promise.resolve();
    }

    /**
     * Display text on the 5x5 LED matrix.
     * @param {object} args - the block's arguments.
     * @return {Promise} - a Promise that resolves after a tick.
     * Note the limit is 19 characters
     */
    displayText (args) {
        const text = String(args.TEXT).substring(0, 19);
        if (text.length > 0) this._device.displayText(text);
        return Promise.resolve();
    }

    /**
     * Turn all 5x5 matrix LEDs off.
     * @return {Promise} - a Promise that resolves after a tick.
     */
    displayClear () {
        for (let i = 0; i < 5; i++) {
            this._device.ledMatrixState[i] = 0;
        }
        this._device.displayMatrix(this._device.ledMatrixState);
        return Promise.resolve();
    }

    /**
     * Test whether the tilt sensor is currently tilted.
     * @param {object} args - the block's arguments.
     * @property {TiltDirection} DIRECTION - the tilt direction to test (front, back, left, right, or any).
     * @return {boolean} - true if the tilt sensor is tilted past a threshold in the specified direction.
     */
    whenTilted (args) {
        return this._isTilted(args.DIRECTION);
    }

    /**
     * Test whether the tilt sensor is currently tilted.
     * @param {object} args - the block's arguments.
     * @property {TiltDirection} DIRECTION - the tilt direction to test (front, back, left, right, or any).
     * @return {boolean} - true if the tilt sensor is tilted past a threshold in the specified direction.
     */
    isTilted (args) {
        return this._isTilted(args.DIRECTION);
    }

    /**
     * @param {object} args - the block's arguments.
     * @property {TiltDirection} DIRECTION - the direction (front, back, left, right) to check.
     * @return {number} - the tilt sensor's angle in the specified direction.
     * Note that getTiltAngle(front) = -getTiltAngle(back) and getTiltAngle(left) = -getTiltAngle(right).
     */
    getTiltAngle (args) {
        return this._getTiltAngle(args.DIRECTION);
    }

    /**
     * Test whether the tilt sensor is currently tilted.
     * @param {TiltDirection} direction - the tilt direction to test (front, back, left, right, or any).
     * @return {boolean} - true if the tilt sensor is tilted past a threshold in the specified direction.
     * @private
     */
    _isTilted (direction) {
        switch (direction) {
        case TiltDirection.ANY:
            return (Math.abs(this._device.tiltX / 10) >= Scratch3MicroBitBlocks.TILT_THRESHOLD) ||
                (Math.abs(this._device.tiltY / 10) >= Scratch3MicroBitBlocks.TILT_THRESHOLD);
        default:
            return this._getTiltAngle(direction) >= Scratch3MicroBitBlocks.TILT_THRESHOLD;
        }
    }

    /**
     * @param {TiltDirection} direction - the direction (front, back, left, right) to check.
     * @return {number} - the tilt sensor's angle in the specified direction.
     * Note that getTiltAngle(front) = -getTiltAngle(back) and getTiltAngle(left) = -getTiltAngle(right).
     * @private
     */
    _getTiltAngle (direction) {
        switch (direction) {
        case TiltDirection.FRONT:
            return Math.round(this._device.tiltY / -10);
        case TiltDirection.BACK:
            return Math.round(this._device.tiltY / 10);
        case TiltDirection.LEFT:
            return Math.round(this._device.tiltX / -10);
        case TiltDirection.RIGHT:
            return Math.round(this._device.tiltX / 10);
        default:
            log.warn(`Unknown tilt direction in _getTiltAngle: ${direction}`);
        }
    }

    /**
     * @param {object} args - the block's arguments.
     * @return {boolean} - the touch pin state.
     * @private
     */
    whenPinConnected (args) {
        const pin = parseInt(args.PIN, 10);
        if (isNaN(pin)) return;
        if (pin < 0 || pin > 2) return false;
        return this._device._checkPinState(pin);
    }
}

module.exports = Scratch3MicroBitBlocks;
