const BT = require('../../io/bt');
const RateLimiter = require('../../util/rateLimiter.js');

const PrimeMotor = require('./prime-motor.js');


/**
 * Object containing Prime-specific Bluetooth-properties
 * @readonly
 */
const PrimeBT = {
    friendlyNamePrefix: 'LEGO Hub',
    sendInterval: 100,
    sendRateMax: 100,
    pairingPin: '0000'
};

/**
 * A time interval to wait (in milliseconds) in between pings, which are used to
 * detect that the device has powered off.
 * @type {number}
 */
const PrimePingInterval = 5000;

/**
 * A time interval to wait (in milliseconds) before requesting that the hub
 * enter "play" or streaming mode. The delay allows the hub's connecting
 * animation to complete before starting the play mode animation.
 * @type {number}
 */
const PrimePlayModeDelay = 1000;

/**
 * Enum for Prime sensor and output types.
 * @readonly
 * @enum {number}
 */
const PrimeIO = {
    COLOR: 61,
    FORCE: 63,
    MOTOR_MEDIUM: 48,
    MOTOR_LARGE: 49,
    ULTRASONIC: 62
};

/**
 * Enum for connection/port ids assigned to internal Prime output devices.
 * @readonly
 * @enum {number}
 */
const PrimeMessage = {
    SENSOR_DATA: 0,
    STORAGE_DATA: 1,
    BATTERY_STATUS: 2,
    BUTTON_EVENT: 3,
    GESTURE_STATUS: 4,
    DISPLAY_STATUS: 5,
    FIRMWARE_STATUS: 6
};

const PrimePortIndex = {
    A: 0,
    B: 1,
    C: 2,
    D: 3,
    E: 4,
    F: 5,
    ACCELEROMETER: 6,
    GYROSCOPE: 7,
    POSITION: 8
};

/**
 * Manage communication with a Prime peripheral over a Serial client socket.
 */
class PrimeHub {
    constructor (runtime, extensionId) {

        /**
         * The Scratch 3.0 runtime used to trigger the green flag button.
         * @type {Runtime}
         * @private
         */
        this._runtime = runtime;
        this._runtime.on('PROJECT_STOP_ALL', this.stopAll.bind(this));

        /**
         * The id of the extension this peripheral belongs to.
         */
        this._extensionId = extensionId;

        /**
         * The motors which this Prime could possibly have.
         * @type {PrimeMotor[]}
         * @private
         */
        this._motors = [];

        /**
         * The most recently received value for each sensor.
         * @type {Object.<string, number>}
         * @private
         */
        this._sensors = {};

        // Set sensor and motor states to their defaults
        this.reset();

        /**
         * The Serial connection socket for reading/writing port data.
         * @type {Serial}
         * @private
         */
        this._bt = null;
        this._runtime.registerPeripheralExtension(extensionId, this);

        /**
         * A rate limiter utility, to help limit the rate at which we send Serial messages
         * over the socket to Scratch Link to a maximum number of sends per second.
         * @type {RateLimiter}
         * @private
         */
        this._rateLimiter = new RateLimiter(PrimeBT.sendRateMax);

        this.disconnect = this.disconnect.bind(this);
        this.reset = this.reset.bind(this);
        this._onConnect = this._onConnect.bind(this);
        this._onMessage = this._onMessage.bind(this);
        this._requestFirmwareInfo = this._requestFirmwareInfo.bind(this);
        this._requestPlayMode = this._requestPlayMode.bind(this);

        this._pingIntervalId = null;
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

    get yaw () {
        return this._sensors.yaw;
    }

    /**
     * @return {number} - the latest value received from the color sensor.
     */
    get colorIndex () {
        return this._sensors.colorIndex;
    }

    get prevColorIndex () {
        return this._sensors.prevColorIndex;
    }

    get force () {
        return this._sensors.force * 10;
    }

    get distance () {
        return this._sensors.distance;
    }

    get buttonLeft () {
        return this._sensors.buttonLeft;
    }

    get buttonRight () {
        return this._sensors.buttonRight;
    }

    get sendInterval () {
        return PrimeBT.sendInterval;
    }

    /**
     * Access a particular motor on this peripheral.
     * @param {int} index - the zero-based index of the desired motor.
     * @return {PrimeMotor} - the PrimeMotor instance, if any, at that index.
     */
    motor (index) {
        return this._motors[index];
    }

    forEachMotor (motorLabel, callback) {
        const index = PrimePortIndex[motorLabel];
        if (typeof index !== 'undefined') {
            callback(index);
            return;
        }
        if (motorLabel === 'ALL') { // todo: use PrimeMotorValue enum
            for (let i = 0; i < this._motors.length; i++) {
                callback(i);
            }
        }
    }

    /**
     * Stop all the motors that are currently running.
     */
    stopAllMotors () {
        this._motors.forEach(motor => {
            if (motor) {
                // Send the motor off command without using the rate limiter.
                // This allows the stop button to stop motors even if we are
                // otherwise flooded with commands.
                motor.turnOff(false);
            }
        });
    }

    getMotorPosition (portLabel) {
        const portIndex = PrimePortIndex[portLabel];
        if (typeof portIndex !== 'undefined' && this.motor(portIndex)) {
            return this.motor(portIndex).position;
        }
        return 0;
    }

    /**
     * Displays pixels on the 5x5 LED Matrix.
     * @param {int} pixels from left-to-right, top-to-bottom
     */
    display (pixels) {
        pixels = pixels.replace(/(.{5})/g, '$1:').slice(0, -1); // Insert :-separator after every 5th pixel
        pixels = pixels.replace(/(1)/g, '9'); // Replace all 1's with 9's
        const cmd = {
            m: 'scratch.display_image',
            p: {
                image: pixels
            },
            i: this.generateCommandId()
        };

        this.send(cmd);
    }

    playTone (note, durationSec) {
        const cmd = {
            m: 'scratch.sound_beep_for_time',
            p: {
                volume: 100,
                note: note,
                duration: durationSec * 1000
            },
            i: this.generateCommandId()
        };
        this.send(cmd);
    }

    /**
     * Stop the tone playing from the Prime peripheral, if any.
     */
    stopTone () {
        // todo: this causes the speaker to make a clicking sound, and this
        // command is run every time you click stop or green flag. is this a
        // spike hub runtime bug? or should we keep a flag and only call this
        // if we are currently playing a tone?
        const cmd = {
            m: 'scratch.sound_off',
            i: this.generateCommandId()
        };

        this.send(cmd);
    }

    /**
     * Stop the tone playing and motors on the Prime peripheral.
     */
    stopAll () {
        if (!this.isConnected()) return;
        this.stopTone();
        this.stopAllMotors();
    }

    /**
     * Called by the runtime when user wants to scan for a Prime peripheral.
     */
    scan () {
        if (this._bt) {
            this._bt.disconnect();
        }
        this._bt = new BT(this._runtime, this._extensionId, {
            majorDeviceClass: 8,
            minorDeviceClass: 1
        }, this._onConnect, this.reset, this._onMessage);
    }

    /**
     * Called by the runtime when user wants to connect to a certain Prime peripheral.
     * @param {number} id - the id of the peripheral to connect to.
     */
    connect (id) {
        if (this._bt) {
            this._bt.connectPeripheral(id, PrimeBT.pairingPin);
        }
    }

    disconnect () {
        if (this._bt) {
            this._bt.disconnect();
        }

        this.reset();
    }

    reset () {
        this._motors = [null, null, null, null, null, null];
        this._sensors = {
            tiltX: 0,
            tiltY: 0,
            yaw: 0,
            colorIndex: -1, // todo: should use enum
            prevColorIndex: -1, // todo: should use enum
            force: 0,
            distance: 0,
            buttonLeft: false,
            buttonRight: false
        };

        if (this._pingIntervalId) {
            window.clearInterval(this._pingIntervalId);
            this._pingIntervalId = null;
        }
    }

    /**
     * Called by the runtime to detect whether the Prime peripheral is connected.
     * @return {boolean} - the connected state.
     */
    isConnected () {
        let connected = false;
        if (this._bt) {
            connected = this._bt.isConnected();
        }
        return connected;
    }

    /**
     * Write a message to the Prime peripheral Serial socket.
     * @param {JSON} message - the message to write.
     * @param {boolean} [useLimiter=true] - if true, use the rate limiter
     * @return {Promise} - a promise result of the write operation
     */
    send (message, useLimiter = true) {
        if (!this.isConnected()) return Promise.resolve();

        if (useLimiter) {
            if (!this._rateLimiter.okayToSend()) {
                return Promise.resolve();
            }
        }

        message = `${JSON.stringify(message)}\r`;
        return this._bt.sendMessage({
            message: btoa(message),
            encoding: 'base64'
        });
    }

    generateCommandId () {
        return String(Math.floor(Math.random() * 10000000));
    }

    _onConnect () {
        this._pingIntervalId = window.setInterval(this._requestFirmwareInfo, PrimePingInterval);

        window.setTimeout(this._requestPlayMode, PrimePlayModeDelay);
    }

    _requestPlayMode () {
        const cmd = {
            m: 'program_modechange',
            p: {
                mode: 'play'
            }
        };
        this.send(cmd);
    }

    _requestFirmwareInfo () {
        const cmd = {
            m: 'get_firmware_info',
            i: this.generateCommandId()
        };
        this.send(cmd);
    }

    _onMessage (base64) {
        const messageString = atob(base64.message);
        let messageData = {};
        try {
            messageData = JSON.parse(messageString);
        } catch (e) {
            // console.log('caught error', e);
            const messageStrings = messageString.split('\r');
            messageStrings.forEach(string => {
                try {
                    messageData = JSON.parse(string);
                } catch (e2) {
                    // console.log('second try caught error', e2);
                    return;
                }
                // console.log('handling combined message part', messageData);
                this._handleMessage(messageData);
            });
            return;
        }

        this._handleMessage(messageData);
    }

    _handleMessage (data) {
        const method = data.m;
        const parameters = data.p;
        const result = data.r;
        const error = data.e;
        const messageId = data.i;

        // console.log('_onMessage', data);

        if (error) {
            console.log('error', atob(error));
            return;
        }

        if (method === 'runtime_error') {
            console.log(atob(parameters[3]));
            return;
        }

        switch (method) {
        case PrimeMessage.SENSOR_DATA: {
            // todo: summarize the sensor data spec here
            const portArray = parameters.slice(0, 6);
            portArray.forEach((portData, portIndex) => {
                this._handleSensorDataForPort(portData, portIndex);
            });

            // position data here is in the order: yaw, pitch, roll
            this._sensors.yaw = parameters[PrimePortIndex.POSITION][0];
            this._sensors.tiltY = parameters[PrimePortIndex.POSITION][1];
            this._sensors.tiltX = parameters[PrimePortIndex.POSITION][2];

            this._resetDisconnectedSensors(portArray);

            break;
        }
        case PrimeMessage.GESTURE_STATUS:
            this._sensors.gesture = parameters;
            break;
        case PrimeMessage.BATTERY_STATUS:
            break;
        case PrimeMessage.BUTTON_EVENT:
            if (parameters[0] === 'right') { // todo: use enum
                this._sensors.buttonRight = parameters[1] === 0;
            }
            if (parameters[0] === 'left') { // todo: use enum
                this._sensors.buttonLeft = parameters[1] === 0;
            }
            break;
        case PrimeMessage.STORAGE_DATA:
            break;
        case PrimeMessage.DISPLAY_STATUS:
            break;
        case PrimeMessage.FIRMWARE_STATUS:
            break;
        default: {
            // Resolve promise for completed motor command
            if (result !== null && messageId) {
                for (const portID of this._motors.keys()) {
                    const motor = this.motor(portID);
                    if (motor && motor.pendingPromiseId === messageId) {
                        motor.pendingPromiseFunction();
                    }
                }
            }
            break;
        }
        }
    }

    _handleSensorDataForPort (portData, portIndex) {
        const deviceType = portData[0];
        const deviceData = portData[1];
        switch (deviceType) {
        case PrimeIO.FORCE:
            this._sensors.force = deviceData[0];
            break;
        case PrimeIO.COLOR:
            this._sensors.prevColorIndex = this._sensors.colorIndex;
            // todo: better way to handle this case?
            if (deviceData[1] === null) {
                this._sensors.colorIndex = -1; // todo: use enum
            } else {
                this._sensors.colorIndex = deviceData[1];
            }
            break;
        case PrimeIO.ULTRASONIC:
            if (deviceData[0] !== null) { // todo: why do we often get null here?
                this._sensors.distance = deviceData[0];
            }
            break;
        case PrimeIO.MOTOR_MEDIUM:
        case PrimeIO.MOTOR_LARGE:
            if (this.motor(portIndex)) {
                this._motors[portIndex].position = deviceData[2];
            } else {
                this._motors[portIndex] = new PrimeMotor(this, portIndex);
            }
            break;
        }

        // Remove a motor that was disconnected
        if (this.motor(portIndex) && deviceType === 0) {
            this._motors[portIndex] = null;
        }
    }

    _resetDisconnectedSensors (portArray) {
        if (!this._sensorWasUpdated(PrimeIO.FORCE, portArray)) {
            if (this._sensors.force !== 0) {
                this._sensors.force = 0;
            }
        }
        if (!this._sensorWasUpdated(PrimeIO.COLOR, portArray)) {
            if (this._sensors.colorIndex !== -1) { // todo: use enum
                this._sensors.colorIndex = -1; // todo: use enum
            }
        }
        if (!this._sensorWasUpdated(PrimeIO.ULTRASONIC, portArray)) {
            if (this._sensors.distance !== 0) {
                this._sensors.distance = 0;
            }
        }
    }

    _sensorWasUpdated (sensorType, portArray) {
        let updated = false;
        portArray.forEach(portData => {
            if (portData[0] === sensorType) {
                updated = true;
            }
        });
        return updated;
    }
}

module.exports = PrimeHub;
