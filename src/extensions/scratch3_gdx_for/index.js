const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const log = require('../../util/log');
const Cast = require('../../util/cast');
const formatMessage = require('format-message');
const BLE = require('../../io/ble');
const godirect = require('@vernier/godirect/dist/godirect.min.umd.js');
const ScratchLinkDeviceAdapter = require('./scratch-link-device-adapter');

/**
 * Icon png to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/png;base64,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';

/**
 * Enum for Vernier godirect protocol.
 * @readonly
 * @enum {string}
 */
const BLEUUID = {
    service: 'd91714ef-28b9-4f91-ba16-f0d9a604f112',
    commandChar: 'f4bf14a6-c7d5-4b6d-8aa8-df1a7c83adcb',
    responseChar: 'b41e6675-a329-40e0-aa01-44d2f444babe'
};

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
        this._scratchLinkSocket = null;

        /**
         * A godirect device
         * @type {@vernier/goDirect device}
         * @private
         */
        this._device = null;

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
            accelerationZ: 0,
            angularVelocityX: 0,
            angularVelocityY: 0,
            angularVelocityZ: 0
        };

        this.disconnect = this.disconnect.bind(this);
        this._onConnect = this._onConnect.bind(this);
    }


    /**
     * Called by the runtime when user wants to scan for a peripheral.
     */
    scan () {
        if (this._device) {
            this._device.close();
        }

        this._scratchLinkSocket = new BLE(this._runtime, this._extensionId, {
            filters: [
                {namePrefix: 'GDX-FOR'}
            ],
            optionalServices: [
                BLEUUID.service
            ]
        }, this._onConnect);
    }

    /**
     * Called by the runtime when user wants to connect to a certain peripheral.
     * @param {number} id - the id of the peripheral to connect to.
     */
    connect (id) {
        if (this._scratchLinkSocket) {
            this._scratchLinkSocket.connectPeripheral(id);
        }
    }

    /**
     * Called by the runtime when a use exits the connection popup.
     * Disconnect from the GDX FOR.
     */
    disconnect () {
        if (this._device) {
            this._device.close();
        }
    }

    /**
     * Return true if connected to the goforce device.
     * @return {boolean} - whether the goforce is connected.
     */
    isConnected () {
        let connected = false;
        if (this._scratchLinkSocket) {
            connected = this._scratchLinkSocket.isConnected();
        }
        return connected;
    }

    /**
     * Starts reading data from peripheral after BLE has connected to it.
     * @private
     */
    _onConnect () {
        const adapter = new ScratchLinkDeviceAdapter(this._scratchLinkSocket);
        godirect.createDevice(adapter, {open: true, startMeasurements: false}).then(device => {
            this._device = device;
            this._startMeasurements();
        });
    }

    /**
     * Enable and begin reading measurements
     * @private
     */
    _startMeasurements () {
        this._device.sensors.forEach(sensor => {
            sensor.setEnabled(true);
            sensor.on('value-changed', changedSensor => {
                if (changedSensor.values.length > 1000) {
                    changedSensor.clear();
                }
            });
        });
        this._device.start(); // Can set period here if needed.
    }


    getForce () {
        if (this.isConnected()) {
            let force = this._device.getSensor(1).value;
            // Normalize the force, which can be measured between -50 and 50 N,
            // to be a value between -100 and 100.
            force = force * 2;
            if (force > 100) {
                return 100;
            }
            if (force < -100) {
                return -100;
            }
            return force;
        }
        return 0;
    }

    getTiltX () {
        if (this.isConnected()) {
            let x = this.getAccelerationX();
            let y = this.getAccelerationY();
            let z = this.getAccelerationZ();

	        let x_sign = 1;
	        let y_sign = 1;
	        let z_sign = 1;

	        if (x < 0.0) { x *= -1.0; x_sign = -1; }
	        if (y < 0.0) { y *= -1.0; y_sign = -1; }
	        if (z < 0.0) { z *= -1.0; z_sign = -1; }

	        // Compute the yz unit vector
	        let z2 = z * z;
	        let y2 = y * y;
	        let value = z2 + y2;
	        value = Math.sqrt(value);

	        // For sufficiently small zy vector values we are essentially at 90 degrees.
	        // The following snaps to 90 and avoids divide-by-zero errors.
	        // The snap factor was derived through observation -- just enough to
	        // still allow single degree steps up to 90 (..., 87, 88, 89, 90).
	        if (value < 0.35)
	        {
		        value = 90;
	        }
	        else
	        {
		        // Compute the x-axis angle
		        value = x / value;
		        value = Math.atan(value);
		        value *= 57.2957795; // convert from rad to deg
	        }
	        // Manage the sign of the result
	        let yz_sign = y_sign;
	        if (z > y) yz_sign = z_sign;
	        if (yz_sign == -1) value = 180.0 - value;
	        value *= x_sign;
	        // Round the result to the nearest degree
	        value += 0.5;
            return value;
        }
        return 0;
    }

    getTiltY () {
        if (this.isConnected()) {
            let x = this.getAccelerationX();
            let y = this.getAccelerationY();
            let z = this.getAccelerationZ();

	        let x_sign = 1;
	        let y_sign = 1;
	        let z_sign = 1;

	        if (x < 0.0) { x *= -1.0; x_sign = -1; }
	        if (y < 0.0) { y *= -1.0; y_sign = -1; }
	        if (z < 0.0) { z *= -1.0; z_sign = -1; }

	        // Compute the yz unit vector
	        let z2 = z * z;
	        let x2 = x * x;
	        let value = z2 + x2;
	        value = Math.sqrt(value);

	        // For sufficiently small zy vector values we are essentially at 90 degrees.
	        // The following snaps to 90 and avoids divide-by-zero errors.
	        // The snap factor was derived through observation -- just enough to
	        // still allow single degree steps up to 90 (..., 87, 88, 89, 90).
	        if (value < 0.35)
	        {
		        value = 90;
	        }
	        else
	        {
		        // Compute the x-axis angle
		        value = y / value;
		        value = Math.atan(value);
		        value *= 57.2957795; // convert from rad to deg
	        }
	        // Manage the sign of the result
	        let xz_sign = x_sign;
	        if (z > x) xz_sign = z_sign;
	        if (xz_sign == -1) value = 180.0 - value;
	        value *= y_sign;
	        // Round the result to the nearest degree
	        value += 0.5;
            return value;
        }
        return 0;
    }


    getAccelerationX () {
        if (this.isConnected()) {
            return this._device.getSensor(2).value;
        }
        return 0;
    }

    getAccelerationY () {
        if (this.isConnected()) {
            return this._device.getSensor(3).value;
        }
        return 0;
    }

    getAccelerationZ () {
        if (this.isConnected()) {
            return this._device.getSensor(4).value;
        }
        return 0;
    }

    getSpinSpeedX () {
        if (this.isConnected()) {
            return this._device.getSensor(5).value * (180 / Math.PI);
        }
        return 0;
    }

    getSpinSpeedY () {
        if (this.isConnected()) {
            return this._device.getSensor(6).value * (180 / Math.PI);
        }
        return 0;
    }

    getSpinSpeedZ () {
        if (this.isConnected()) {
            return this._device.getSensor(7).value * (180 / Math.PI);
        }
        return 0;
    }
}

/**
 * Enum for comparison operations.
 * @readonly
 * @enum {string}
 */
const ComparisonOptions = {
    LESS_THAN: 'less_than',
    GREATER_THAN: 'greater_than'
};

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

    get DIRECTIONS_MENU () {
        return [
            {
                text: 'x',
                value: 'x'
            },
            {
                text: 'y',
                value: 'y'
            },
            {
                text: 'z',
                value: 'z'
            }
        ];
    }

    get TILT_MENU () {
        return [
            {
                text: 'x',
                value: 'x'
            },
            {
                text: 'y',
                value: 'y'
            }
        ];
    }

    get COMPARE_MENU () {
        return [
            {
                text: '<',
                value: ComparisonOptions.LESS_THAN
            },
            {
                text: '>',
                value: ComparisonOptions.GREATER_THAN
            }
        ];
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
                        default: 'when acceleration [COMPARE] [VALUE]',
                        description: 'when the meters/second^2 value measured by the acceleration sensor is compared to some value'
                    }),
                    blockType: BlockType.HAT,
                    arguments: {
                        COMPARE: {
                            type: ArgumentType.STRING,
                            menu: 'compareOptions',
                            defaultValue: ComparisonOptions.GREATER_THAN
                        },
                        VALUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 5
                        }
                    }
                },
                {
                    opcode: 'whenSpinSpeedCompare',
                    text: formatMessage({
                        id: 'gdxfor.whenSpinSpeedCompare',
                        default: 'when spin speed [COMPARE] [VALUE]',
                        description: 'when the degrees/second value measured by the gyroscope sensor is compared to some value'
                    }),
                    blockType: BlockType.HAT,
                    arguments: {
                        COMPARE: {
                            type: ArgumentType.STRING,
                            menu: 'compareOptions',
                            defaultValue: ComparisonOptions.GREATER_THAN
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
                        default: 'when force [COMPARE] [VALUE]',
                        description: 'when the value measured by the force sensor is compared to some value'
                    }),
                    blockType: BlockType.HAT,
                    arguments: {
                        COMPARE: {
                            type: ArgumentType.STRING,
                            menu: 'compareOptions',
                            defaultValue: ComparisonOptions.GREATER_THAN
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
                            defaultValue: 'x'
                        }
                    }
                },
                {
                    opcode: 'getSpinSpeed',
                    text: formatMessage({
                        id: 'gdxfor.getSpinSpeed',
                        default: 'spin speed [DIRECTION]',
                        description: 'gets spin speed'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        DIRECTION: {
                            type: ArgumentType.STRING,
                            menu: 'directionOptions',
                            defaultValue: 'x'
                        }
                    }
                },
                {
                    opcode: 'getTilt',
                    text: formatMessage({
                        id: 'gdxfor.getTilt',
                        default: 'tilt [TILT]',
                        description: 'gets tilt'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        TILT: {
                            type: ArgumentType.STRING,
                            menu: 'tiltOptions',
                            defaultValue: 'x'
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
                directionOptions: this.DIRECTIONS_MENU,
                compareOptions: this.COMPARE_MENU,
                tiltOptions: this.TILT_MENU
            }
        };
    }

    /**
     * @return {number} - the magnitude of a three dimension vector.
     */
    magnitude (x, y, z) {
        return Math.sqrt(x*x + y*y + z*z);
    }


    whenAccelerationCompare (args) {
        let currentVal = this.magnitude(
            this._peripheral.getAccelerationX(),
            this._peripheral.getAccelerationY(),
            this._peripheral.getAccelerationZ()
        );

        switch (args.COMPARE) {
        case ComparisonOptions.LESS_THAN:
            return currentVal < Cast.toNumber(args.VALUE);
        case ComparisonOptions.GREATER_THAN:
            return currentVal > Cast.toNumber(args.VALUE);
        default:
            log.warn(`Unknown comparison operator in whenAccelerationCompare: ${args.COMPARE}`);
            return false;
        }
    }
    whenSpinSpeedCompare (args) {
        let currentVal = this.magnitude(
            this._peripheral.getSpinSpeedX(),
            this._peripheral.getSpinSpeedY(),
            this._peripheral.getSpinSpeedZ()
        );

        switch (args.COMPARE) {
        case ComparisonOptions.LESS_THAN:
            return currentVal < Cast.toNumber(args.VALUE);
        case ComparisonOptions.GREATER_THAN:
            return currentVal > Cast.toNumber(args.VALUE);
        default:
            log.warn(`Unknown comparison operator in whenSpinSpeedCompare: ${args.COMPARE}`);
            return false;
        }
    }
    whenForceCompare (args) {
        switch (args.COMPARE) {
        case ComparisonOptions.LESS_THAN:
            return this._peripheral.getForce() < Cast.toNumber(args.VALUE);
        case ComparisonOptions.GREATER_THAN:
            return this._peripheral.getForce() > Cast.toNumber(args.VALUE);
        default:
            log.warn(`Unknown comparison operator in whenForceCompare: ${args.COMPARE}`);
            return false;
        }
    }
    getAcceleration (args) {
        switch (args.DIRECTION) {
        case 'x':
            return this._peripheral.getAccelerationX();
        case 'y':
            return this._peripheral.getAccelerationY();
        case 'z':
            return this._peripheral.getAccelerationZ();
        default:
            log.warn(`Unknown direction in getAcceleration: ${args.DIRECTION}`);
        }
    }
    getSpinSpeed (args) {
        switch (args.DIRECTION) {
        case 'x':
            return this._peripheral.getSpinSpeedX();
        case 'y':
            return this._peripheral.getSpinSpeedY();
        case 'z':
            return this._peripheral.getSpinSpeedZ();
        default:
            log.warn(`Unknown direction in getSpinSpeed: ${args.DIRECTION}`);
        }
    }
    getTilt (args) {
        console.log(args);

        switch (args.TILT) {
        case 'x':
            return this._peripheral.getTiltX();
        case 'y':
            return this._peripheral.getTiltY();
        default:
            log.warn(`Unknown direction in getTilt: ${args.TILT}`);
        }
    }
    getForce () {
        return this._peripheral.getForce();
    }
}

module.exports = Scratch3GdxForBlocks;
