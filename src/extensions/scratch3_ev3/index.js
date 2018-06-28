const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const log = require('../../util/log');
const Base64Util = require('../../util/base64-util');
const BTSession = require('../../io/BTSession');

// TODO: Refactor/rename all these high level primitives to be clearer/match

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
const SENSOR_PORTS = [
    {
        name: '1',
        value: 1
    },
    {
        name: '2',
        value: 2
    },
    {
        name: '3',
        value: 3
    },
    {
        name: '4',
        value: 4
    }
];

// firmware pdf page 100
const EV_DEVICE_TYPES = {
    29: 'color',
    30: 'ultrasonic',
    32: 'gyro',
    16: 'touch',
    8: 'mediumMotor',
    7: 'largeMotor',
    126: 'none'
};

// firmware pdf page 100?
const EV_DEVICE_MODES = {
    touch: 0,
    color: 1,
    ultrasonic: 1
};

const EV_DEVICE_LABELS = {
    touch: 'button',
    color: 'brightness',
    ultrasonic: 'distance'
};


class EV3 {

    constructor (runtime, extensionId) {

        /**
         * The Scratch 3.0 runtime used to trigger the green flag button.
         * @type {Runtime}
         * @private
         */
        this._runtime = runtime;

        /**
         * EV3 State
         */
        this.connected = false;
        this.speed = 50;
        this._sensors = {
            distance: 0,
            brightness: 0
        };
        this._sensorPorts = [];
        this._motorPorts = [];
        this._sensorPortsWaiting = [false, false, false, false];
        this._motorPortsWaiting = [false, false, false, false];
        this._pollingIntervalID = null;

        /**
         * The Bluetooth connection session for reading/writing device data.
         * @type {BTSession}
         * @private
         */
        this._bt = null;
        this._runtime.registerExtensionDevice(extensionId, this);
    }

    // TODO: keep here?
    /**
     * Called by the runtime when user wants to scan for a device.
     */
    startDeviceScan () {
        this._bt = new BTSession(this._runtime, {
            majorDeviceClass: 8,
            minorDeviceClass: 1
        }, this._onSessionConnect.bind(this), this._onSessionMessage.bind(this));
    }

    // TODO: keep here?
    /**
     * Called by the runtime when user wants to connect to a certain device.
     * @param {number} id - the id of the device to connect to.
     */
    connectDevice (id) {
        this._bt.connectDevice(id);
    }

    // TODO: keep here?
    /**
     * Called by the runtime when user wants to disconnect from the device.
     */
    disconnectSession () {
        this._bt.disconnectSession();
        window.clearInterval(this._pollingIntervalID); // TODO: window?
        this._sensorPorts = [];
        this._motorPorts = [];
    }

    /**
     * Called by the runtime to detect whether the device is connected.
     * @return {boolean} - the connected state.
     */
    getPeripheralIsConnected () {
        let connected = false;
        if (this._bt) {
            connected = this._bt.getPeripheralIsConnected();
        }
        return connected;
    }

    get distance () {
        if (!this.connected) return;

        // https://shop.lego.com/en-US/EV3-Ultrasonic-Sensor-45504
        // Measures distances between one and 250 cm (one to 100 in.)
        // Accurate to +/- 1 cm (+/- .394 in.)
        let value = this._sensors.distance > 100 ? 100 : this._sensors.distance;
        value = value < 0 ? 0 : value;

        return Math.round(value);
    }

    get brightness () {
        if (!this.connected) return;

        return this._sensors.brightness;
    }

    getMotorPosition (args) {
        if (!this.connected) return;

        // TODO: read motor position data
        log.info(`return motor ${args} position`);
    }

    isButtonPressed (args) {
        if (!this.connected) return;

        return this._sensors.button;
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

    motorRotate (port, degrees) {
        if (!this.connected) return;

        // TODO: Build up motor command
        log.info(`motor rotate port: ${port} and degrees: ${degrees}`);
    }

    motorSetPosition (port, degrees) {
        if (!this.connected) return;

        // TODO: Build up motor command
        log.info(`motor set position port: ${port} and degrees: ${degrees}`);
    }

    motorSetPower (port, power) {
        if (!this.connected) return;

        // TODO: Build up motor command
        log.info(`motor set power port: ${port} and degrees: ${power}`);
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
        let run = n - (ramp * 2);
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
        this.connected = true;

        // GET EV3 SENSOR LIST
        /*
        0B [ 11]
        00 [  0]
        01 [  1]
        00 [  0]
        00 [  0]
        21 [ 33]
        00 [  0]
        98 [152] opInput_Device_List
        81 [129] LENGTH
        21 [ 33] ARRAY
        60 [ 96] CHANGED
        E1 [225] size of global var?
        20 [ 32] global var index
        */
        this._bt.sendMessage({
            message: 'CwABAAAhAJiBIWDhIA==', // [11, 0, 1, 0, 0, 33, 0, 152, 129, 33, 96, 225, 32]
            encoding: 'base64'
        }).then(
            x => {
                log.info(`get device list resolved: ${x}`);
            },
            e => {
                log.info(`get device list rejected: ${e}`);
            }
        );
    }

    _getSessionData () {
        if (!this.connected) {
            window.clearInterval(this._pollingIntervalID);
            return;
        }

        // GET EV3 DISTANCE PORT 0
        /*
        99 [153] input device
        1D [ 29] ready si
        00 [  0] layer (this brick)
        00 [  0] sensor port 0
        00 [  0] do not change type
        01 [  1] mode 1 = EV3-Ultrasonic-Inch
        01 [  1] one data set
        60 [ 96] global var index
        */
        /*
        this._bt.sendMessage({
            message: 'DQAAAAAEAJkdAAAAAQFg', // [13, 0, 0, 0, 0, 4, 0, 153, 29, 0, 0, 0, 1, 1, 96]
            encoding: 'base64'
        });
        */

        // GET EV3 BRIGHTNESS PORT 1
        /*
        0x99 [153] input device
        0x1D [ 29] ready si
        0x00 [  0] layer (this brick)
        0x01 [  1] sensor port 1
        0x00 [  0] do not change type
        0x01 [  1] mode 1 = EV3-Color-Ambient
        0x01 [  1] one data set
        0x60 [ 96] global var index
        */
        /*
        this._bt.sendMessage({
            message: 'DQAAAAAEAJkdAAEAAQFg', // [13, 0, 0, 0, 0, 4, 0, 153, 29, 0, 1, 0, 1, 1, 96]
            encoding: 'base64'
        });
        */


        // COMPOUND COMMAND FOR READING sensors0x27   command size
        // 0x??  [    ]   command size
        // 0x00  [   0]   command size
        // 0x01  [   1]   message counter
        // 0x00  [   0]   message counter
        // 0x00  [   0]   command type
        // 0x??  [    ]   result payload size of global/local vars
        // 0x00  [   0]   result payload size of global/local vars
        const compoundCommand = [];
        compoundCommand[0] = 0; // calculate length later
        compoundCommand[1] = 0; // command size
        compoundCommand[2] = 1; // message counter // TODO: ?????
        compoundCommand[3] = 0; // message counter
        compoundCommand[4] = 0; // command type: direct command
        compoundCommand[5] = 0; // global/local vars
        compoundCommand[6] = 0; // global/local vars
        let compoundCommandIndex = 7;
        let sensorCount = -1;

        // Read from available sensors
        for (let i = 0; i < this._sensorPorts.length; i++) {
            if (this._sensorPorts[i] !== 'none') {
                sensorCount++;
                // make up sensor command array
                // 0x9D  [ 157]   op: get sensor value
                // 0x00  [   0]   layer
                // 0x02  [    ]   port
                // 0x00  [   0]   do not change type
                // 0x00  [    ]   mode
                // 0xE1  [ 225]
                // 0x0C  [    ]   global index
                compoundCommand[compoundCommandIndex + 0] = 157;
                compoundCommand[compoundCommandIndex + 1] = 0;
                compoundCommand[compoundCommandIndex + 2] = i;
                compoundCommand[compoundCommandIndex + 3] = 0;
                compoundCommand[compoundCommandIndex + 4] = EV_DEVICE_MODES[this._sensorPorts[i]];
                compoundCommand[compoundCommandIndex + 5] = 225;
                compoundCommand[compoundCommandIndex + 6] = sensorCount * 4;
                compoundCommandIndex += 7;
            }
        }
        // Read from available motors
        // let motorCount = 0;
        for (let i = 0; i < this._motorPorts.length; i++) {
            if (this._motorPorts[i] !== 'none') {
                sensorCount++;
                // make up sensor command array
                // 0xB3  [ 179]   op: get motor position value
                // 0x00  [   0]   layer
                // 0x02  [    ]   output bit fields ??
                // 0xE1  [ 225]
                // 0x??  [   0]   global index
                compoundCommand[compoundCommandIndex + 0] = 179;
                compoundCommand[compoundCommandIndex + 1] = 0;
                compoundCommand[compoundCommandIndex + 2] = i;
                compoundCommand[compoundCommandIndex + 3] = 225;
                compoundCommand[compoundCommandIndex + 4] = sensorCount * 4;
                compoundCommandIndex += 5;
                // motorCount++;
            }
        }


        // Calculate compound command length
        compoundCommand[0] = compoundCommand.length - 2;
        // Calculate global var payload length needed
        compoundCommand[5] = (sensorCount + 1) * 4;
        // console.log('compound command to send: ' + compoundCommand);
        this._bt.sendMessage({
            message: Base64Util.uint8ArrayToBase64(compoundCommand),
            encoding: 'base64'
        });

        // TODO: Read from available motor ports
    }

    _onSessionMessage (params) {
        const message = params.message;
        const array = Base64Util.base64ToUint8Array(message);

        if (this._sensorPorts.length === 0) {
            // SENSOR LIST
            // JAABAAIefn5+fn5+fn5+fn5+fn5+Bwd+fn5+fn5+fn5+fn5+fgA=
            // [36, 0, 1, 0, 2, 30, 126, 126, 126, 126, 126, 126, 126, 126, 126, 126, 126, 126, 126, 126, 126, 7, 7, 126, 126, 126, 126, 126, 126, 126, 126, 126, 126, 126, 126, 126, 126, 0]
            log.info(`device array: ${array}`);
            this._sensorPorts[0] = EV_DEVICE_TYPES[array[5]];
            this._sensorPorts[1] = EV_DEVICE_TYPES[array[6]];
            this._sensorPorts[2] = EV_DEVICE_TYPES[array[7]];
            this._sensorPorts[3] = EV_DEVICE_TYPES[array[8]];
            this._motorPorts[0] = EV_DEVICE_TYPES[array[21]];
            this._motorPorts[1] = EV_DEVICE_TYPES[array[22]];
            this._motorPorts[2] = EV_DEVICE_TYPES[array[23]];
            this._motorPorts[3] = EV_DEVICE_TYPES[array[24]];
            log.info(`sensor ports: ${this._sensorPorts}`);
            log.info(`motor ports: ${this._motorPorts}`);

            // Now ready to read from assigned _sensors
            // Start reading sensor data
            // TODO: window?
            this._pollingIntervalID = window.setInterval(this._getSessionData.bind(this), 100);
        } else {
            //log.info(`received compound command result: ${array}`);
            let offset = 5;
            for (let i = 0; i < this._sensorPorts.length; i++) {
                if (this._sensorPorts[i] !== 'none') {
                    const value = this._array2float([
                        array[offset],
                        array[offset + 1],
                        array[offset + 2],
                        array[offset + 3]
                    ]);
                    log.info(`sensor at port ${i} ${this._sensorPorts[i]} value: ${value}`);
                    this._sensors[EV_DEVICE_LABELS[this._sensorPorts[i]]] = value;
                    offset += 4;
                }
            }
            for (let i = 0; i < this._motorPorts.length; i++) {
                if (this._motorPorts[i] !== 'none') {
                    let value = this._tachoValue([
                        array[offset],
                        array[offset + 1],
                        array[offset + 2],
                        array[offset + 3]
                    ]);
                    if (value > 0x7fffffff) {
                        value = value - 0x100000000;
                    }
                    log.info(`motor at port ${i} ${this._motorPorts[i]} value: ${value}`);
                    // this._motors[EV_DEVICE_LABELS[this._motorPorts[i]]] = value;
                    offset += 4;
                }
            }
            // const sensorValue = this._array2float([array[5], array[6], array[7], array[8]]);
            // log.info('receiving port array?: ' + array);
            // log.info('receiving port sensorValue?: ' + sensorValue);
            // this._sensors.distance = distance;
        }

    }

    _tachoValue (list) {
        const value = list[0] + (list[1] * 256) + (list[2] * 256 * 256) + (list[3] * 256 * 256 * 256);
        return value;
    }

    // TODO: put elsewhere
    _array2float (list) {
        const buffer = new Uint8Array(list).buffer;
        const view = new DataView(buffer);
        return view.getFloat32(0, true);
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

        // Create a new EV3 device instance
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
            showStatusButton: true,
            blocks: [
                {
                    opcode: 'motorTurnClockwise',
                    text: 'motor [PORT] turn clockwise for [TIME] seconds',
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
                    text: 'motor [PORT] turn counter for [TIME] seconds',
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
                    opcode: 'motorRotate',
                    text: 'motor [PORT] rotate [DEGREES] degrees',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'motorPorts',
                            defaultValue: MOTOR_PORTS[0].value
                        },
                        DEGREES: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 90
                        }
                    }
                },
                {
                    opcode: 'motorSetPosition',
                    text: 'motor [PORT] set position [DEGREES] degrees',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'motorPorts',
                            defaultValue: MOTOR_PORTS[0].value
                        },
                        DEGREES: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 90
                        }
                    }
                },
                {
                    opcode: 'motorSetPower',
                    text: 'motor [PORT] set power [POWER] %',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'motorPorts',
                            defaultValue: MOTOR_PORTS[0].value
                        },
                        POWER: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 50
                        }
                    }
                },
                {
                    opcode: 'getMotorPosition',
                    text: 'motor [PORT] position',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'motorPorts',
                            defaultValue: MOTOR_PORTS[0].value
                        }
                    }
                },
                {
                    opcode: 'whenButtonPressed',
                    text: 'when button [PORT] pressed',
                    blockType: BlockType.HAT,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'sensorPorts',
                            defaultValue: SENSOR_PORTS[0].value
                        }
                    }
                },
                {
                    opcode: 'whenDistanceLessThan',
                    text: 'when distance < [DISTANCE]',
                    blockType: BlockType.HAT,
                    arguments: {
                        DISTANCE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 5
                        }
                    }
                },
                {
                    opcode: 'whenBrightnessLessThan',
                    text: 'when brightness < [DISTANCE]',
                    blockType: BlockType.HAT,
                    arguments: {
                        DISTANCE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 50
                        }
                    }
                },
                {
                    opcode: 'buttonPressed',
                    text: 'button [PORT] pressed?',
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'sensorPorts',
                            defaultValue: SENSOR_PORTS[0].value
                        }
                    }
                },
                {
                    opcode: 'getDistance',
                    text: 'distance',
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'getBrightness',
                    text: 'brightness',
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'beep',
                    text: 'beep',
                    blockType: BlockType.COMMAND
                }
            ],
            menus: {
                motorPorts: this._buildMenu(MOTOR_PORTS),
                sensorPorts: this._buildMenu(SENSOR_PORTS)
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
        const port = Cast.toNumber(args.PORT);
        const time = Cast.toNumber(args.TIME) * 1000;

        this._device.motorTurnClockwise(port, time);
        return;
    }

    motorTurnCounterClockwise (args) {
        const port = Cast.toNumber(args.PORT);
        const time = Cast.toNumber(args.TIME) * 1000;

        this._device.motorTurnCounterClockwise(port, time);
        return;
    }

    motorRotate (args) {
        const port = Cast.toNumber(args.PORT);
        const degrees = Cast.toNumber(args.DEGREES);

        this._device.motorRotate(port, degrees);
        return;
    }

    motorSetPosition (args) {
        const port = Cast.toNumber(args.PORT);
        const degrees = Cast.toNumber(args.DEGREES);

        this._device.motorSetPosition(port, degrees);
        return;
    }

    motorSetPower (args) {
        const port = Cast.toNumber(args.PORT);
        const power = Cast.toNumber(args.POWER);

        this._device.motorSetPower(port, power);
        return;
    }

    getMotorPosition (args) {
        const port = Cast.toNumber(args.PORT);

        return this._device.getMotorPosition(port);
    }

    whenButtonPressed (args) {
        const port = Cast.toNumber(args.PORT);

        return this._device.isButtonPressed(port);
    }

    whenDistanceLessThan (args) {
        const distance = Cast.toNumber(args.DISTANCE);

        return this._device.distance < distance;
    }

    whenBrightnessLessThan (args) {
        const brightness = Cast.toNumber(args.DISTANCE);

        return this._device.brightness < brightness;
    }

    buttonPressed (args) {
        const port = Cast.toNumber(args.PORT);

        return this._device.isButtonPressed(port);
    }

    getDistance () {
        return this._device.distance;
    }

    getBrightness () {
        return this._device.brightness;
    }

    beep () {
        return this._device.beep();
    }
}

module.exports = Scratch3Ev3Blocks;
