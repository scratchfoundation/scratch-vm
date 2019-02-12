const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const log = require('../../util/log');
const formatMessage = require('format-message');
const MathUtil = require('../../util/math-util');
const BLE = require('../../io/ble');
const godirect = require('@vernier/godirect/dist/godirect.min.umd.js');
const ScratchLinkDeviceAdapter = require('./scratch-link-device-adapter');

/**
 * Icon png to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoOCAuNSkiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PHBhdGggZD0iTTEyIDM5LjVBMi41IDIuNSAwIDAgMSA5LjUgMzdjMC0uMy4yLS41LjUtLjVzLjUuMi41LjVhMS41IDEuNSAwIDEgMCAzIDB2LS4yYzAtLjQtLjItLjgtLjUtMWwtLjgtLjljLS41LS40LS43LTEtLjctMS43VjMxYzAtLjMuMi0uNS41LS41cy41LjIuNS41djIuMmMwIC40LjEuOC40IDFsLjguOWMuNS40LjggMSAuOCAxLjd2LjJjMCAxLjQtMS4xIDIuNS0yLjUgMi41eiIgZmlsbD0iI0U2RTdFOCIvPjxwYXRoIGQ9Ik0yMy43LjNBMSAxIDAgMCAwIDIzIDBIMWExIDEgMCAwIDAtLjcuM0ExIDEgMCAwIDAgMCAxdjI2YzAgLjMuMS41LjMuNy4yLjIuNC4zLjcuM2gyMmMuMyAwIC41LS4xLjctLjMuMi0uMi4zLS40LjMtLjdWMWExIDEgMCAwIDAtLjMtLjd6TTEyIDRjMiAwIDMuMyAyIDIuNiAzLjhMMTMuMyAxMWExLjQgMS40IDAgMCAxLTIuNyAwTDkuNSA3LjdsLS4yLTFDOS4yIDUuNCAxMC40IDQgMTIgNHoiIHN0cm9rZT0iIzdDODdBNSIgZmlsbD0iIzg1OTJBRiIgZmlsbC1ydWxlPSJub256ZXJvIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNMiAydjI0aDIwVjJIMnptMTAgMmMyIDAgMy4zIDIgMi42IDMuOEwxMy4zIDExYTEuNCAxLjQgMCAwIDEtMi43IDBMOS41IDcuN2wtLjItMUM5LjIgNS40IDEwLjQgNCAxMiA0eiIgc3Ryb2tlPSIjN0M4N0E1IiBmaWxsPSIjNUNCMUQ2IiBmaWxsLXJ1bGU9Im5vbnplcm8iIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIHN0cm9rZT0iIzdDODdBNSIgZmlsbD0iIzg1OTJBRiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMjIgMjZIMnYtNmwyMC00eiIvPjxwYXRoIGQ9Ik0uMyAyNy43TDIgMjZNLjMuM0wyIDJNMjIgMkwyMy43LjNNMjMuNyAyNy43TDIyIDI2IiBzdHJva2U9IiM3Qzg3QTUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxjaXJjbGUgZmlsbD0iI0ZGQkYwMCIgY3g9IjEyIiBjeT0iMTQuOCIgcj0iMS4yIi8+PHBhdGggc3Ryb2tlPSIjN0M4N0E1IiBmaWxsPSIjRTZFN0U4IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Ik0xMCAyOGg0djRoLTR6Ii8+PHBhdGggZD0iTTE1LjUgMjJoLTdhLjUuNSAwIDAgMS0uNS0uNWMwLS4zLjItLjUuNS0uNWg3Yy4zIDAgLjUuMi41LjVzLS4yLjUtLjUuNXpNMTcuNSAyNGgtMTFhLjUuNSAwIDAgMS0uNS0uNWMwLS4zLjItLjUuNS0uNWgxMWMuMyAwIC41LjIuNS41cy0uMi41LS41LjV6IiBmaWxsPSIjRkZCRjAwIi8+PC9nPjwvc3ZnPg==';

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
 * A time interval to wait (in milliseconds) before reporting to the BLE socket
 * that data has stopped coming from the peripheral.
 */
const BLETimeout = 4500;

/**
 * A string to report to the BLE socket when the GdxFor has stopped receiving data.
 * @type {string}
 */
const BLEDataStoppedError = 'Force and Acceleration extension stopped receiving data';

/**
 * Sensor ID numbers for the GDX-FOR.
 */
const GDXFOR_SENSOR = {
    FORCE: 1,
    ACCELERATION_X: 2,
    ACCELERATION_Y: 3,
    ACCELERATION_Z: 4,
    SPIN_SPEED_X: 5,
    SPIN_SPEED_Y: 6,
    SPIN_SPEED_Z: 7
};

/**
 * The update rate, in milliseconds, for sensor data input from the peripheral.
 */
const GDXFOR_UPDATE_RATE = 100;

/**
 * Threshold for pushing and pulling force, for the whenForcePushedOrPulled hat block.
 * @type {number}
 */
const FORCE_THRESHOLD = 5;

/**
 * Threshold for acceleration magnitude, for the "moved" gesture.
 * @type {number}
 */
const MOVED_THRESHOLD = 3;

/**
 * Threshold for acceleration magnitude, for the "shaken" gesture.
 * @type {number}
 */
const SHAKEN_THRESHOLD = 30;

/**
 * Threshold for acceleration magnitude, to check if we are facing up.
 * @type {number}
 */
const FACING_THRESHOLD = 9;

/**
 * Threshold for acceleration magnitude, below which we are in freefall.
 * @type {number}
 */
const FREEFALL_THRESHOLD = 0.5;

/**
 * Factor used to account for influence of rotation during freefall.
 * @type {number}
 */
const FREEFALL_ROTATION_FACTOR = 0.3;

/**
 * Acceleration due to gravity, in m/s^2.
 * @type {number}
 */
const GRAVITY = 9.8;

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
         * An @vernier/godirect Device
         * @type {Device}
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
            spinSpeedX: 0,
            spinSpeedY: 0,
            spinSpeedZ: 0
        };

        /**
         * Interval ID for data reading timeout.
         * @type {number}
         * @private
         */
        this._timeoutID = null;

        this.disconnect = this.disconnect.bind(this);
        this._onConnect = this._onConnect.bind(this);
    }


    /**
     * Called by the runtime when user wants to scan for a peripheral.
     */
    scan () {
        if (this._scratchLinkSocket) {
            this._scratchLinkSocket.disconnect();
        }

        this._scratchLinkSocket = new BLE(this._runtime, this._extensionId, {
            filters: [
                {namePrefix: 'GDX-FOR'}
            ],
            optionalServices: [
                BLEUUID.service
            ]
        }, this._onConnect, this.disconnect);
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
     * Called by the runtime when a user exits the connection popup.
     * Disconnect from the GDX FOR.
     */
    disconnect () {
        window.clearInterval(this._timeoutID);
        this._sensors = {
            force: 0,
            accelerationX: 0,
            accelerationY: 0,
            accelerationZ: 0,
            spinSpeedX: 0,
            spinSpeedY: 0,
            spinSpeedZ: 0
        };
        if (this._scratchLinkSocket) {
            this._scratchLinkSocket.disconnect();
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
        const adapter = new ScratchLinkDeviceAdapter(this._scratchLinkSocket, BLEUUID);
        godirect.createDevice(adapter, {open: true, startMeasurements: false}).then(device => {
            // Setup device
            this._device = device;
            this._device.keepValues = false; // todo: possibly remove after updating Vernier godirect module

            // Enable sensors
            this._device.sensors.forEach(sensor => {
                sensor.setEnabled(true);
            });

            // Set sensor value-update behavior
            this._device.on('measurements-started', () => {
                const enabledSensors = this._device.sensors.filter(s => s.enabled);
                enabledSensors.forEach(sensor => {
                    sensor.on('value-changed', s => {
                        this._onSensorValueChanged(s);
                    });
                });
                this._timeoutID = window.setInterval(
                    () => this._scratchLinkSocket.handleDisconnectError(BLEDataStoppedError),
                    BLETimeout
                );
            });

            // Start device
            this._device.start(GDXFOR_UPDATE_RATE);
        });
    }

    /**
     * Handler for sensor value changes from the goforce device.
     * @param {object} sensor - goforce device sensor whose value has changed
     * @private
     */
    _onSensorValueChanged (sensor) {
        switch (sensor.number) {
        case GDXFOR_SENSOR.FORCE:
            // Normalize the force, which can be measured between -50 and 50 N,
            // to be a value between -100 and 100.
            this._sensors.force = MathUtil.clamp(sensor.value * 2, -100, 100);
            break;
        case GDXFOR_SENSOR.ACCELERATION_X:
            this._sensors.accelerationX = sensor.value;
            break;
        case GDXFOR_SENSOR.ACCELERATION_Y:
            this._sensors.accelerationY = sensor.value;
            break;
        case GDXFOR_SENSOR.ACCELERATION_Z:
            this._sensors.accelerationZ = sensor.value;
            break;
        case GDXFOR_SENSOR.SPIN_SPEED_X:
            this._sensors.spinSpeedX = this._spinSpeedFromGyro(sensor.value);
            break;
        case GDXFOR_SENSOR.SPIN_SPEED_Y:
            this._sensors.spinSpeedY = this._spinSpeedFromGyro(sensor.value);
            break;
        case GDXFOR_SENSOR.SPIN_SPEED_Z:
            this._sensors.spinSpeedZ = this._spinSpeedFromGyro(sensor.value);
            break;
        }
        // cancel disconnect timeout and start a new one
        window.clearInterval(this._timeoutID);
        this._timeoutID = window.setInterval(
            () => this._scratchLinkSocket.handleDisconnectError(BLEDataStoppedError),
            BLETimeout
        );
    }

    _spinSpeedFromGyro (val) {
        const framesPerSec = 1000 / this._runtime.currentStepTime;
        val = MathUtil.radToDeg(val);
        val = val / framesPerSec; // convert to from degrees per sec to degrees per frame
        val = val * -1;
        return val;
    }

    getForce () {
        return this._sensors.force;
    }

    getTiltFrontBack (back = false) {
        const x = this.getAccelerationX();
        const y = this.getAccelerationY();
        const z = this.getAccelerationZ();

        // Compute the yz unit vector
        const y2 = y * y;
        const z2 = z * z;
        let value = y2 + z2;
        value = Math.sqrt(value);

        // For sufficiently small zy vector values we are essentially at 90 degrees.
        // The following snaps to 90 and avoids divide-by-zero errors.
        // The snap factor was derived through observation -- just enough to
        // still allow single degree steps up to 90 (..., 87, 88, 89, 90).
        if (value < 0.35) {
            value = (x < 0) ? 90 : -90;
        } else {
            value = x / value;
            value = Math.atan(value);
            value = MathUtil.radToDeg(value) * -1;
        }

        // Back is the inverse of front
        if (back) value *= -1;

        return value;
    }

    getTiltLeftRight (right = false) {
        const x = this.getAccelerationX();
        const y = this.getAccelerationY();
        const z = this.getAccelerationZ();

        // Compute the yz unit vector
        const x2 = x * x;
        const z2 = z * z;
        let value = x2 + z2;
        value = Math.sqrt(value);

        // For sufficiently small zy vector values we are essentially at 90 degrees.
        // The following snaps to 90 and avoids divide-by-zero errors.
        // The snap factor was derived through observation -- just enough to
        // still allow single degree steps up to 90 (..., 87, 88, 89, 90).
        if (value < 0.35) {
            value = (y < 0) ? 90 : -90;
        } else {
            value = y / value;
            value = Math.atan(value);
            value = MathUtil.radToDeg(value) * -1;
        }

        // Right is the inverse of left
        if (right) value *= -1;

        return value;
    }

    getAccelerationX () {
        return this._sensors.accelerationX;
    }

    getAccelerationY () {
        return this._sensors.accelerationY;
    }

    getAccelerationZ () {
        return this._sensors.accelerationZ;
    }

    getSpinSpeedX () {
        return this._sensors.spinSpeedX;
    }

    getSpinSpeedY () {
        return this._sensors.spinSpeedY;
    }

    getSpinSpeedZ () {
        return this._sensors.spinSpeedZ;
    }
}

/**
 * Enum for pushed and pulled menu options.
 * @readonly
 * @enum {string}
 */
const PushPullValues = {
    PUSHED: 'pushed',
    PULLED: 'pulled'
};

/**
 * Enum for motion gesture menu options.
 * @readonly
 * @enum {string}
 */
const GestureValues = {
    MOVED: 'moved',
    SHAKEN: 'shaken',
    STARTED_FALLING: 'started falling'
};

/**
 * Enum for tilt axis menu options.
 * @readonly
 * @enum {string}
 */
const TiltAxisValues = {
    FRONT: 'front',
    BACK: 'back',
    LEFT: 'left',
    RIGHT: 'right'
};

/**
 * Enum for axis menu options.
 * @readonly
 * @enum {string}
 */
const AxisValues = {
    X: 'x',
    Y: 'y',
    Z: 'z'
};

/**
 * Enum for face menu options.
 * @readonly
 * @enum {string}
 */
const FaceValues = {
    UP: 'up',
    DOWN: 'down'
};

/**
 * Scratch 3.0 blocks to interact with a GDX-FOR peripheral.
 */
class Scratch3GdxForBlocks {

    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME () {
        return 'Force and Acceleration';
    }

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return 'gdxfor';
    }

    get AXIS_MENU () {
        return [
            {
                text: 'x',
                value: AxisValues.X
            },
            {
                text: 'y',
                value: AxisValues.Y
            },
            {
                text: 'z',
                value: AxisValues.Z
            }
        ];
    }

    get TILT_MENU () {
        return [
            {
                text: formatMessage({
                    id: 'gdxfor.tiltDirectionMenu.front',
                    default: 'front',
                    description: 'label for front element in tilt direction picker for gdxfor extension'
                }),
                value: TiltAxisValues.FRONT
            },
            {
                text: formatMessage({
                    id: 'gdxfor.tiltDirectionMenu.back',
                    default: 'back',
                    description: 'label for back element in tilt direction picker for gdxfor extension'
                }),
                value: TiltAxisValues.BACK
            },
            {
                text: formatMessage({
                    id: 'gdxfor.tiltDirectionMenu.left',
                    default: 'left',
                    description: 'label for left element in tilt direction picker for gdxfor extension'
                }),
                value: TiltAxisValues.LEFT
            },
            {
                text: formatMessage({
                    id: 'gdxfor.tiltDirectionMenu.right',
                    default: 'right',
                    description: 'label for right element in tilt direction picker for gdxfor extension'
                }),
                value: TiltAxisValues.RIGHT
            }
        ];
    }

    get FACE_MENU () {
        return [
            {
                text: formatMessage({
                    id: 'gdxfor.up',
                    default: 'up',
                    description: 'the sensor is facing up'
                }),
                value: FaceValues.UP
            },
            {
                text: formatMessage({
                    id: 'gdxfor.down',
                    default: 'down',
                    description: 'the sensor is facing down'
                }),
                value: FaceValues.DOWN
            }
        ];
    }

    get PUSH_PULL_MENU () {
        return [
            {
                text: formatMessage({
                    id: 'gdxfor.pushed',
                    default: 'pushed',
                    description: 'the force sensor was pushed inward'
                }),
                value: PushPullValues.PUSHED
            },
            {
                text: formatMessage({
                    id: 'gdxfor.pulled',
                    default: 'pulled',
                    description: 'the force sensor was pulled outward'
                }),
                value: PushPullValues.PULLED
            }
        ];
    }

    get GESTURE_MENU () {
        return [
            {
                text: formatMessage({
                    id: 'gdxfor.moved',
                    default: 'moved',
                    description: 'the sensor was moved'
                }),
                value: GestureValues.MOVED
            },
            {
                text: formatMessage({
                    id: 'gdxfor.shaken',
                    default: 'shaken',
                    description: 'the sensor was shaken'
                }),
                value: GestureValues.SHAKEN
            },
            {
                text: formatMessage({
                    id: 'gdxfor.startedFalling',
                    default: 'started falling',
                    description: 'the sensor started free falling'
                }),
                value: GestureValues.STARTED_FALLING
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
                    opcode: 'whenForcePushedOrPulled',
                    text: formatMessage({
                        id: 'gdxfor.whenForcePushedOrPulled',
                        default: 'when force sensor [PUSH_PULL]',
                        description: 'when the force sensor is pushed or pulled'
                    }),
                    blockType: BlockType.HAT,
                    arguments: {
                        PUSH_PULL: {
                            type: ArgumentType.STRING,
                            menu: 'pushPullOptions',
                            defaultValue: PushPullValues.PUSHED
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
                },
                '---',
                {
                    opcode: 'whenGesture',
                    text: formatMessage({
                        id: 'gdxfor.whenGesture',
                        default: 'when [GESTURE]',
                        description: 'when the sensor detects a gesture'
                    }),
                    blockType: BlockType.HAT,
                    arguments: {
                        GESTURE: {
                            type: ArgumentType.STRING,
                            menu: 'gestureOptions',
                            defaultValue: GestureValues.MOVED
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
                            defaultValue: TiltAxisValues.FRONT
                        }
                    }
                },
                {
                    opcode: 'getSpinSpeed',
                    text: formatMessage({
                        id: 'gdxfor.getSpin',
                        default: 'spin [DIRECTION]',
                        description: 'gets spin speed'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        DIRECTION: {
                            type: ArgumentType.STRING,
                            menu: 'axisOptions',
                            defaultValue: AxisValues.Z
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
                            menu: 'axisOptions',
                            defaultValue: AxisValues.X
                        }
                    }
                },
                '---',
                {
                    opcode: 'isFacing',
                    text: formatMessage({
                        id: 'gdxfor.isFacing',
                        default: 'facing [FACING]?',
                        description: 'is the device facing up or down?'
                    }),
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        FACING: {
                            type: ArgumentType.STRING,
                            menu: 'faceOptions',
                            defaultValue: FaceValues.UP
                        }
                    }
                },
                {
                    opcode: 'isFreeFalling',
                    text: formatMessage({
                        id: 'gdxfor.isFreeFalling',
                        default: 'falling?',
                        description: 'is the device in free fall?'
                    }),
                    blockType: BlockType.BOOLEAN

                }
            ],
            menus: {
                pushPullOptions: this.PUSH_PULL_MENU,
                gestureOptions: this.GESTURE_MENU,
                axisOptions: this.AXIS_MENU,
                tiltOptions: this.TILT_MENU,
                faceOptions: this.FACE_MENU
            }
        };
    }

    whenForcePushedOrPulled (args) {
        switch (args.PUSH_PULL) {
        case PushPullValues.PUSHED:
            return this._peripheral.getForce() < FORCE_THRESHOLD * -1;
        case PushPullValues.PULLED:
            return this._peripheral.getForce() > FORCE_THRESHOLD;
        default:
            log.warn(`unknown push/pull value in whenForcePushedOrPulled: ${args.PUSH_PULL}`);
            return false;
        }
    }

    getForce () {
        return Math.round(this._peripheral.getForce());
    }

    whenGesture (args) {
        switch (args.GESTURE) {
        case GestureValues.MOVED:
            return this.gestureMagnitude() > MOVED_THRESHOLD;
        case GestureValues.SHAKEN:
            return this.gestureMagnitude() > SHAKEN_THRESHOLD;
        case GestureValues.STARTED_FALLING:
            return this.isFreeFalling();
        default:
            log.warn(`unknown gesture value in whenGesture: ${args.GESTURE}`);
            return false;
        }
    }

    getTilt (args) {
        switch (args.TILT) {
        case TiltAxisValues.FRONT:
            return Math.round(this._peripheral.getTiltFrontBack(false));
        case TiltAxisValues.BACK:
            return Math.round(this._peripheral.getTiltFrontBack(true));
        case TiltAxisValues.LEFT:
            return Math.round(this._peripheral.getTiltLeftRight(false));
        case TiltAxisValues.RIGHT:
            return Math.round(this._peripheral.getTiltLeftRight(true));
        default:
            log.warn(`Unknown direction in getTilt: ${args.TILT}`);
        }
    }

    getSpinSpeed (args) {
        switch (args.DIRECTION) {
        case AxisValues.X:
            return Math.round(this._peripheral.getSpinSpeedX());
        case AxisValues.Y:
            return Math.round(this._peripheral.getSpinSpeedY());
        case AxisValues.Z:
            return Math.round(this._peripheral.getSpinSpeedZ());
        default:
            log.warn(`Unknown direction in getSpinSpeed: ${args.DIRECTION}`);
        }
    }

    getAcceleration (args) {
        switch (args.DIRECTION) {
        case AxisValues.X:
            return Math.round(this._peripheral.getAccelerationX());
        case AxisValues.Y:
            return Math.round(this._peripheral.getAccelerationY());
        case AxisValues.Z:
            return Math.round(this._peripheral.getAccelerationZ());
        default:
            log.warn(`Unknown direction in getAcceleration: ${args.DIRECTION}`);
        }
    }

    /**
     * @param {number} x - x axis vector
     * @param {number} y - y axis vector
     * @param {number} z - z axis vector
     * @return {number} - the magnitude of a three dimension vector.
     */
    magnitude (x, y, z) {
        return Math.sqrt((x * x) + (y * y) + (z * z));
    }

    accelMagnitude () {
        return this.magnitude(
            this._peripheral.getAccelerationX(),
            this._peripheral.getAccelerationY(),
            this._peripheral.getAccelerationZ()
        );
    }

    gestureMagnitude () {
        return this.accelMagnitude() - GRAVITY;
    }

    spinMagnitude () {
        return this.magnitude(
            this._peripheral.getSpinSpeedX(),
            this._peripheral.getSpinSpeedY(),
            this._peripheral.getSpinSpeedZ()
        );
    }

    isFacing (args) {
        switch (args.FACING) {
        case FaceValues.UP:
            return this._peripheral.getAccelerationZ() > FACING_THRESHOLD;
        case FaceValues.DOWN:
            return this._peripheral.getAccelerationZ() < FACING_THRESHOLD * -1;
        default:
            log.warn(`Unknown direction in isFacing: ${args.FACING}`);
        }
    }

    isFreeFalling () {
        // When the peripheral is not connected, the acceleration magnitude
        // is 0 instead of ~9.8, which ends up calculating as a positive
        // free fall; so we need to return 'false' here to prevent returning 'true'.
        if (!this._peripheral.isConnected()) {
            return false;
        }

        const accelMag = this.accelMagnitude();
        const spinMag = this.spinMagnitude();

        // We want to account for rotation during freefall,
        // so we tack on a an estimated "rotational effect"
        // The FREEFALL_ROTATION_FACTOR const is used to both scale the
        // gyro measurements and convert them to radians/second.
        // So, we compare our accel magnitude against:
        // FREEFALL_THRESHOLD + (some_scaled_magnitude_of_rotation).
        const ffThresh = FREEFALL_THRESHOLD + (FREEFALL_ROTATION_FACTOR * spinMag);

        return accelMag < ffThresh;
    }
}

module.exports = Scratch3GdxForBlocks;
