const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const formatMessage = require('format-message');
const uid = require('../../util/uid');
// const log = require('../../util/log');
const Base64Util = require('../../util/base64-util');
const BTSession = require('../../io/btSession');
const MathUtil = require('../../util/math-util');

// TODO: Refactor/rename all these high level primitives to be clearer/match

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNDBweCIgaGVpZ2h0PSI0MHB4IiB2aWV3Qm94PSIwIDAgNDAgNDAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDUwLjIgKDU1MDQ3KSAtIGh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaCAtLT4KICAgIDx0aXRsZT5ldjMtYmxvY2staWNvbjwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPjwvZGVmcz4KICAgIDxnIGlkPSJldjMtYmxvY2staWNvbiIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9ImV2MyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNS41MDAwMDAsIDMuNTAwMDAwKSIgZmlsbC1ydWxlPSJub256ZXJvIj4KICAgICAgICAgICAgPHJlY3QgaWQ9IlJlY3RhbmdsZS1wYXRoIiBzdHJva2U9IiM3Qzg3QTUiIGZpbGw9IiNGRkZGRkYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgeD0iMC41IiB5PSIzLjU5IiB3aWR0aD0iMjgiIGhlaWdodD0iMjUuODEiIHJ4PSIxIj48L3JlY3Q+CiAgICAgICAgICAgIDxyZWN0IGlkPSJSZWN0YW5nbGUtcGF0aCIgc3Ryb2tlPSIjN0M4N0E1IiBmaWxsPSIjRTZFN0U4IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHg9IjIuNSIgeT0iMC41IiB3aWR0aD0iMjQiIGhlaWdodD0iMzIiIHJ4PSIxIj48L3JlY3Q+CiAgICAgICAgICAgIDxyZWN0IGlkPSJSZWN0YW5nbGUtcGF0aCIgc3Ryb2tlPSIjN0M4N0E1IiBmaWxsPSIjRkZGRkZGIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHg9IjIuNSIgeT0iMTQuNSIgd2lkdGg9IjI0IiBoZWlnaHQ9IjEzIj48L3JlY3Q+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNC41LDEwLjUgTDE0LjUsMTQuNSIgaWQ9IlNoYXBlIiBzdHJva2U9IiM3Qzg3QTUiIGZpbGw9IiNFNkU3RTgiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PC9wYXRoPgogICAgICAgICAgICA8cmVjdCBpZD0iUmVjdGFuZ2xlLXBhdGgiIGZpbGw9IiM0MTQ3NTciIHg9IjQuNSIgeT0iMi41IiB3aWR0aD0iMjAiIGhlaWdodD0iMTAiIHJ4PSIxIj48L3JlY3Q+CiAgICAgICAgICAgIDxyZWN0IGlkPSJSZWN0YW5nbGUtcGF0aCIgZmlsbD0iIzdDODdBNSIgb3BhY2l0eT0iMC41IiB4PSIxMy41IiB5PSIyMC4xMyIgd2lkdGg9IjIiIGhlaWdodD0iMiIgcng9IjAuNSI+PC9yZWN0PgogICAgICAgICAgICA8cGF0aCBkPSJNOS4wNiwyMC4xMyBMMTAuNTYsMjAuMTMgQzEwLjgzNjE0MjQsMjAuMTMgMTEuMDYsMjAuMzUzODU3NiAxMS4wNiwyMC42MyBMMTEuMDYsMjEuNjMgQzExLjA2LDIxLjkwNjE0MjQgMTAuODM2MTQyNCwyMi4xMyAxMC41NiwyMi4xMyBMOS4wNiwyMi4xMyBDOC41MDc3MTUyNSwyMi4xMyA4LjA2LDIxLjY4MjI4NDcgOC4wNiwyMS4xMyBDOC4wNiwyMC41Nzc3MTUzIDguNTA3NzE1MjUsMjAuMTMgOS4wNiwyMC4xMyBaIiBpZD0iU2hhcGUiIGZpbGw9IiM3Qzg3QTUiIG9wYWNpdHk9IjAuNSI+PC9wYXRoPgogICAgICAgICAgICA8cGF0aCBkPSJNMTguOTEsMjAuMTMgTDIwLjQyLDIwLjEzIEMyMC42OTYxNDI0LDIwLjEzIDIwLjkyLDIwLjM1Mzg1NzYgMjAuOTIsMjAuNjMgTDIwLjkyLDIxLjYzIEMyMC45MiwyMS45MDYxNDI0IDIwLjY5NjE0MjQsMjIuMTMgMjAuNDIsMjIuMTMgTDE4LjkyLDIyLjEzIEMxOC4zNjc3MTUzLDIyLjEzIDE3LjkyLDIxLjY4MjI4NDcgMTcuOTIsMjEuMTMgQzE3LjkxOTk3MjYsMjAuNTgxNTk3IDE4LjM2MTYyNDUsMjAuMTM1NDg0IDE4LjkxLDIwLjEzIFoiIGlkPSJTaGFwZSIgZmlsbD0iIzdDODdBNSIgb3BhY2l0eT0iMC41IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxOS40MjAwMDAsIDIxLjEzMDAwMCkgcm90YXRlKC0xODAuMDAwMDAwKSB0cmFuc2xhdGUoLTE5LjQyMDAwMCwgLTIxLjEzMDAwMCkgIj48L3BhdGg+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik04LjIzLDE3LjUgTDUsMTcuNSBDNC43MjM4NTc2MywxNy41IDQuNSwxNy4yNzYxNDI0IDQuNSwxNyBMNC41LDE0LjUgTDEwLjUsMTQuNSBMOC42NSwxNy4yOCBDOC41NTQ2Njk2MSwxNy40MTc5MDgyIDguMzk3NjUwMDYsMTcuNTAwMTU2NiA4LjIzLDE3LjUgWiIgaWQ9IlNoYXBlIiBmaWxsPSIjN0M4N0E1IiBvcGFjaXR5PSIwLjUiPjwvcGF0aD4KICAgICAgICAgICAgPHBhdGggZD0iTTE4LjE1LDE4Ljg1IEwxNy42NSwxOS4zNSBDMTcuNTUyMzQxNiwxOS40NDQwNzU2IDE3LjQ5ODAzMzksMTkuNTc0NDE0MiAxNy41LDE5LjcxIEwxNy41LDIwIEMxNy41LDIwLjI3NjE0MjQgMTcuMjc2MTQyNCwyMC41IDE3LDIwLjUgTDE2LjUsMjAuNSBDMTYuMjIzODU3NiwyMC41IDE2LDIwLjI3NjE0MjQgMTYsMjAgQzE2LDE5LjcyMzg1NzYgMTUuNzc2MTQyNCwxOS41IDE1LjUsMTkuNSBMMTMuNSwxOS41IEMxMy4yMjM4NTc2LDE5LjUgMTMsMTkuNzIzODU3NiAxMywyMCBDMTMsMjAuMjc2MTQyNCAxMi43NzYxNDI0LDIwLjUgMTIuNSwyMC41IEwxMiwyMC41IEMxMS43MjM4NTc2LDIwLjUgMTEuNSwyMC4yNzYxNDI0IDExLjUsMjAgTDExLjUsMTkuNzEgQzExLjUwMTk2NjEsMTkuNTc0NDE0MiAxMS40NDc2NTg0LDE5LjQ0NDA3NTYgMTEuMzUsMTkuMzUgTDEwLjg1LDE4Ljg1IEMxMC42NTgyMTY3LDE4LjY1MjE4NjMgMTAuNjU4MjE2NywxOC4zMzc4MTM3IDEwLjg1LDE4LjE0IEwxMi4zNiwxNi42NSBDMTIuNDUwMjgwMywxNi41NTI4NjE3IDEyLjU3NzM5NjEsMTYuNDk4MzgzNSAxMi43MSwxNi41IEwxNi4yOSwxNi41IEMxNi40MjI2MDM5LDE2LjQ5ODM4MzUgMTYuNTQ5NzE5NywxNi41NTI4NjE3IDE2LjY0LDE2LjY1IEwxOC4xNSwxOC4xNCBDMTguMzQxNzgzMywxOC4zMzc4MTM3IDE4LjM0MTc4MzMsMTguNjUyMTg2MyAxOC4xNSwxOC44NSBaIiBpZD0iU2hhcGUiIGZpbGw9IiM3Qzg3QTUiIG9wYWNpdHk9IjAuNSI+PC9wYXRoPgogICAgICAgICAgICA8cGF0aCBkPSJNMTAuODUsMjMuNDUgTDExLjM1LDIyLjk1IEMxMS40NDc2NTg0LDIyLjg1NTkyNDQgMTEuNTAxOTY2MSwyMi43MjU1ODU4IDExLjUsMjIuNTkgTDExLjUsMjIuMyBDMTEuNSwyMi4wMjM4NTc2IDExLjcyMzg1NzYsMjEuOCAxMiwyMS44IEwxMi41LDIxLjggQzEyLjc3NjE0MjQsMjEuOCAxMywyMi4wMjM4NTc2IDEzLDIyLjMgQzEzLDIyLjU3NjE0MjQgMTMuMjIzODU3NiwyMi44IDEzLjUsMjIuOCBMMTUuNSwyMi44IEMxNS43NzYxNDI0LDIyLjggMTYsMjIuNTc2MTQyNCAxNiwyMi4zIEMxNiwyMi4wMjM4NTc2IDE2LjIyMzg1NzYsMjEuOCAxNi41LDIxLjggTDE3LDIxLjggQzE3LjI3NjE0MjQsMjEuOCAxNy41LDIyLjAyMzg1NzYgMTcuNSwyMi4zIEwxNy41LDIyLjU5IEMxNy40OTgwMzM5LDIyLjcyNTU4NTggMTcuNTUyMzQxNiwyMi44NTU5MjQ0IDE3LjY1LDIyLjk1IEwxOC4xNSwyMy40NSBDMTguMzQwNTcxNCwyMy42NDQ0MjE4IDE4LjM0MDU3MTQsMjMuOTU1NTc4MiAxOC4xNSwyNC4xNSBMMTYuNjQsMjUuNjUgQzE2LjU0OTcxOTcsMjUuNzQ3MTM4MyAxNi40MjI2MDM5LDI1LjgwMTYxNjUgMTYuMjksMjUuOCBMMTIuNzEsMjUuOCBDMTIuNTc3Mzk2MSwyNS44MDE2MTY1IDEyLjQ1MDI4MDMsMjUuNzQ3MTM4MyAxMi4zNiwyNS42NSBMMTAuODUsMjQuMTUgQzEwLjY1OTQyODYsMjMuOTU1NTc4MiAxMC42NTk0Mjg2LDIzLjY0NDQyMTggMTAuODUsMjMuNDUgWiIgaWQ9IlNoYXBlIiBmaWxsPSIjN0M4N0E1IiBvcGFjaXR5PSIwLjUiPjwvcGF0aD4KICAgICAgICAgICAgPHBhdGggZD0iTTIxLjUsMjcuNSBMMjYuNSwyNy41IEwyNi41LDMxLjUgQzI2LjUsMzIuMDUyMjg0NyAyNi4wNTIyODQ3LDMyLjUgMjUuNSwzMi41IEwyMS41LDMyLjUgTDIxLjUsMjcuNSBaIiBpZD0iU2hhcGUiIHN0cm9rZT0iI0NDNEMyMyIgZmlsbD0iI0YxNUEyOSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48L3BhdGg+CiAgICAgICAgPC9nPgogICAgPC9nPgo8L3N2Zz4=';

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

const MOTOR_PORTS = [
    {
        name: 'A',
        value: 0
    },
    {
        name: 'B',
        value: 1
    },
    {
        name: 'C',
        value: 2
    },
    {
        name: 'D',
        value: 3
    }
];

const VALID_MOTOR_PORTS = [0, 1, 2, 3];

/**
 * Array of accepted sensor ports.
 * @note These should not be translated as they correspond to labels on
 *       the EV3 hub.
 * @type {array}
 */
const SENSOR_PORTS = [
    {
        name: '1',
        value: 0
    },
    {
        name: '2',
        value: 1
    },
    {
        name: '3',
        value: 2
    },
    {
        name: '4',
        value: 3
    }
];

const VALID_SENSOR_PORTS = [0, 1, 2, 3];

// firmware pdf page 100
const EV_DEVICE_TYPES = {
    29: 'color',
    30: 'ultrasonic',
    32: 'gyro',
    16: 'touch',
    8: 'mediumMotor',
    7: 'largeMotor',
    126: 'none',
    125: 'none'
};

// firmware pdf page 100?
const EV_DEVICE_MODES = {
    touch: 0,
    color: 1,
    ultrasonic: 1,
    none: 0
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
        this._runtime.on('PROJECT_STOP_ALL', this._stopAll.bind(this));

        /**
         * State
         */
        this._sensorPorts = [];
        this._motorPorts = [];
        this._sensors = {
            distance: 0,
            brightness: 0,
            buttons: [0, 0, 0, 0]
        };
        this._motors = {
            speeds: [50, 50, 50, 50],
            positions: [0, 0, 0, 0],
            busy: [0, 0, 0, 0],
            commandId: [null, null, null, null]
        };
        this._pollingIntervalID = null;
        this._pollingCounter = 0;

        /**
         * The Bluetooth connection session for reading/writing device data.
         * @type {BTSession}
         * @private
         */
        this._bt = null;
        this._runtime.registerExtensionDevice(extensionId, this);
    }

    // TODO: keep here? / refactor
    /**
     * Called by the runtime when user wants to scan for a device.
     */
    startDeviceScan () {
        this._bt = new BTSession(this._runtime, {
            majorDeviceClass: 8,
            minorDeviceClass: 1
        }, this._onSessionConnect.bind(this), this._onSessionMessage.bind(this));
    }

    // TODO: keep here? / refactor
    /**
     * Called by the runtime when user wants to connect to a certain device.
     * @param {number} id - the id of the device to connect to.
     */
    connectDevice (id) {
        this._bt.connectDevice(id);
    }

    // TODO: keep here? / refactor
    /**
     * Called by the runtime when user wants to disconnect from the device.
     */
    disconnectSession () {
        this._bt.disconnectSession();
        window.clearInterval(this._pollingIntervalID); // TODO: window?
        this._sensorPorts = [];
        this._motorPorts = [];
        this._sensors = {
            distance: 0,
            brightness: 0,
            buttons: [0, 0, 0, 0]
        };
        this._motors = {
            speeds: [50, 50, 50, 50],
            positions: [0, 0, 0, 0],
            busy: [0, 0, 0, 0],
            commandId: [null, null, null, null]
        };
        this._pollingIntervalID = null;
    }

    // TODO: keep here? / refactor
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
        if (!this.getPeripheralIsConnected()) return 0;

        // https://shop.lego.com/en-US/EV3-Ultrasonic-Sensor-45504
        // Measures distances between one and 250 cm (one to 100 in.)
        // Accurate to +/- 1 cm (+/- .394 in.)
        let value = this._sensors.distance > 100 ? 100 : this._sensors.distance;
        value = value < 0 ? 0 : value;
        value = Math.round(100 * value) / 100;

        return value;
    }

    get brightness () {
        if (!this.getPeripheralIsConnected()) return 0;

        return this._sensors.brightness;
    }

    getMotorPosition (port) {
        if (!this.getPeripheralIsConnected()) return;

        let value = this._motors.positions[port];
        value = value % 360;
        value = value < 0 ? value * -1 : value;

        return value;
    }

    isButtonPressed (port) {
        if (!this.getPeripheralIsConnected()) return;

        return this._sensors.buttons[port];
    }

    beep (freq, time) {
        if (!this.getPeripheralIsConnected()) return;

        const cmd = [];
        cmd[0] = 15; // length
        cmd[1] = 0; // 0x00
        cmd[2] = 0; // 0x00
        cmd[3] = 0; // 0x00
        cmd[4] = 128; // 0x80 // Direct command, reply not require
        cmd[5] = 0; // 0x00
        cmd[6] = 0; // 0x00
        cmd[7] = 148; // 0x94 op: sound
        cmd[8] = 1; // 0x01 cmd: tone
        cmd[9] = 129; // 0x81 volume following in 1 byte
        cmd[10] = 2; // volume byte 1
        cmd[11] = 130; // 0x82 frequency following in 2 bytes
        cmd[12] = freq; // frequency byte 1
        cmd[13] = freq >> 8; // frequency byte 2
        cmd[14] = 130; // 0x82 time following in 2 bytes
        cmd[15] = time; // time byte 1
        cmd[16] = time >> 8; // time byte 2

        this._bt.sendMessage({
            message: Base64Util.arrayBufferToBase64(cmd),
            encoding: 'base64'
        });

        // Yield for sound duration
        // TODO: does this work?
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, time);
        });
    }

    motorTurnClockwise (port, time) {
        if (!this.getPeripheralIsConnected()) return;

        // Build up motor command
        const cmd = this._applyPrefix(0, this._motorCommand(
            BTCommand.TIMESPEED,
            this._portMask(port),
            time,
            this._motors.speeds[port],
            BTCommand.LONGRAMP
        ));

        // Send turn message
        this._bt.sendMessage({
            message: Base64Util.arrayBufferToBase64(cmd),
            encoding: 'base64'
        });

        this.coastAfter(port, time);

        // Yield for turn time + brake time
        const coastTime = 100; // TODO: calculate coasting or set flag
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, time + coastTime);
        });
    }

    motorTurnCounterClockwise (port, time) {
        if (!this.getPeripheralIsConnected()) return;

        // Build up motor command
        const cmd = this._applyPrefix(0, this._motorCommand(
            BTCommand.TIMESPEED,
            this._portMask(port),
            time,
            this._motors.speeds[port] * -1,
            BTCommand.LONGRAMP
        ));

        // Send turn message
        this._bt.sendMessage({
            message: Base64Util.arrayBufferToBase64(cmd),
            encoding: 'base64'
        });

        // Set motor to busy
        // this._motors.busy[port] = 1;

        this.coastAfter(port, time);

        // Yield for time
        const coastTime = 100; // TODO: calculate coasting or set flag
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, time + coastTime);
        });
    }

    coastAfter (port, time) {
        // Set the motor command id to check before starting coast
        const commandId = uid();
        this._motors.commandId[port] = commandId;

        // Send coast message
        setTimeout(() => {
            // Do not send coast if another motor command changed the command id.
            if (this._motors.commandId[port] === commandId) {
                this.motorCoast(port);
                this._motors.commandId[port] = null;
            }
        }, time + 1000); // add a 1 second delay so the brake takes effect
    }

    motorCoast (port) {
        if (!this.getPeripheralIsConnected()) return;

        const cmd = [];
        cmd[0] = 9; // length
        cmd[1] = 0; // length
        cmd[2] = 1; // 0x01
        cmd[3] = 0; // 0x00
        cmd[4] = 0; // 0x00
        cmd[5] = 0; // 0x00
        cmd[6] = 0; // 0x00
        cmd[7] = 163; // 0xA3 Motor brake/coast command
        cmd[8] = 0; // layer
        cmd[9] = this._portMask(port); // port output bit field
        cmd[10] = 0; // float = coast = 0

        this._bt.sendMessage({
            message: Base64Util.uint8ArrayToBase64(cmd),
            encoding: 'base64'
        });
    }

    motorRotate (port, degrees) {
        if (!this.getPeripheralIsConnected()) return;

        // Build up motor command
        const cmd = this._applyPrefix(0, this._motorCommand(
            BTCommand.STEPSPEED,
            this._portMask(port),
            degrees,
            this._motors.speeds[port],
            BTCommand.LONGRAMP
        ));

        // Send rotate message
        this._bt.sendMessage({
            message: Base64Util.arrayBufferToBase64(cmd),
            encoding: 'base64'
        });

        // Set motor to busy
        // this._motors.busy[port] = 1;

        /*
        // Yield for time
        // TODO: calculate time?
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, time);
        });
        */
    }

    motorSetPosition (port, degrees) {
        if (!this.getPeripheralIsConnected()) return;

        // Calculate degrees to turn
        let previousPos = this._motors.positions[port];
        previousPos = previousPos % 360;
        previousPos = previousPos < 0 ? previousPos * -1 : previousPos;
        const newPos = degrees % 360;
        let degreesToTurn = 0;
        let direction = 1;
        if (previousPos <= newPos) {
            degreesToTurn = newPos - previousPos;
        } else {
            degreesToTurn = previousPos - newPos;
            direction = -1;
        }

        // Build up motor command
        const cmd = this._applyPrefix(0, this._motorCommand(
            BTCommand.STEPSPEED,
            this._portMask(port),
            degreesToTurn,
            this._motors.speeds[port] * direction,
            BTCommand.LONGRAMP
        ));

        // Send rotate message
        this._bt.sendMessage({
            message: Base64Util.arrayBufferToBase64(cmd),
            encoding: 'base64'
        });

        // Set motor to busy
        // this._motors.busy[port] = 1;

        /*
        // Yield for time
        // TODO: calculate time?
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, time);
        });
        */
    }

    motorSetPower (port, power) {
        if (!this.getPeripheralIsConnected()) return;

        this._motors.speeds[port] = power;
    }

    // *******
    // PRIVATE
    // *******

    _stopAll () {
        this._stopAllMotors();
        this._stopSound();
    }

    _stopSound () {
        if (!this.getPeripheralIsConnected()) return;

        const cmd = [];
        cmd[0] = 7; // Command size, Little Endian. Command size not including these 2 bytes
        cmd[1] = 0; // Command size, Little Endian. Command size not including these 2 bytes
        cmd[2] = 0; // Message counter, Little Endian. Forth running counter
        cmd[3] = 0; // Message counter, Little Endian. Forth running counter
        cmd[4] = 128; // 0x80 // Command type. See defines above : Direct command, reply not require
        cmd[5] = 0; // Reservation (allocation) of global and local variables
        cmd[6] = 0; // Reservation (allocation) of global and local variables
        cmd[7] = 148; // 0x94 op: sound
        cmd[8] = 0; // 0x00 cmd: break 0x00 (Stop current sound playback)

        this._bt.sendMessage({
            message: Base64Util.arrayBufferToBase64(cmd),
            encoding: 'base64'
        });
    }

    _stopAllMotors () {
        for (let i = 0; i < this._motorPorts.length; i++) {
            if (this._motorPorts[i] !== 'none') {
                this.motorCoast(i);
            }
        }
    }

    // TODO: keep here? / refactor
    _applyPrefix (n, cmd) {
        // TODO: document
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

    // TODO: keep here? / refactor
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
        // TODO: document
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

    // TODO: keep here? / refactor
    _onSessionConnect () {
        // start polling
        // TODO: window?
        this._pollingIntervalID = window.setInterval(this._getSessionData.bind(this), 150);
    }

    // TODO: keep here? / refactor
    _getSessionData () {
        if (!this.getPeripheralIsConnected()) {
            window.clearInterval(this._pollingIntervalID);
            return;
        }

        const cmd = []; // a compound command

        // HEADER
        cmd[0] = null; // calculate length later
        cmd[1] = 0; // ...
        cmd[2] = 1; // message counter // TODO: ?????
        cmd[3] = 0; // message counter // TODO: ?????
        cmd[4] = 0; // command type: direct command
        cmd[5] = null; // calculate vars length later
        cmd[6] = 0; // ...

        let sensorCount = 0;
        // Either request device list or request sensor data ??
        if (this._pollingCounter % 20 === 0) {
            // GET DEVICE LIST
            cmd[7] = 152; // 0x98 op: get device list
            cmd[8] = 129; // 0x81 LENGTH // TODO: ?????
            cmd[9] = 33; // 0x21 ARRAY // TODO: ?????
            cmd[10] = 96; // 0x60 CHANGED // TODO: ?????
            cmd[11] = 225; // 0xE1 size of global var - 1 byte to follow
            cmd[12] = 32; // 0x20 global var index "0" 0b00100000

            // Command and payload lengths
            cmd[0] = cmd.length - 2;
            cmd[5] = 33;

            // Clear sensor data
            this._updateDevices = true;
            this._sensorPorts = [];
            this._motorPorts = [];
            // TODO: figure out when/how to clear out sensor data

        } else {

            let index = 7;

            // GET SENSOR VALUES
            // eslint-disable-next-line no-undefined
            if (!this._sensorPorts.includes(undefined)) {
                for (let i = 0; i < 4; i++) {
                    if (this._sensorPorts[i] !== 'none') {
                        cmd[index + 0] = 157; // 0x9D op: get sensor value
                        cmd[index + 1] = 0; // layer
                        cmd[index + 2] = i; // port
                        cmd[index + 3] = 0; // do not change type
                        cmd[index + 4] = EV_DEVICE_MODES[this._sensorPorts[i]]; // mode
                        cmd[index + 5] = 225; // 0xE1 one byte to follow
                        cmd[index + 6] = sensorCount * 4; // global index
                        index += 7;
                    }
                    sensorCount++;
                }
            }

            // GET MOTOR POSITION VALUES
            // eslint-disable-next-line no-undefined
            if (!this._motorPorts.includes(undefined)) {
                for (let i = 0; i < 4; i++) {
                    cmd[index + 0] = 179; // 0XB3 op: get motor position value
                    cmd[index + 1] = 0; // layer
                    cmd[index + 2] = i; // port
                    cmd[index + 3] = 225; // 0xE1 byte following
                    cmd[index + 4] = sensorCount * 4; // global index
                    index += 5;
                    sensorCount++;
                }
            }

            // Command and payload lengths
            cmd[0] = cmd.length - 2;
            cmd[5] = sensorCount * 4;
        }

        // GET MOTOR BUSY STATES
        /*
        for (let i = 0; i < this._motorPorts.length; i++) {
            if (this._motorPorts[i] !== 'none') {
                sensorCount++;
                compoundCommand[compoundCommandIndex + 0] = 169; // 0xA9 op: test if output port is busy
                compoundCommand[compoundCommandIndex + 1] = 0; // layer
                compoundCommand[compoundCommandIndex + 2] = this._portMask(i); // output bit field
                compoundCommand[compoundCommandIndex + 3] = 225; // 0xE1 1 byte following
                compoundCommand[compoundCommandIndex + 4] = sensorCount * 4; // global index
                compoundCommandIndex += 5;
            }
        }
        */

        this._bt.sendMessage({
            message: Base64Util.uint8ArrayToBase64(cmd),
            encoding: 'base64'
        });

        this._pollingCounter++;
    }

    // TODO: rename and document better
    _onSessionMessage (params) {
        const message = params.message;
        const array = Base64Util.base64ToUint8Array(message);
        // log.info(`received array: ${array}`);

        if (array.length < 35) { // TODO: find safer solution
            return; // don't parse results that aren't sensor data list or device list
        }

        if (this._updateDevices) {
            // READ DEVICE LIST
            this._sensorPorts[0] = EV_DEVICE_TYPES[array[5]] ? EV_DEVICE_TYPES[array[5]] : 'none';
            this._sensorPorts[1] = EV_DEVICE_TYPES[array[6]] ? EV_DEVICE_TYPES[array[6]] : 'none';
            this._sensorPorts[2] = EV_DEVICE_TYPES[array[7]] ? EV_DEVICE_TYPES[array[7]] : 'none';
            this._sensorPorts[3] = EV_DEVICE_TYPES[array[8]] ? EV_DEVICE_TYPES[array[8]] : 'none';
            this._motorPorts[0] = EV_DEVICE_TYPES[array[21]] ? EV_DEVICE_TYPES[array[21]] : 'none';
            this._motorPorts[1] = EV_DEVICE_TYPES[array[22]] ? EV_DEVICE_TYPES[array[22]] : 'none';
            this._motorPorts[2] = EV_DEVICE_TYPES[array[23]] ? EV_DEVICE_TYPES[array[23]] : 'none';
            this._motorPorts[3] = EV_DEVICE_TYPES[array[24]] ? EV_DEVICE_TYPES[array[24]] : 'none';
            // log.info(`sensor ports: ${this._sensorPorts}`);
            // log.info(`motor ports: ${this._motorPorts}`);
            this._updateDevices = false;
            // eslint-disable-next-line no-undefined
        } else if (!this._sensorPorts.includes(undefined) && !this._motorPorts.includes(undefined)) {
            // READ SENSOR VALUES
            let offset = 5; // start reading sensor values at byte 5
            for (let i = 0; i < 4; i++) {
                const value = this._array2float([
                    array[offset],
                    array[offset + 1],
                    array[offset + 2],
                    array[offset + 3]
                ]);
                if (EV_DEVICE_LABELS[this._sensorPorts[i]] === 'button') {
                    // Read a button value per port
                    this._sensors.buttons[i] = value ? value : 0;
                } else if (EV_DEVICE_LABELS[this._sensorPorts[i]]) { // if valid
                    // Read brightness / distance values and set to 0 if null
                    this._sensors[EV_DEVICE_LABELS[this._sensorPorts[i]]] = value ? value : 0;
                }
                // log.info(`${JSON.stringify(this._sensors)}`);
                offset += 4;
            }
            // READ MOTOR POSITION VALUES
            for (let i = 0; i < 4; i++) {
                let value = this._tachoValue([ // from Paula
                    array[offset],
                    array[offset + 1],
                    array[offset + 2],
                    array[offset + 3]
                ]);
                if (value > 0x7fffffff) { // from Paula
                    value = value - 0x100000000;
                }
                if (value) {
                    this._motors.positions[i] = value;
                }
                // log.info(`motor positions: ${this._motors.positions}`);
                offset += 4;
            }
        }

        /*
        // READ MOTOR BUSY STATES
        /*
        for (let i = 0; i < this._motorPorts.length; i++) {
            if (this._motorPorts[i] !== 'none') {
                const busy = array[offset];
                if (busy === 0 && this._motors.busy[i]) {
                    this.motorCoast(i); // always set to coast for now, but really should only do for recently moved
                    this._motors.busy[i] = 0; // reset busy
                }
                // this._motors.positions[i] = value;
                log.info(`motor ${i} busy: ${busy}`);
                offset += 1;
            }
        }
        */
    }

    // TODO: keep here? / refactor
    _portMask (port) {
        // TODO: convert to enum or lookup
        let p = null;
        if (port === 0) {
            p = 1;
        } else if (port === 1) {
            p = 2;
        } else if (port === 2) {
            p = 4;
        } else if (port === 3) {
            p = 8;
        }

        return p;
    }

    // TODO: keep here? / refactor
    _tachoValue (list) {
        const value = list[0] + (list[1] * 256) + (list[2] * 256 * 256) + (list[3] * 256 * 256 * 256);
        return value;
    }

    // TODO: keep here? / refactor
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
            name: 'LEGO EV3',
            blockIconURI: blockIconURI,
            showStatusButton: true,
            blocks: [
                {
                    opcode: 'motorTurnClockwise',
                    text: formatMessage({
                        id: 'ev3.motorTurnClockwise',
                        default: 'motor [PORT] turn this way for [TIME] seconds',
                        description: 'turn a motor clockwise for some time'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'motorPorts',
                            defaultValue: 'A'
                        },
                        TIME: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'motorTurnCounterClockwise',
                    text: formatMessage({
                        id: 'ev3.motorTurnCounterClockwise',
                        default: 'motor [PORT] turn that way for [TIME] seconds',
                        description: 'turn a motor counter-clockwise for some time'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'motorPorts',
                            defaultValue: 'A'
                        },
                        TIME: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                /* {
                    opcode: 'motorRotate',
                    text: 'motor [PORT] rotate [DEGREES] degrees',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'motorPorts',
                            defaultValue: 'A'
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
                            defaultValue: 'A'
                        },
                        DEGREES: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 90
                        }
                    }
                }, */
                {
                    opcode: 'motorSetPower',
                    text: formatMessage({
                        id: 'ev3.motorSetPower',
                        default: 'motor [PORT] set power [POWER] %',
                        description: 'set a motor\'s power to some value'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'motorPorts',
                            defaultValue: 'A'
                        },
                        POWER: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 50
                        }
                    }
                },
                {
                    opcode: 'getMotorPosition',
                    text: formatMessage({
                        id: 'ev3.getMotorPosition',
                        default: 'motor [PORT] position',
                        description: 'get the measured degrees a motor has turned'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'motorPorts',
                            defaultValue: 'A'
                        }
                    }
                },
                {
                    opcode: 'whenButtonPressed',
                    text: formatMessage({
                        id: 'ev3.whenButtonPressed',
                        default: 'when button [PORT] pressed',
                        description: 'when a button connected to a port is pressed'
                    }),
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
                    text: formatMessage({
                        id: 'ev3.whenDistanceLessThan',
                        default: 'when distance < [DISTANCE]',
                        description: 'when the value measured by the distance sensor is less than some value'
                    }),
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
                    text: formatMessage({
                        id: 'ev3.whenBrightnessLessThan',
                        default: 'when brightness < [DISTANCE]',
                        description: 'when value measured by brightness sensor is less than some value'
                    }),
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
                    text: formatMessage({
                        id: 'ev3.buttonPressed',
                        default: 'button [PORT] pressed?',
                        description: 'is a button on some port pressed?'
                    }),
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
                    text: formatMessage({
                        id: 'ev3.getDistance',
                        default: 'distance',
                        description: 'gets measured distance'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'getBrightness',
                    text: formatMessage({
                        id: 'ev3.getBrightness',
                        default: 'brightness',
                        description: 'gets measured brightness'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'beep',
                    text: formatMessage({
                        id: 'ev3.beepNote',
                        default: 'beep note [NOTE] for [TIME] secs',
                        description: 'play some note on EV3 for some time'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        NOTE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 60
                        },
                        TIME: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0.5
                        }
                    }
                }
            ],
            menus: {
                motorPorts: this._buildMenu(MOTOR_PORTS),
                sensorPorts: this._buildMenu(SENSOR_PORTS)
            }
        };
    }

    // TODO: redo?
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
            obj.value = String(index);
            return obj;
        });
    }

    motorTurnClockwise (args) {
        const port = Cast.toNumber(args.PORT);
        let time = Cast.toNumber(args.TIME) * 1000;
        time = MathUtil.clamp(time, 0, 15000);

        if (!VALID_MOTOR_PORTS.includes(port)) {
            return;
        }

        return this._device.motorTurnClockwise(port, time);
    }

    motorTurnCounterClockwise (args) {
        const port = Cast.toNumber(args.PORT);
        let time = Cast.toNumber(args.TIME) * 1000;
        time = MathUtil.clamp(time, 0, 15000);

        if (!VALID_MOTOR_PORTS.includes(port)) {
            return;
        }

        return this._device.motorTurnCounterClockwise(port, time);
    }

    /*
    motorRotate (args) {
        const port = Cast.toNumber(args.PORT);
        const degrees = Cast.toNumber(args.DEGREES);

        if (!VALID_MOTOR_PORTS.includes(port)) {
            return;
        }

        this._device.motorRotate(port, degrees);
        return;
    }

    motorSetPosition (args) {
        const port = Cast.toNumber(args.PORT);
        const degrees = Cast.toNumber(args.DEGREES);

        if (!VALID_MOTOR_PORTS.includes(port)) {
            return;
        }

        this._device.motorSetPosition(port, degrees);
        return;
    }
    */

    motorSetPower (args) {
        const port = Cast.toNumber(args.PORT);
        const power = MathUtil.clamp(Cast.toNumber(args.POWER), 0, 100);

        if (!VALID_MOTOR_PORTS.includes(port)) {
            return;
        }

        this._device.motorSetPower(port, power);
        return;
    }

    getMotorPosition (args) {
        const port = Cast.toNumber(args.PORT);

        if (!VALID_MOTOR_PORTS.includes(port)) {
            return;
        }

        return this._device.getMotorPosition(port);
    }

    whenButtonPressed (args) {
        const port = Cast.toNumber(args.PORT);

        if (!VALID_SENSOR_PORTS.includes(port)) {
            return;
        }

        return this._device.isButtonPressed(port);
    }

    whenDistanceLessThan (args) {
        const distance = MathUtil.clamp(Cast.toNumber(args.DISTANCE), 0, 100);

        return this._device.distance < distance;
    }

    whenBrightnessLessThan (args) {
        const brightness = MathUtil.clamp(Cast.toNumber(args.DISTANCE), 0, 100);

        return this._device.brightness < brightness;
    }

    buttonPressed (args) {
        const port = Cast.toNumber(args.PORT);

        if (!VALID_SENSOR_PORTS.includes(port)) {
            return;
        }

        return this._device.isButtonPressed(port);
    }

    getDistance () {
        return this._device.distance;
    }

    getBrightness () {
        return this._device.brightness;
    }

    beep (args) {
        const note = MathUtil.clamp(Cast.toNumber(args.NOTE), 47, 99); // valid EV3 sounds
        let time = Cast.toNumber(args.TIME) * 1000;
        time = MathUtil.clamp(time, 0, 3000);

        if (time === 0) {
            return; // don't send a beep time of 0
        }

        // https://en.wikipedia.org/wiki/MIDI_tuning_standard#Frequency_values
        const freq = Math.pow(2, ((note - 69 + 12) / 12)) * 440;

        return this._device.beep(freq, time);
    }
}

module.exports = Scratch3Ev3Blocks;
