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
        this._motors = [null, null, null, null, null, null];

        /**
         * The most recently received value for each sensor.
         * @type {Object.<string, number>}
         * @private
         */
        this._sensors = {
            tiltX: 0,
            tiltY: 0,
            yaw: 0,
            colorIndex: -1,     // todo: should use enum
            prevColorIndex: -1, // todo: should use enum
            force: 0,
            distance: 0
        };

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
        return this._sensors.force;
    }

    get distance () {
        return this._sensors.distance;
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
        if (motorLabel === 'ALL') { //todo: use PrimeMotorValue enum
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
     * Set the Prime peripheral's LED to a specific color.
     * @param {int} inputRGB - a 24-bit RGB color in 0xRRGGBB format.
     * @return {Promise} - a promise of the completion of the set led send operation.
     */
    setLED (inputRGB) {
        return inputRGB; // TODO
    }

    /**
     * Switch off the LED on the Prime.
     * @return {Promise} - a promise of the completion of the stop led send operation.
     */
    stopLED () {
        return false; // TODO
    }

    /**
     * Displays pixels on the 5x5 LED Matrix.
     * @param {int} pixels from left-to-right, top-to-bottom
     * @return {Promise} - a promise of the completion of the display operation.
     */
    display (pixels) {
        pixels = pixels.replace(/(.{5})/g, '$1:').slice(0, -1); // Insert :-separator after every 5th pixel
        pixels = pixels.replace(/(1)/g, '9'); // Replace all 1's with 9's
        const cmd = this.generateOutputCommand({
            m: 'scratch.display_image',
            p: {
                image: pixels
            }
        });

        this.send(cmd);

        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, PrimeBT.sendInterval);
        });
    }

    playTone (note, durationSec) {
        const cmd = this.generateOutputCommand({
            m: 'scratch.sound_beep_for_time',
            p: {
                volume: 100,
                note: note,
                duration: durationSec * 1000
            }
        });
        this.send(cmd);
    }

    /**
     * Stop the tone playing from the Prime peripheral, if any.
     * @return {Promise} - a promise that the command sent.
     */
    stopTone () {
        // todo: this causes the speaker to make a clicking sound, and this
        // command is run every time you click stop or green flag. is this a
        // spike hub runtime bug? or should we keep a flag and only call this
        // if we are currently playing a tone?
        const cmd = this.generateOutputCommand({
            m: 'scratch.sound_off'
        });

        return this.send(cmd);
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
            distance: 0
        };
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

    /**
     * Generate a Prime 'Output Command' with a unique id added.
     *
     * @param  {object} command   - the command object.
     * @return {object}            - the same command object with a unique id added.
     */
    generateOutputCommand (command) {
        // Add random id number
        command.i = String(Math.floor(Math.random() * 10000000));
        return command;
    }

    /**
     * Generate a Prime 'Input Command' in the byte array format
     * (COMMAND ID, COMMAND TYPE, CONNECT ID, TYPE ID, MODE, DELTA INTERVAL (4 BYTES),
     * UNIT, NOTIFICATIONS ENABLED).
     *
     * This sends a command to the Prime that sets that input format
     * of the specified inputs and sets value change notifications.
     *
     * @param  {number}  connectID           - the port (Connect ID) to send a command to.
     * @param  {number}  type                - the type of input sensor.
     * @param  {number}  mode                - the mode of the input sensor.
     * @param  {number}  delta               - the delta change needed to trigger notification.
     * @param  {array}   units               - the unit of the input sensor value.
     * @param  {boolean} enableNotifications - whether to enable notifications.
     * @return {array}                       - a generated input command.
     */
    generateInputCommand (connectID, type, mode, delta, units, enableNotifications) {
        const command = [
            1, // Command ID = 1 = "Sensor Format"
            2, // Command Type = 2 = "Write"
            connectID,
            type,
            mode,
            delta,
            0, // Delta Interval Byte 2
            0, // Delta Interval Byte 3
            0, // Delta Interval Byte 4
            units,
            enableNotifications ? 1 : 0
        ];

        return command;
    }

    /**
     * Sets LED mode and initial color and starts reading data from peripheral after BLE has connected.
     * @private
     */
    _onConnect () {
        console.log('_onConnect');
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
        // console.log('_onMessage', data);

        if (data.e) {
            console.log('error', atob(data.e));
            return;
        }

        if (method === 'runtime_error') {
            console.log(atob(parameters[3]));
            return;
        }

        switch (method) {
        case PrimeMessage.SENSOR_DATA: {
            // todo: summarize the sensor data spec here
            const ports = parameters.slice(0, 6);
            for (const [port, info] of ports.entries()) {
                const deviceType = info[0];
                if (deviceType !== 0) {
                    const deviceData = info[1];
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
                        this._sensors.distance = deviceData[0];
                        break;
                    case PrimeIO.MOTOR_MEDIUM:
                    case PrimeIO.MOTOR_LARGE:
                        if (this.motor(port)) {
                            this._motors[port].position = deviceData[2];
                        } else {
                            this._registerMotor(port, deviceType);
                        }
                        break;
                    default:
                        // log.warn(`Type ${type} on port ${_.invert(PrimePort)[port]}`);
                    }
                }
                // Remove a motor that was disconnected
                if (this.motor(port) && deviceType === 0) {
                    this._motors[port] = null;
                }
            }

            // position data here is in the order: yaw, pitch, roll
            this._sensors.yaw = parameters[PrimePortIndex.POSITION][0];
            this._sensors.tiltY = parameters[PrimePortIndex.POSITION][1];
            this._sensors.tiltX = parameters[PrimePortIndex.POSITION][2];

            break;
        }
        case PrimeMessage.GESTURE_STATUS:
            this._sensors.gesture = parameters;
            break;
        case PrimeMessage.BATTERY_STATUS:
        case PrimeMessage.BUTTON_EVENT:
        case PrimeMessage.STORAGE_DATA:
        case PrimeMessage.DISPLAY_STATUS:
        case PrimeMessage.FIRMWARE_STATUS:
            break;
        default: {
            if (data.r !== null && data.i) {
                for (const portID of this._motors.keys()) {
                    const motor = this.motor(portID);
                    if (motor && motor.pendingPromiseId === data.i) {
                        motor.pendingPromiseFunction();
                    }
                }
            }
            break;
        }
        }
    }

    _registerMotor (portNum, type) {
        if (type === PrimeIO.MOTOR_MEDIUM || type === PrimeIO.MOTOR_LARGE) {
            this._motors[portNum] = new PrimeMotor(this, portNum);
        }
    }
}

module.exports = PrimeHub;
