const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const mqtt = require('mqtt');
const Buffer = require('buffer').Buffer;
const log = require('minilog')('playspot');
require('minilog').enable();

/**
 * Icon png to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAIAAAABc2X6AAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuNC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx4bXA6TW9kaWZ5RGF0ZT4yMDE5LTAxLTA0VDE5OjI4OjUzPC94bXA6TW9kaWZ5RGF0ZT4KICAgICAgICAgPHhtcDpDcmVhdG9yVG9vbD5GbHlpbmcgTWVhdCBBY29ybiA2LjIuMzwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjpZUmVzb2x1dGlvbj43MjwvdGlmZjpZUmVzb2x1dGlvbj4KICAgICAgICAgPHRpZmY6UmVzb2x1dGlvblVuaXQ+MjwvdGlmZjpSZXNvbHV0aW9uVW5pdD4KICAgICAgICAgPHRpZmY6Q29tcHJlc3Npb24+NTwvdGlmZjpDb21wcmVzc2lvbj4KICAgICAgICAgPHRpZmY6UGhvdG9tZXRyaWNJbnRlcnByZXRhdGlvbj4yPC90aWZmOlBob3RvbWV0cmljSW50ZXJwcmV0YXRpb24+CiAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjcyPC90aWZmOlhSZXNvbHV0aW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KNVxrxwAAIgZJREFUeAGtm2mQJMd1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';

/**
 * Enum for micro:bit buttons.
 * @readonly
 * @enum {string}
 */
const _microbitButtons = Object.freeze({
    A: 'a',
    B: 'b',
    ANY: 'any'
});

/**
 * Enum for micro:bit axes.
 * @readonly
 * @enum {string}
 */
const _axes = Object.freeze({
    X: 'X',
    Y: 'Y',
    Z: 'Z'
});

/**
 * Enum for micro:bit axes.
 * @readonly
 * @enum {string}
 */
const _tiltDirections = {
    front: 'front',
    back: 'back',
    left: 'left',
    right: 'right',
    any: 'any'
};

const NOT_FOUND = ' ';

/**
 * Manage communication with a Playspot peripheral over a MQTT client socket.
 */
class PlayspotMicrobits {
    /**
     * Construct a Playspot communication object.
     * @param {Runtime} runtime - the Scratch 3.0 runtime
     * @param {string} extensionId - the id of the extension
     */
    constructor (runtime, extensionId) {
        let location = 'localhost';
        if (typeof window !== 'undefined' && window && window.location && window.location.hostname) {
            location = window.location.hostname;
        }
        this.broker = `ws://${location}:3000`;
        this._connected = false;

        /**
         * The Scratch 3.0 runtime
         * @type {Runtime}
         * @private
         */
        this._runtime = runtime;
        this._runtime.registerPeripheralExtension(extensionId, this);

        /**
         * The id of the extension this peripheral belongs to.
         */
        this._extensionId = extensionId;

        /**
         * The most recently received value for each connected microbit.
         * @type {Object.<string, number>}
         * @private
         */
        this._microbits = {};

        // microbit event handlers
        this._microbitStatusHandler = microbits => {
            log.info(`microbitStatusHandler fired for microbits: ${microbits}`);
            this._microbits = JSON.parse(`${microbits}`);
            this._runtime.emit(this._runtime.constructor.PERIPHERAL_LIST_UPDATE, this._microbits);
        };

        this._microbitButtonHandler = (sender, button, payload) => {
            log.info(`microbitButtonHandler fired for payload: ${payload}`);
            if (this._microbits[sender] && this._microbits[sender].buttons[button] !== null) {
                this._microbits[sender].buttons[button] = payload[0] === 0 ? 0x0 : 0x1;
            }
        };

        this._microbitAccelerometerHandler = (sender, payload) => {
            log.info(`microbitButtonHandler fired for payload: ${payload}`);
            if (this._microbits[sender]) {
                const buf = Buffer.from(payload);
                const [x, y, z] = [buf.readFloatBE(0), buf.readFloatBE(4), buf.readFloatBE(8)];
                this._microbits[sender].accelerometer = {x, y, z};
            }
        };

        this._onMessage = (topic, payload) => {
            log.info(`onMessage fired for topic: ${topic}, payload: ${payload}`);
            if (topic === null || topic.split('/').count < 4) return;
            const t = topic.split('/');
            if (t[0] === 'microbit' && t[1] === 'all' && t[2] === 'out' && t[3] === 'status') {
                this._microbitStatusHandler(payload); // this is a status message
            } else if (t[0] === 'microbit' && t[2] === 'out' && t[3] === 'button') {
                this._microbitButtonHandler(t[1], t[4], payload); // this is a button message
            } else if (t[0] === 'microbit' && t[2] === 'out' && t[3] === 'accelerometer') {
                this._microbitAccelerometerHandler(t[1], payload); // this is a accelerometer message
            }
        };

        this._onStatusTimer = () => {
            log.info('status timeout timer fired');
            this._fetchMicrobitsTimeout = null;

            // Not interested in status messages now
            this._client.unsubscribe('microbit/+/out/status');

            // subscribe to radar and touch
            this._client.subscribe('microbit/+/out/button/+');
            this._client.subscribe('microbit/+/out/accelerometer');

            // The VM to refreshBlocks
            this._runtime.emit(this._runtime.constructor.PERIPHERAL_CONNECTED);
            this._connected = true;
        };

        this._onConnectTimer = () => {
            if (!this._connected) {
                log.info('connection timeout timer fired');
                this._onError();
            }
        };

        this._onConnect = () => {
            log.info(`onConnect fired`);

            // subscribe to all status, radar detection and touch events
            this._client.subscribe('microbit/+/out/status');

            // prod all devices to post their status
            this._client.publish('microbit/all/in/status', ``);

            // Give everyone 3 seconds to report
            this._fetchMicrobitsTimeout = setTimeout(this._onStatusTimer, 3000);
        };

        this._onReconnect = () => {
            log.info(`onReconnect fired`);
        };

        this._onClose = () => {
            log.info(`onClose fired`);
            this._connected = false;
            this.closeConnection();
        };

        this._onError = () => {
            log.info(`onError fired`);
            if (this._client) {
                this._client.end();
            }
            this.closeConnection();
        };

        this._onConnect = this._onConnect.bind(this);
        this._onReconnect = this._onReconnect.bind(this);
        this._onMessage = this._onMessage.bind(this);
        this._onClose = this._onClose.bind(this);
        this._onError = this._onError.bind(this);
        this._onStatusTimer = this._onStatusTimer.bind(this);
        this._onConnectTimer = this._onConnectTimer.bind(this);
    }

    closeConnection () {
        this._connected = false;
        if (this._client === null) return;
        this._client.end(true, () => {
            this._client.removeListener('connect', this._onConnect);
            this._client.removeListener('reconnect', this._onReconnect);
            this._client.removeListener('message', this._onMessage);
            this._client.removeListener('close', this._onClose);
            this._client.removeListener('error', this._onError);
            this._client = null;
        });
        this._runtime.emit(this._runtime.constructor.PERIPHERAL_SCAN_TIMEOUT);
    }

    performConnection () {
        log.info(`performConnection fired`);
        this._client = mqtt.connect(this.broker);
        if (!this._client) this._onError();

        // bind the event handlers
        this._client.on('connect', this._onConnect);
        this._client.on('reconnect', this._onReconnect);
        this._client.on('message', this._onMessage);
        this._client.on('close', this._onClose);
        this._client.on('error', this._onError);
        this._onStatusTimer = this._onStatusTimer.bind(this);
        this._onConnectTimer = this._onConnectTimer.bind(this);

        this._performConnectTimeout = setTimeout(this._onConnectTimer, 10000);
    }

    /**
     * Called by the runtime when user wants to scan for a peripheral.
     */
    scan () {
        log.info(`scan fired`);
        this.connect();
    }

    /**
     * Called by the runtime when user wants to connect to a certain peripheral.
     * @param {string} url - the id of the peripheral to connect to.
     */
    connect (url) {
        log.info(`connected fired with url = ${url}`);
        if (url) this.broker = url;
        if (!this.broker) {
            this._onError();
            return;
        }
        log.info(`will connect with = ${this.broker}`);
        if (this._client) {
            // connect to the possibly new broker
            this._client.end(false, this.performConnection.bind(this));
        } else {
            this.performConnection();
        }
    }

    /**
     * Called by the runtime when user wants to connect to a certain peripheral.
     * @param {number} id - the id of the peripheral to connect to.
     */
    disconnect () {
        log.info(`disconnecting`);
        if (typeof this._client !== 'undefined' && this._client) {
            this._client.end(false, this.removeConnection.bind(this));
        }
    }

    /**
     * Return true if connected to the micro:bit.
     * @return {boolean} - whether the micro:bit is connected.
     */
    isConnected () {
        return typeof this._client !== 'undefined' && this._client && this._connected;
    }

    /**
     * Return true if touched.
     * @param {string} microbit - the microbit in question
     * @param {button} button - the particular button on the microbit in question
     * @return {boolean} - whether the satelliate is being touched.
     */
    isMicrobitButtonPressed (microbit, button) {
        return (
            typeof microbit !== 'undefined' &&
            microbit &&
            microbit !== NOT_FOUND &&
            this._microbits[microbit] !== null &&
            this._microbits[microbit].buttons[_microbitButtons[button]] !== null &&
            this._microbits[microbit].buttons[_microbitButtons[button]] === 0x1
        );
    }

    /**
     * Return the separate acceleration components.
     * @param {string} microbit - the microbit in question
     * @return {{x: number, y: number, z: number}} - acceleration in 3 vector
     * components relative to plane of the microbit.
     */
    accelerationComponents (microbit) {
        if (
            typeof microbit !== 'undefined' &&
            microbit &&
            microbit !== NOT_FOUND &&
            this._microbits[microbit] !== null
        ) {
            return this._microbits[microbit].accelerometer;
        }
        return {x: 0.0, y: 0.0, z: 1.0};
    }

    /**
     * Return acceleration in the x direction relative to the plane of the microbit.
     * @param {string} microbit - the microbit in question
     * @return {number} - acceleration in the x direction.
     */
    xAcceleration (microbit) {
        const {x} = this.accelerationComponents(microbit);
        return x;
    }

    /**
     * Return acceleration in the y direction relative to the plane of the microbit.
     * @param {string} microbit - the microbit in question
     * @return {number} - acceleration in the y direction.
     */
    yAcceleration (microbit) {
        const {y} = this.accelerationComponents(microbit);
        return y;
    }

    /**
     * Return acceleration in the z direction relative to the plane of the microbit.
     * @param {string} microbit - the microbit in question
     * @return {number} - acceleration in the z direction.
     */
    zAcceleration (microbit) {
        const {z} = this.accelerationComponents(microbit);
        return z;
    }

    /**
     * Return the total acceleration .
     * @param {string} microbit - the microbit in question
     * @return {number} - acceleration in 3 vector
     * components relative to plane of the microbit.
     */
    totalAcceleration (microbit) {
        const {x, y, z} = this.accelerationComponents(microbit);
        return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pwow(z, 2));
    }

    /**
     * Return the tilts
     * @param {string} microbit - the microbit in question
     * @return {{pitch: number, roll: number}} - the tilts
     */
    orientation (microbit) {
        const acc = this.accelerationComponents(microbit);
        if (!acc) return {pitch: 0.0, roll: 0.0};

        let pitch = Math.atan(acc.y / Math.sqrt(Math.pow(acc.x, 2) + Math.pow(acc.z, 2)));
        let roll = Math.atan(acc.x / Math.sqrt(Math.pow(acc.y, 2) + Math.pow(acc.z, 2)));

        pitch = pitch * (180.0 / Math.PI);
        roll = -1 * roll * (180.0 / Math.PI);

        return {pitch, roll};
    }

    _repackMatrix (matrix) {
        let retValue = '';
        for (let row = 0; row < 5; row++) {
            let value = 0;
            for (let col = 0; col < 5; col++) {
                let pos = row * 5;
                pos += col;
                value += matrix.charAt(pos) === '1' ? Math.pow(2, col) : 0;
            }
            const value1 = value > 15 ? '1' : '0';
            const value2 = value > 15 ? value - 16 : value;
            retValue += value1 + (value2 === 0 ? '0' : value2.toString(16).replace(/^0+/, ''));
        }
        return retValue;
    }

    /**
     * Display a symbol on a microbit
     * @param {string} microbit - the microbit in question
     * @param {string} matrix - the bit pattern representing the matrix to light up
     */
    displayMicrobitSymbol (microbit, matrix) {
        // 0101010101100010101000100 = heart
        const buf = Buffer.from(this._repackMatrix(matrix), 'hex');
        this._client.publish(`microbit/${microbit}/in/matrix`, buf);
    }

    /**
     * Display text on a microbit
     * @param {string} microbit - the microbit in question
     * @param {string} text - the text to display
     */
    displayMicrobitText (microbit, text) {
        const buf = Buffer.from(text);
        this._client.publish(`microbit/${microbit}/in/text`, buf);
    }

    /**
     * Display the display of a microbit
     * @param {string} microbit - the microbit in question
     */
    displayMicrobitClear (microbit) {
        const buf = Buffer.from('0000000000', 'hex');
        this._client.publish(`microbit/${microbit}/in/matrix`, buf);
    }
}

class Scratch3PlayspotMicrobitsBlocks {
    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME () {
        return 'PlayspotMicrobits';
    }

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return 'playspot_microbits';
    }

    /**
     * @return {array} - text and values for each satellites menu element
     */
    get MICROBITS () {
        return Object.keys(this._peripheral._microbits || {}).length === 0 ?
            [{text: NOT_FOUND, value: NOT_FOUND}] :
            Object.keys(this._peripheral._microbits).map(currentValue => ({
                text: currentValue,
                value: currentValue
            }));
    }

    /**
     * @return {array} - text and values for each sounds menu element
     */
    get MICROBIT_BUTTONS () {
        return (
            Object.keys(_microbitButtons).map(currentValue => ({
                text: currentValue,
                value: currentValue
            })) || []
        );
    }

    /**
     * @return {array} - text and values for each axis menu element
     */
    get AXES () {
        return (
            Object.keys(_axes).map(currentValue => ({
                text: currentValue,
                value: currentValue
            })) || []
        );
    }

    /**
     * @return {array} - text and values for each tiltDirection menu element
     */
    get TILT_DIRECTIONS () {
        return (
            Object.keys(_tiltDirections).map(currentValue => ({
                text: currentValue,
                value: currentValue
            })) || []
        );
    }

    /**
     * Construct a set of Playspot blocks.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        /**
         * The Playspot handler.
         * @type {Playspot}
         */
        this._peripheral = new PlayspotMicrobits(this.runtime, Scratch3PlayspotMicrobitsBlocks.EXTENSION_ID);
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        const defaultMicrobit =
            Object.keys(this._peripheral._microbits).length === 0 ? NOT_FOUND : this._peripheral._microbits[0];
        return {
            id: Scratch3PlayspotMicrobitsBlocks.EXTENSION_ID,
            name: Scratch3PlayspotMicrobitsBlocks.EXTENSION_NAME,
            blockIconURI: blockIconURI,
            showStatusButton: true,
            blocks: [
                {
                    opcode: 'whenMicrobitButtonPressed',
                    text: 'When button [BUTTON] on microbit [MICROBIT] is pressed',
                    blockType: BlockType.HAT,
                    arguments: {
                        BUTTON: {
                            type: ArgumentType.STRING,
                            menu: 'buttons',
                            defaultValue: 'A'
                        },
                        MICROBIT: {
                            type: ArgumentType.STRING,
                            menu: 'microbits',
                            defaultValue: defaultMicrobit
                        }
                    }
                },
                {
                    opcode: 'isMicrobitButtonPressed',
                    text: 'is button [BUTTON] on microbit [MICROBIT] pressed?',
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        BUTTON: {
                            type: ArgumentType.STRING,
                            menu: 'buttons',
                            defaultValue: 'A'
                        },
                        MICROBIT: {
                            type: ArgumentType.STRING,
                            menu: 'microbits',
                            defaultValue: defaultMicrobit
                        }
                    }
                },
                '---',
                {
                    opcode: 'whenTilted',
                    text: 'when microbit [MICROBIT] is tilted [DIRECTION]',
                    blockType: BlockType.HAT,
                    arguments: {
                        DIRECTION: {
                            type: ArgumentType.STRING,
                            menu: 'tiltDirections',
                            defaultValue: _tiltDirections.ANY
                        },
                        MICROBIT: {
                            type: ArgumentType.STRING,
                            menu: 'microbits',
                            defaultValue: defaultMicrobit
                        }
                    }
                },
                {
                    opcode: 'isTilted',
                    text: 'microbit [MICROBIT] tilted [DIRECTION]?',
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        DIRECTION: {
                            type: ArgumentType.STRING,
                            menu: 'tiltDirections',
                            defaultValue: _tiltDirections.ANY
                        },
                        MICROBIT: {
                            type: ArgumentType.STRING,
                            menu: 'microbits',
                            defaultValue: defaultMicrobit
                        }
                    }
                },
                {
                    opcode: 'getTiltAngle',
                    text: 'tilt angle [DIRECTION] of microbit [MICROBIT]',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        DIRECTION: {
                            type: ArgumentType.STRING,
                            menu: 'tiltDirection',
                            defaultValue: _tiltDirections.FRONT
                        },
                        MICROBIT: {
                            type: ArgumentType.STRING,
                            menu: 'microbits',
                            defaultValue: defaultMicrobit
                        }
                    }
                },
                '---',
                {
                    opcode: 'displayMicrobitSymbol',
                    text: 'display [MATRIX] on microbit [MICROBIT]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        MATRIX: {
                            type: ArgumentType.MATRIX,
                            defaultValue: '0101010101100010101000100'
                        },
                        MICROBIT: {
                            type: ArgumentType.STRING,
                            menu: 'microbits',
                            defaultValue: defaultMicrobit
                        }
                    }
                },
                {
                    opcode: 'displayMicrobitText',
                    text: 'display text [TEXT] on microbit [MICROBIT]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Hello!'
                        },
                        MICROBIT: {
                            type: ArgumentType.STRING,
                            menu: 'microbits',
                            defaultValue: defaultMicrobit
                        }
                    }
                },
                {
                    opcode: 'displayMicrobitClear',
                    text: 'clear display on microbit [MICROBIT]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        MICROBIT: {
                            type: ArgumentType.STRING,
                            menu: 'microbits',
                            defaultValue: defaultMicrobit
                        }
                    }
                }
            ],
            menus: {
                microbits: this.MICROBITS,
                buttons: this.MICROBIT_BUTTONS,
                tiltDirections: this.TILT_DIRECTIONS
            }
        };
    }

    /**
     * Notification when satellite is touched
     * @param {object} args - the block's arguments.
     * @return {boolean} - true if the button is pressed.
     */
    whenMicrobitButtonPressed (args) {
        return this._peripheral.isMicrobitButtonPressed(args.MICROBIT, args.BUTTON);
    }

    /**
     * Test whether the satellite is touched
     * @param {object} args - the block's arguments.
     * @return {boolean} - true if the button is pressed.
     */
    isMicrobitButtonPressed (args) {
        return this._peripheral.isMicrobitButtonPressed(args.MICROBIT, args.BUTTON);
    }

    whenTilted (args) {
        return this.isTilted(args);
    }

    isTilted (args) {
        const {pitch, roll} = this._peripheral.orientation(args.MICROBIT);
        if (args.DIRECTION === 'front') {
            return pitch < -10.0;
        } else if (args.DIRECTION === 'back') {
            return pitch > 10.0;
        } else if (args.DIRECTION === 'right') {
            return roll < -10.0;
        } else if (args.DIRECTION === 'left') {
            return pitch > 10.0;
        } else if (args.DIRECTION === 'any') {
            return Math.abs(pitch) > 15.0 || Math.abs(roll) > 15.0;
        }
        return false;
    }

    getTiltAngle (args) {
        return this._getTiltAngle(args.MICROBIT, args.DIRECTION);
    }

    /**
     * @param {string} microbit - the microbit to check.
     * @param {_tiltDirections} direction - the direction (front, back, left, right) to check.
     * @return {number} - the tilt sensor's angle in the specified direction.
     * Note that getTiltAngle(front) = -getTiltAngle(back) and getTiltAngle(left) = -getTiltAngle(right).
     * @private
     */
    _getTiltAngle (microbit, direction) {
        switch (direction) {
        case _tiltDirections.FRONT:
            return Math.round(this._peripheral.orientation(microbit).pitch / -10);
        case _tiltDirections.BACK:
            return Math.round(this._peripheral.orientation(microbit).pitch / 10);
        case _tiltDirections.LEFT:
            return Math.round(this._peripheral.orientation(microbit).roll / -10);
        case _tiltDirections.RIGHT:
            return Math.round(this._peripheral.orientation(microbit).roll / 10);
        default:
            log.warn(`Unknown tilt direction in _getTiltAngle: ${direction}`);
        }
    }

    /**
     * @param {object} args - a microbit and a displaySymbol.
     */
    displayMicrobitSymbol (args) {
        this._peripheral.displayMicrobitSymbol(args.MICROBIT, args.MATRIX);
    }

    /**
     * @param {object} args - a microbit and some text.
     */
    displayMicrobitText (args) {
        this._peripheral.displayMicrobitText(args.MICROBIT, args.TEXT);
    }

    /**
     * @param {object} args - a microbit.
     */
    displayMicrobitClear (args) {
        this._peripheral.displayMicrobitClear(args.microbit);
    }
}

module.exports = Scratch3PlayspotMicrobitsBlocks;
