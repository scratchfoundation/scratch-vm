const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
// const log = require('../../util/log');
// const cast = require('../../util/cast');
const formatMessage = require('format-message');
const BLE = require('../../io/ble');
const Base64Util = require('../../util/base64-util');
const GdxCommands = require('./gdx-commands');
//const ScratchLinkProxy = require('./scratch-link-proxy');
const createDevice = require('@vernier/godirect/src/godirect').default.createDevice;

/**
 * Icon png to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/png;base64,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';

/**
 * Enum for GDX-FOR protocol.
 * @readonly
 * @enum {string}
 */
const BLEUUID = {
    service: 'd91714ef-28b9-4f91-ba16-f0d9a604f112',
    txChar: 'f4bf14a6-c7d5-4b6d-8aa8-df1a7c83adcb',
    rxChar: 'b41e6675-a329-40e0-aa01-44d2f444babe'
};

const BLETimeout = 4500;

/**
 * Manage communication with a GDX-FOR peripheral over a Scratch Link client socket.
 */
class GdxFor {

    /**
     * Construct a GDX-FOR communication object.
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
         * The BluetoothLowEnergy connection socket for reading/writing peripheral data.
         * @type {BLE}
         * @private
         */
        this._ble = null;
        this._runtime.registerPeripheralExtension(extensionId, this);

        /**
         * The id of the extension this peripheral belongs to.
         */
        this._extensionId = extensionId;

        /**
         * The most recently received value for each sensor.
         * @type {Object.<string, number>}
         * @private
         */
        this._sensors = {
			force: 0,
			accelerationX: 0,
			accelerationY: 0,
			accelerationX: 0,
			angularVelocityX: 0,
			angularVelocityY: 0,
			angularVelocityX: 0,
        };

        /**
         * Interval ID for data reading timeout.
         * @type {number}
         * @private
         */
        this._timeoutID = null;

        /**
         * A flag that is true while we are busy sending data to the BLE socket.
         * @type {boolean}
         * @private
         */
        this._busy = false;

        /**
         * ID for a timeout which is used to clear the busy flag if it has been
         * true for a long time.
         */
        this._busyTimeoutID = null;

        this.disconnect = this.disconnect.bind(this);
        this._onConnect = this._onConnect.bind(this);
        this._onMessage = this._onMessage.bind(this);

        this._connected = false;
    }


    /**
     * Called by the runtime when user wants to scan for a peripheral.
     */
    scan () {
        if (this._ble) {
            this._ble.close();
            // this._ble.disconnect(); //scratch-link
        }

        console.log("Requesting Device");
        navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: 'GDX' }],
            optionalServices: ['d91714ef-28b9-4f91-ba16-f0d9a604f112']
        }).then((bleWbtDevice) => {
            console.log("Got device: ", bleWbtDevice);
            return createDevice(bleWbtDevice, {open: false});
        }).then((device) => {
            console.log("Created BLE object: ", device);
            this._ble = device;
            this._ble.open(false); // should emit a "device-opened" event when opened
            this._ble.on('device-opened', this._onConnect);
            this._ble.on('device-closed', this._onClose);
        }).catch((error) => {
            console.log(error);
        });


        // scratch-link
        // this._ble = new BLE(this._runtime, this._extensionId, {
        //     filters: [
        //         { namePrefix: 'GDX' }
        //     ],
        //     optionalServices: [
        //         BLEUUID.service
        //     ]
        // }, this._onConnect);
    }

    /**
     * Called by the runtime when user wants to connect to a certain peripheral.
     * @param {number} id - the id of the peripheral to connect to.
     */
    connect (id) {
        if (this._ble) {
            this._ble.connectPeripheral(id);
        }
    }

    /**
     * Called by the runtime when a use exits the connection popup.
     * Disconnect from the micro:bit.
     */
    disconnect () {
        // TODO: This funciton is called when you exist the connection popup.
        // When using Web Bluetooth, we don't use the connection popup.
        // When switching over from web bluetooth, make sure to figure out to handle
        // this disconnection.
        window.clearInterval(this._timeoutID);
        if (this._ble) {
            //this._ble.disconnect();
        }
    }

    /**
     * Return true if connected to the micro:bit.
     * @return {boolean} - whether the micro:bit is connected.
     */
    isConnected () {
        let connected = false;
        if (this._ble) {
            connected = this._connected; //this._ble.isConnected();
        }
        console.log("Is connected: ", connected);
        return connected;
    }

    /**
     * Send a message to the peripheral BLE socket.
     * @param {number} command - the BLE command hex.
     * @param {Uint8Array} message - the message to write
     */
    send (command, message) {
        if (!this.isConnected()) return;

        debugger;

        const output = new Uint8Array(message.length + 1);
        output[0] = command; // attach command to beginning of message
        for (let i = 0; i < message.length; i++) {
            output[i + 1] = message[i];
        }
        //const output = [0x58, 0x19, 0xfe, 0x3f, 0x1a, 0xa5, 0x4a, 0x06, 0x49, 0x07, 0x48, 0x08, 0x47, 0x09, 0x46, 0x0a, 0x45, 0x0b, 0x44, 0x0c, 0x43, 0x0d, 0x42, 0x0e, 0x41];

        //const output = new Uint8Array([0x58, 0x19, 0xfe, 0x3f, 0x1a, 0xa5, 0x4a, 0x06, 0x49, 0x07, 0x48, 0x08, 0x47, 0x09, 0x46, 0x0a, 0x45, 0x0b, 0x44, 0x0c, 0x43, 0x0d, 0x42, 0x0e, 0x41]);
        console.log(output);

        const data = Base64Util.uint8ArrayToBase64(output);
        console.log(data);
        // WBn+PxqlSgZJB0gIRwlGCkULRAxDDUIOQQ==

        this._ble.write(BLEUUID.service, BLEUUID.txChar, data, 'base64', true).then(
            () => {
                this._busy = false;
            }
        );
    }

    /**
     * Starts reading data from peripheral after BLE has connected to it.
     * @private
     */
    _onConnect () {
		console.log("CONNNECTED");
        this._connected = true;

        this._ble.sensors.forEach(sensor => {
            sensor.setEnabled(true);

            // do some calculations?
            sensor.on('value-changed', (sensor) => {

                // We don't need this list, essentially.
                if (sensor.values.length > 1000) {
                    sensor.clear();
                }
            });

        });
        this._ble.start();  // Can set period here.
        //this.send(GdxCommands.INIT, '');

        //this._ble.read(BLEUUID.service, BLEUUID.rxChar, true, this._onMessage);

        //this._timeoutID = window.setInterval(this.disconnect, BLETimeout);
    }

    getForce () {
        return this._ble.getSensor(1).value;
    }

    _onClose () {
        this._connected = false;
    }

    /**
     * Process the sensor data from the incoming BLE characteristic.
     * @param {object} base64 - the incoming BLE data.
     * @private
     */
    _onMessage (base64) {
        console.log("In _onMessage");
        // parse data
        const data = Base64Util.base64ToUint8Array(base64);
		console.log("data: ", data);

        // this._sensors.tiltX = data[1] | (data[0] << 8);
        // if (this._sensors.tiltX > (1 << 15)) this._sensors.tiltX -= (1 << 16);
        // this._sensors.tiltY = data[3] | (data[2] << 8);
        // if (this._sensors.tiltY > (1 << 15)) this._sensors.tiltY -= (1 << 16);

        // this._sensors.buttonA = data[4];
        // this._sensors.buttonB = data[5];

        // this._sensors.touchPins[0] = data[6];
        // this._sensors.touchPins[1] = data[7];
        // this._sensors.touchPins[2] = data[8];

        // this._sensors.gestureState = data[9];

        // // cancel disconnect timeout and start a new one
        // window.clearInterval(this._timeoutID);
        // this._timeoutID = window.setInterval(this.disconnect, BLETimeout);
    }

}


const CompareOptionsMenu = ['>', '<', '='];

const DirectionOptionsMenu = ['x', 'y', 'z'];


/**
 * Scratch 3.0 blocks to interact with a GDX-FOR peripheral.
 */
class Scratch3GdxForBlocks {

    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME () {
        return 'GDX-FOR';
    }

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return 'gdxfor';
    }

    /**
     * Construct a set of GDX-FOR blocks.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

		// Create a new GdxFor peripheral instance
        this._peripheral = new GdxFor(this.runtime, Scratch3GdxForBlocks.EXTENSION_ID);
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: Scratch3GdxForBlocks.EXTENSION_ID,
            name: Scratch3GdxForBlocks.EXTENSION_NAME,
            blockIconURI: blockIconURI,
            showStatusButton: true,
            blocks: [
                {
                    opcode: 'whenAccelerationCompare',
                    text: formatMessage({
                        id: 'gdxfor.whenAccelerationCompare',
                        default: 'when acceleration [DIRECTION] [COMPARE] [VALUE] m/s\u{00B2}',
                        description: 'when the value measured by the acceleration sensor is compared to some value'
                    }),
                    blockType: BlockType.HAT,
                    arguments: {
                        DIRECTION: {
                            type: ArgumentType.STRING,
                            menu: 'directionOptions',
                            defaultValue: 0
                        },
                        COMPARE: {
                            type: ArgumentType.STRING,
                            menu: 'compareOptions',
                            defaultValue: 0
                        },
                        VALUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 5
                        }
                    }
                },
                {
                    opcode: 'whenAngularSpeedCompare',
                    text: formatMessage({
                        id: 'gdxfor.whenAngularSpeedCompare',
                        default: 'when angular speed [DIRECTION] [COMPARE] [VALUE] rad/s',
                        description: 'when the value measured by the gyroscope sensor is compared to some value'
                    }),
                    blockType: BlockType.HAT,
                    arguments: {
                        DIRECTION: {
                            type: ArgumentType.STRING,
                            menu: 'directionOptions',
                            defaultValue: 0
                        },
                        COMPARE: {
                            type: ArgumentType.STRING,
                            menu: 'compareOptions',
                            defaultValue: 0
                        },
                        VALUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 5
                        }
                    }
                },
                {
                    opcode: 'whenForceCompare',
                    text: formatMessage({
                        id: 'gdxfor.whenForceCompare',
                        default: 'when force [COMPARE] [VALUE] N',
                        description: 'when the value measured by the force sensor is compared to some value'
                    }),
                    blockType: BlockType.HAT,
                    arguments: {
                        COMPARE: {
                            type: ArgumentType.STRING,
                            menu: 'compareOptions',
                            defaultValue: 0
                        },
                        VALUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 5
                        }
                    }
                },
                {
                    opcode: 'getAcceleration',
                    text: formatMessage({
                        id: 'gdxfor.getAcceleration',
                        default: 'acceleration [DIRECTION]',
                        description: 'gets acceleration'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        DIRECTION: {
                            type: ArgumentType.STRING,
                            menu: 'directionOptions',
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: 'getAngularSpeed',
                    text: formatMessage({
                        id: 'gdxfor.getAngularSpeed',
                        default: 'angular speed [DIRECTION]',
                        description: 'gets tilt'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        DIRECTION: {
                            type: ArgumentType.STRING,
                            menu: 'directionOptions',
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: 'getForce',
                    text: formatMessage({
                        id: 'gdxfor.getForce',
                        default: 'force',
                        description: 'gets force'
                    }),
                    blockType: BlockType.REPORTER
                }
            ],
            menus: {
                directionOptions: this._formatMenu(DirectionOptionsMenu),
                compareOptions: this._formatMenu(CompareOptionsMenu)
            }
        };
    }

    whenAccelerationCompare () {
        return Promise.resolve();
    }
    whenAngularSpeedCompare () {
        return Promise.resolve();
    }
    whenForceCompare () {
        return Promise.resolve();
    }
    getAcceleration () {
        return Promise.resolve();
    }
    getAngularSpeed () {
        return Promise.resolve();
    }
    getForce () {
        return this._peripheral.getForce();
    }

    /**
     * Formats menus into a format suitable for block menus, and loading previously
     * saved projects:
     * [
     *   {
     *    text: label,
     *    value: index
     *   },
     *   {
     *    text: label,
     *    value: index
     *   },
     *   etc...
     * ]
     *
     * @param {array} menu - a menu to format.
     * @return {object} - a formatted menu as an object.
     * @private
     */
    _formatMenu (menu) {
        const m = [];
        for (let i = 0; i < menu.length; i++) {
            const obj = {};
            obj.text = menu[i];
            obj.value = i.toString();
            m.push(obj);
        }
        return m;
    }
}

module.exports = Scratch3GdxForBlocks;
