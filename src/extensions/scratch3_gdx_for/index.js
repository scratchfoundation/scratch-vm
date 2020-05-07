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
const blockIconURI = 'data:image/png;base64,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';

/**
 * Icon png to be displayed in the blocks category menu, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const menuIconURI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABGdBTUEAALGPC/xhBQAAA9dJREFUWAnNmE2IFEcUgF/9dE/v7LoaM9kkK4JBRA0EFBIPRm85hBAvEXHXwyo5eFE87GFcReMkObgJiQnkkJzEg9n8HIJixKNe1IMKihgiCbviwV11V3d0d3pmuqsqr5ppcEnb3TNVggVFVVe9eu+r97qqq4tASqp8/fsboQgmU0TMugi571K29bPy9ovPU8Sf16HbpQj3EkYFBcJcr5Am2nZfs94AIWVfqMQeHNwhICUBZ4ypUIA/X2sbIm2AW8AJK0lkEP6TJpfqwXgg4QxmF/fB7Gtvxk1G5ZKHU1CqTgPJoSUXYJYeohSUJu+qrqdVUGh2/pVX4VFffx77WaqBZkrkEFj271+qWH0sXcU3FBzyQe/Mg7B//LbKMTRTxNiDbsMHHjTJlyM7HEJIBHXs2KXFj+oTNSdoQOCYLS5jD9IwBMm5H8NplwwPb/QV4yEIcycaAza9IuA76B38fuz1OF5RXUkmHCdu6rg0BpSMgV/sAe7DdzGFrvvdi0D3mSZjQA0wt7REQsY+iWF0XbfFzyal8SLRxuteD+Du4h4Z/flbqaBHibAQtZmQtcZaAZSMwtTylaR/4vaw1ju5YhWG10pwwAqghmp2FeHO2+t11WqyM80W0m7vAOhsM1kD7CGz8L57Jsq6bitZC/GcWgLf1H6KuHT92cTDAFy/BgXMXm0OCpgV50Bo9kK3BqiBboabQMMU/WoL5im4jToeq/AIgXsiRx5KKCjcwPEsiAv/BQMu9EwyDHXd/3kqCOSzDk6t5/YglQKKeJwq+PNRmJI8kwSTaj1HZy5AhSHqnXkIvU9mMUwEw4Q5wTM57LUtkg8QPw/cdcBJ+PhvKJ0Gj80nGq6JXrg6/XFiX97GXIBpyqTieKpKViOl+WEhWXMaUavvvdIZ8Giy5+Lh3bwKm/t+Be3JazMfxc1tldY26rastiHcsQevTG9pw0znovkAcRWHzSDKnZtaOJLSfMFLB5RqtRBS4LbCurqLCy0YPkU3C0IIPEimMqR2ei7ZX2+KQdRi/WahNT/GmfOD4Vyzhx/66pcjp85dUvcmp6J8+txldXh07PPskdkS+V6EbD0vTOKlB0x9B/O6BS8ULly9PgE6x4kDPR/XX5pyYKj8xcCucsUmkNUQE0JvKKm2VioVK5HRE7UKOHbi6B94RzP+93jtpC0vWgXUF0hr3ipuw8uadwd3jXxoA9IK4Pah8t6BneV9GgjD28Svw1mlxFobgFbeFTz13cKbth93fDryp2CEq0a4hTA+aAPQ/ESJFDdvXLzzzrqNjlTqOP6uDeFf0uhvJ0ZP2QD8D6ZzU6u8YIbBAAAAAElFTkSuQmCC';

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
const GDXFOR_UPDATE_RATE = 80;

/**
 * Threshold for pushing and pulling force, for the whenForcePushedOrPulled hat block.
 * @type {number}
 */
const FORCE_THRESHOLD = 5;

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
 * An offset for the facing threshold, used to check that we are no longer facing up.
 * @type {number}
 */
const FACING_THRESHOLD_OFFSET = 5;

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
 * Threshold in degrees for reporting that the sensor is tilted.
 * @type {number}
 */
const TILT_THRESHOLD = 15;

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
        this._ble = null;

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

        this.reset = this.reset.bind(this);
        this._onConnect = this._onConnect.bind(this);
    }


    /**
     * Called by the runtime when user wants to scan for a peripheral.
     */
    scan () {
        if (this._ble) {
            this._ble.disconnect();
        }

        this._ble = new BLE(this._runtime, this._extensionId, {
            filters: [
                {namePrefix: 'GDX-FOR'}
            ],
            optionalServices: [
                BLEUUID.service
            ]
        }, this._onConnect, this.reset);
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
     * Called by the runtime when a user exits the connection popup.
     * Disconnect from the GDX FOR.
     */
    disconnect () {
        if (this._ble) {
            this._ble.disconnect();
        }

        this.reset();
    }

    /**
     * Reset all the state and timeout/interval ids.
     */
    reset () {
        this._sensors = {
            force: 0,
            accelerationX: 0,
            accelerationY: 0,
            accelerationZ: 0,
            spinSpeedX: 0,
            spinSpeedY: 0,
            spinSpeedZ: 0
        };

        if (this._timeoutID) {
            window.clearInterval(this._timeoutID);
            this._timeoutID = null;
        }
    }

    /**
     * Return true if connected to the goforce device.
     * @return {boolean} - whether the goforce is connected.
     */
    isConnected () {
        let connected = false;
        if (this._ble) {
            connected = this._ble.isConnected();
        }
        return connected;
    }

    /**
     * Starts reading data from peripheral after BLE has connected to it.
     * @private
     */
    _onConnect () {
        const adapter = new ScratchLinkDeviceAdapter(this._ble, BLEUUID);
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
                    () => this._ble.handleDisconnectError(BLEDataStoppedError),
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
            () => this._ble.handleDisconnectError(BLEDataStoppedError),
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
    SHAKEN: 'shaken',
    STARTED_FALLING: 'started falling',
    TURNED_FACE_UP: 'turned face up',
    TURNED_FACE_DOWN: 'turned face down'
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
    RIGHT: 'right',
    ANY: 'any'
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

    get TILT_MENU_ANY () {
        return [
            ...this.TILT_MENU,
            {
                text: formatMessage({
                    id: 'gdxfor.tiltDirectionMenu.any',
                    default: 'any',
                    description: 'label for any direction element in tilt direction picker for gdxfor extension'
                }),
                value: TiltAxisValues.ANY
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
            },
            {
                text: formatMessage({
                    id: 'gdxfor.turnedFaceUp',
                    default: 'turned face up',
                    description: 'the sensor was turned to face up'
                }),
                value: GestureValues.TURNED_FACE_UP
            },
            {
                text: formatMessage({
                    id: 'gdxfor.turnedFaceDown',
                    default: 'turned face down',
                    description: 'the sensor was turned to face down'
                }),
                value: GestureValues.TURNED_FACE_DOWN
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
            menuIconURI: menuIconURI,
            showStatusButton: true,
            blocks: [
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
                            defaultValue: GestureValues.SHAKEN
                        }
                    }
                },
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
                    opcode: 'whenTilted',
                    text: formatMessage({
                        id: 'gdxfor.whenTilted',
                        default: 'when tilted [TILT]',
                        description: 'when the sensor detects tilt'
                    }),
                    blockType: BlockType.HAT,
                    arguments: {
                        TILT: {
                            type: ArgumentType.STRING,
                            menu: 'tiltAnyOptions',
                            defaultValue: TiltAxisValues.ANY
                        }
                    }
                },
                {
                    opcode: 'isTilted',
                    text: formatMessage({
                        id: 'gdxfor.isTilted',
                        default: 'tilted [TILT]?',
                        description: 'is the device tilted?'
                    }),
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        TILT: {
                            type: ArgumentType.STRING,
                            menu: 'tiltAnyOptions',
                            defaultValue: TiltAxisValues.ANY
                        }
                    }
                },
                {
                    opcode: 'getTilt',
                    text: formatMessage({
                        id: 'gdxfor.getTilt',
                        default: 'tilt angle [TILT]',
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
                '---',
                {
                    opcode: 'isFreeFalling',
                    text: formatMessage({
                        id: 'gdxfor.isFreeFalling',
                        default: 'falling?',
                        description: 'is the device in free fall?'
                    }),
                    blockType: BlockType.BOOLEAN
                },
                {
                    opcode: 'getSpinSpeed',
                    text: formatMessage({
                        id: 'gdxfor.getSpin',
                        default: 'spin speed [DIRECTION]',
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
                }
            ],
            menus: {
                pushPullOptions: {
                    acceptReporters: true,
                    items: this.PUSH_PULL_MENU
                },
                gestureOptions: {
                    acceptReporters: true,
                    items: this.GESTURE_MENU
                },
                axisOptions: {
                    acceptReporters: true,
                    items: this.AXIS_MENU
                },
                tiltOptions: {
                    acceptReporters: true,
                    items: this.TILT_MENU
                },
                tiltAnyOptions: {
                    acceptReporters: true,
                    items: this.TILT_MENU_ANY
                }
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
        case GestureValues.SHAKEN:
            return this.gestureMagnitude() > SHAKEN_THRESHOLD;
        case GestureValues.STARTED_FALLING:
            return this.isFreeFalling();
        case GestureValues.TURNED_FACE_UP:
            return this._isFacing(GestureValues.TURNED_FACE_UP);
        case GestureValues.TURNED_FACE_DOWN:
            return this._isFacing(GestureValues.TURNED_FACE_DOWN);
        default:
            log.warn(`unknown gesture value in whenGesture: ${args.GESTURE}`);
            return false;
        }
    }

    _isFacing (direction) {
        if (typeof this._facingUp === 'undefined') {
            this._facingUp = false;
        }
        if (typeof this._facingDown === 'undefined') {
            this._facingDown = false;
        }

        // If the sensor is already facing up or down, reduce the threshold.
        // This prevents small fluctations in acceleration while it is being
        // turned from causing the hat block to trigger multiple times.
        let threshold = FACING_THRESHOLD;
        if (this._facingUp || this._facingDown) {
            threshold -= FACING_THRESHOLD_OFFSET;
        }

        this._facingUp = this._peripheral.getAccelerationZ() > threshold;
        this._facingDown = this._peripheral.getAccelerationZ() < threshold * -1;

        switch (direction) {
        case GestureValues.TURNED_FACE_UP:
            return this._facingUp;
        case GestureValues.TURNED_FACE_DOWN:
            return this._facingDown;
        default:
            return false;
        }
    }

    whenTilted (args) {
        return this._isTilted(args.TILT);
    }

    isTilted (args) {
        return this._isTilted(args.TILT);
    }

    getTilt (args) {
        return this._getTiltAngle(args.TILT);
    }

    _isTilted (direction) {
        switch (direction) {
        case TiltAxisValues.ANY:
            return this._getTiltAngle(TiltAxisValues.FRONT) > TILT_THRESHOLD ||
                this._getTiltAngle(TiltAxisValues.BACK) > TILT_THRESHOLD ||
                this._getTiltAngle(TiltAxisValues.LEFT) > TILT_THRESHOLD ||
                this._getTiltAngle(TiltAxisValues.RIGHT) > TILT_THRESHOLD;
        default:
            return this._getTiltAngle(direction) > TILT_THRESHOLD;
        }
    }

    _getTiltAngle (direction) {
        // Tilt values are calculated using acceleration due to gravity,
        // so we need to return 0 when the peripheral is not connected.
        if (!this._peripheral.isConnected()) {
            return 0;
        }

        switch (direction) {
        case TiltAxisValues.FRONT:
            return Math.round(this._peripheral.getTiltFrontBack(true));
        case TiltAxisValues.BACK:
            return Math.round(this._peripheral.getTiltFrontBack(false));
        case TiltAxisValues.LEFT:
            return Math.round(this._peripheral.getTiltLeftRight(true));
        case TiltAxisValues.RIGHT:
            return Math.round(this._peripheral.getTiltLeftRight(false));
        default:
            log.warn(`Unknown direction in getTilt: ${direction}`);
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
