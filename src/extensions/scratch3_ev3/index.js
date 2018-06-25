const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const log = require('../../util/log');
const Base64Util = require('../../util/base64-util');
const BTSession = require('../../io/BTSession');

/**
 * High-level primitives / constants used by the extension.
 * @type {object}
 */
const BTCommand = {
    LAYER: 0x00,
    NUM8: 0x81,
    NUM16: 0x82,
    NUM32: 0x83,
    COAST: 0x0,
    BRAKE: 0x1,
    LONGRAMP: 50,
    STEPSPEED: 0xAE,
    TIMESPEED: 0xAF,
    OUTPUTSTOP: 0xA3,
    OUTPUTRESET: 0xA2,
    STEPSPEEDSYNC: 0xB0,
    TIMESPEEDSYNC: 0xB1
};

/**
 * Array of accepted motor ports.
 * @note These should not be translated as they correspond to labels on
 *       the EV3 hub.
 * @type {array}
 */
const MOTOR_PORTS = [
    {
        name: 'A',
        value: 1
    },
    {
        name: 'B',
        value: 2
    },
    {
        name: 'C',
        value: 4
    },
    {
        name: 'D',
        value: 8
    }
];

/**
 * Array of accepted sensor ports.
 * @note These should not be translated as they correspond to labels on
 *       the EV3 hub.
 * @type {array}
 */
// const SENSOR_PORTS = ['1', '2', '3', '4'];

class EV3 {

    constructor (runtime, extensionId) {

        /**
         * The Scratch 3.0 runtime used to trigger the green flag button.
         * @type {Runtime}
         * @private
         */
        this._runtime = runtime;

        this.connected = false;
        this.speed = 50;

        /**
         * The Bluetooth connection session for reading/writing device data.
         * @type {BTSession}
         * @private
         */
        this._bt = null;
        this._runtime.registerExtensionDevice(extensionId, this);

        // TODO: auto-connect temporary - until button is added
        this.startDeviceScan();
    }

    // TODO: keep here?
    /**
     * Called by the runtime when user wants to scan for a device.
     */
    startDeviceScan () {
        log.info('making a new BT session');
        this._bt = new BTSession(this._runtime, {
            majorDeviceClass: 8,
            minorDeviceClass: 1
        }, this._onSessionConnect.bind(this));
    }

    // TODO: keep here?
    /**
     * Called by the runtime when user wants to connect to a certain device.
     * @param {number} id - the id of the device to connect to.
     */
    connectDevice (id) {
        this._bt.connectDevice(id);
    }

    beep () {
        if (!this.connected) return;
        this._bt.sendMessage({
            message: 'DwAAAIAAAJQBgQKC6AOC6AM=',
            encoding: 'base64'
        });
    }

    motorTurnClockwise (port, time) {
        if (!this.connected) return;

        // Build up motor command
        const cmd = this._applyPrefix(0, this._motorCommand(
            BTCommand.TIMESPEED,
            port,
            time,
            this.speed,
            BTCommand.LONGRAMP
        ));

        // Send message
        this._bt.sendMessage({
            message: Base64Util.arrayBufferToBase64(cmd),
            encoding: 'base64'
        });

        // Yield for time
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, time);
        });
    }

    motorTurnCounterClockwise (port, time) {
        if (!this.connected) return;

        // Build up motor command
        const cmd = this._applyPrefix(0, this._motorCommand(
            BTCommand.TIMESPEED,
            port,
            time,
            this.speed * -1,
            BTCommand.LONGRAMP
        ));

        // Send message
        this._bt.sendMessage({
            message: Base64Util.arrayBufferToBase64(cmd),
            encoding: 'base64'
        });

        // Yield for time
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, time);
        });
    }

    _applyPrefix (n, cmd) {
        const len = cmd.length + 5;
        return [].concat(
            len & 0xFF,
            (len >> 8) & 0xFF,
            0x1,
            0x0,
            0x0,
            n,
            0x0,
            cmd
        );
    }

    /**
     * Generate a motor command in EV3 byte array format (CMD, LAYER, PORT,
     * SPEED, RAMP UP, RUN, RAMP DOWN, BREAKING TYPE)
     * @param  {string} command Motor command primitive (i.e. "prefix")
     * @param  {string} port    Port to address
     * @param  {number} n       Value to be passed to motor command
     * @param  {number} speed   Speed value
     * @param  {number} ramp    Ramp value
     * @return {array}          Byte array
     */
    _motorCommand (command, port, n, speed, ramp) {
        /**
         * Generate run values for a given input.
         * @param  {number} run Run input
         * @return {array}      Run values (byte array)
         */
        const getRunValues = function (run) {
            // If run duration is less than max 16-bit integer
            if (run < 0x7fff) {
                return [
                    BTCommand.NUM16,
                    run & 0xff,
                    (run >> 8) & 0xff
                ];
            }

            // Run forever
            return [
                BTCommand.NUM32,
                run & 0xff,
                (run >> 8) & 0xff,
                (run >> 16) & 0xff,
                (run >> 24) & 0xff
            ];
        };

        // If speed is less than zero, make it positive and multiply the input
        // value by -1
        if (speed < 0) {
            speed = -1 * speed;
            n = -1 * n;
        }

        // If the input value is less than 0
        const dir = (n < 0) ? 0x100 - speed : speed; // step negative or possitive
        n = Math.abs(n);

        // Setup motor run duration and ramping behavior
        let rampup = ramp;
        let rampdown = ramp;
        let run = n - ramp * 2;
        if (run < 0) {
            rampup = Math.floor(n / 2);
            run = 0;
            rampdown = n - rampup;
        }

        // Generate motor command
        const runcmd = getRunValues(run);
        return [
            command,
            BTCommand.LAYER,
            port,
            BTCommand.NUM8,
            dir & 0xff,
            BTCommand.NUM8,
            rampup
        ].concat(runcmd.concat([
            BTCommand.NUM8,
            rampdown,
            BTCommand.BRAKE
        ]));
    }

    _onSessionConnect () {
        log.info('bt device connected!');
        this.connected = true;
        // start reading data?
    }

}

class Scratch3Ev3Blocks {

    /**
     * The ID of the extension.
     * @return {string} the id
     */
    static get EXTENSION_ID () {
        return 'ev3';
    }

    /**
     * Creates a new instance of the EV3 extension.
     * @param  {object} runtime VM runtime
     * @constructor
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        // Create a new MicroBit device instance
        this._device = new EV3(this.runtime, Scratch3Ev3Blocks.EXTENSION_ID);
    }

    /**
     * Define the EV3 extension.
     * @return {object} Extension description.
     */
    getInfo () {
        return {
            id: Scratch3Ev3Blocks.EXTENSION_ID,
            name: 'LEGO MINDSTORMS EV3',
            iconURI: null,
            blocks: [
                {
                    opcode: 'motorTurnClockwise',
                    text: '[PORT] turn clockwise [TIME] seconds',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'motorPorts',
                            defaultValue: MOTOR_PORTS[0].value
                        },
                        TIME: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'motorTurnCounterClockwise',
                    text: '[PORT] turn counter [TIME] seconds',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'motorPorts',
                            defaultValue: MOTOR_PORTS[0].value
                        },
                        TIME: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'beep',
                    text: 'beep',
                    blockType: BlockType.COMMAND
                }
            ],
            menus: {
                motorPorts: this._buildMenu(MOTOR_PORTS)
            }
        };
    }

    /**
     * Create data for a menu in scratch-blocks format, consisting of an array of objects with text and
     * value properties. The text is a translated string, and the value is one-indexed.
     * @param  {object[]} info - An array of info objects each having a name property.
     * @return {array} - An array of objects with text and value properties.
     * @private
     */
    _buildMenu (info) {
        return info.map((entry, index) => {
            const obj = {};
            obj.text = entry.name;
            obj.value = String(index + 1);
            return obj;
        });
    }

    motorTurnClockwise (args) {
        // Validate arguments
        const port = Cast.toNumber(args.PORT);
        const time = Cast.toNumber(args.TIME) * 1000;

        this._device.motorTurnClockwise(port, time);
    }

    motorTurnCounterClockwise (args) {
        // Validate arguments
        const port = Cast.toNumber(args.PORT);
        const time = Cast.toNumber(args.TIME) * 1000;

        this._device.motorTurnCounterClockwise(port, time);
    }

    beep () {
        return this._device.beep();
    }
}

module.exports = Scratch3Ev3Blocks;
