const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const formatMessage = require('format-message');
const uid = require('../../util/uid');
const BT = require('../../io/bt');
const Base64Util = require('../../util/base64-util');
const MathUtil = require('../../util/math-util');
const log = require('../../util/log');

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNDBweCIgaGVpZ2h0PSI0MHB4IiB2aWV3Qm94PSIwIDAgNDAgNDAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDUwLjIgKDU1MDQ3KSAtIGh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaCAtLT4KICAgIDx0aXRsZT5ldjMtYmxvY2staWNvbjwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPjwvZGVmcz4KICAgIDxnIGlkPSJldjMtYmxvY2staWNvbiIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9ImV2MyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNS41MDAwMDAsIDMuNTAwMDAwKSIgZmlsbC1ydWxlPSJub256ZXJvIj4KICAgICAgICAgICAgPHJlY3QgaWQ9IlJlY3RhbmdsZS1wYXRoIiBzdHJva2U9IiM3Qzg3QTUiIGZpbGw9IiNGRkZGRkYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgeD0iMC41IiB5PSIzLjU5IiB3aWR0aD0iMjgiIGhlaWdodD0iMjUuODEiIHJ4PSIxIj48L3JlY3Q+CiAgICAgICAgICAgIDxyZWN0IGlkPSJSZWN0YW5nbGUtcGF0aCIgc3Ryb2tlPSIjN0M4N0E1IiBmaWxsPSIjRTZFN0U4IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHg9IjIuNSIgeT0iMC41IiB3aWR0aD0iMjQiIGhlaWdodD0iMzIiIHJ4PSIxIj48L3JlY3Q+CiAgICAgICAgICAgIDxyZWN0IGlkPSJSZWN0YW5nbGUtcGF0aCIgc3Ryb2tlPSIjN0M4N0E1IiBmaWxsPSIjRkZGRkZGIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHg9IjIuNSIgeT0iMTQuNSIgd2lkdGg9IjI0IiBoZWlnaHQ9IjEzIj48L3JlY3Q+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNC41LDEwLjUgTDE0LjUsMTQuNSIgaWQ9IlNoYXBlIiBzdHJva2U9IiM3Qzg3QTUiIGZpbGw9IiNFNkU3RTgiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PC9wYXRoPgogICAgICAgICAgICA8cmVjdCBpZD0iUmVjdGFuZ2xlLXBhdGgiIGZpbGw9IiM0MTQ3NTciIHg9IjQuNSIgeT0iMi41IiB3aWR0aD0iMjAiIGhlaWdodD0iMTAiIHJ4PSIxIj48L3JlY3Q+CiAgICAgICAgICAgIDxyZWN0IGlkPSJSZWN0YW5nbGUtcGF0aCIgZmlsbD0iIzdDODdBNSIgb3BhY2l0eT0iMC41IiB4PSIxMy41IiB5PSIyMC4xMyIgd2lkdGg9IjIiIGhlaWdodD0iMiIgcng9IjAuNSI+PC9yZWN0PgogICAgICAgICAgICA8cGF0aCBkPSJNOS4wNiwyMC4xMyBMMTAuNTYsMjAuMTMgQzEwLjgzNjE0MjQsMjAuMTMgMTEuMDYsMjAuMzUzODU3NiAxMS4wNiwyMC42MyBMMTEuMDYsMjEuNjMgQzExLjA2LDIxLjkwNjE0MjQgMTAuODM2MTQyNCwyMi4xMyAxMC41NiwyMi4xMyBMOS4wNiwyMi4xMyBDOC41MDc3MTUyNSwyMi4xMyA4LjA2LDIxLjY4MjI4NDcgOC4wNiwyMS4xMyBDOC4wNiwyMC41Nzc3MTUzIDguNTA3NzE1MjUsMjAuMTMgOS4wNiwyMC4xMyBaIiBpZD0iU2hhcGUiIGZpbGw9IiM3Qzg3QTUiIG9wYWNpdHk9IjAuNSI+PC9wYXRoPgogICAgICAgICAgICA8cGF0aCBkPSJNMTguOTEsMjAuMTMgTDIwLjQyLDIwLjEzIEMyMC42OTYxNDI0LDIwLjEzIDIwLjkyLDIwLjM1Mzg1NzYgMjAuOTIsMjAuNjMgTDIwLjkyLDIxLjYzIEMyMC45MiwyMS45MDYxNDI0IDIwLjY5NjE0MjQsMjIuMTMgMjAuNDIsMjIuMTMgTDE4LjkyLDIyLjEzIEMxOC4zNjc3MTUzLDIyLjEzIDE3LjkyLDIxLjY4MjI4NDcgMTcuOTIsMjEuMTMgQzE3LjkxOTk3MjYsMjAuNTgxNTk3IDE4LjM2MTYyNDUsMjAuMTM1NDg0IDE4LjkxLDIwLjEzIFoiIGlkPSJTaGFwZSIgZmlsbD0iIzdDODdBNSIgb3BhY2l0eT0iMC41IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxOS40MjAwMDAsIDIxLjEzMDAwMCkgcm90YXRlKC0xODAuMDAwMDAwKSB0cmFuc2xhdGUoLTE5LjQyMDAwMCwgLTIxLjEzMDAwMCkgIj48L3BhdGg+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik04LjIzLDE3LjUgTDUsMTcuNSBDNC43MjM4NTc2MywxNy41IDQuNSwxNy4yNzYxNDI0IDQuNSwxNyBMNC41LDE0LjUgTDEwLjUsMTQuNSBMOC42NSwxNy4yOCBDOC41NTQ2Njk2MSwxNy40MTc5MDgyIDguMzk3NjUwMDYsMTcuNTAwMTU2NiA4LjIzLDE3LjUgWiIgaWQ9IlNoYXBlIiBmaWxsPSIjN0M4N0E1IiBvcGFjaXR5PSIwLjUiPjwvcGF0aD4KICAgICAgICAgICAgPHBhdGggZD0iTTE4LjE1LDE4Ljg1IEwxNy42NSwxOS4zNSBDMTcuNTUyMzQxNiwxOS40NDQwNzU2IDE3LjQ5ODAzMzksMTkuNTc0NDE0MiAxNy41LDE5LjcxIEwxNy41LDIwIEMxNy41LDIwLjI3NjE0MjQgMTcuMjc2MTQyNCwyMC41IDE3LDIwLjUgTDE2LjUsMjAuNSBDMTYuMjIzODU3NiwyMC41IDE2LDIwLjI3NjE0MjQgMTYsMjAgQzE2LDE5LjcyMzg1NzYgMTUuNzc2MTQyNCwxOS41IDE1LjUsMTkuNSBMMTMuNSwxOS41IEMxMy4yMjM4NTc2LDE5LjUgMTMsMTkuNzIzODU3NiAxMywyMCBDMTMsMjAuMjc2MTQyNCAxMi43NzYxNDI0LDIwLjUgMTIuNSwyMC41IEwxMiwyMC41IEMxMS43MjM4NTc2LDIwLjUgMTEuNSwyMC4yNzYxNDI0IDExLjUsMjAgTDExLjUsMTkuNzEgQzExLjUwMTk2NjEsMTkuNTc0NDE0MiAxMS40NDc2NTg0LDE5LjQ0NDA3NTYgMTEuMzUsMTkuMzUgTDEwLjg1LDE4Ljg1IEMxMC42NTgyMTY3LDE4LjY1MjE4NjMgMTAuNjU4MjE2NywxOC4zMzc4MTM3IDEwLjg1LDE4LjE0IEwxMi4zNiwxNi42NSBDMTIuNDUwMjgwMywxNi41NTI4NjE3IDEyLjU3NzM5NjEsMTYuNDk4MzgzNSAxMi43MSwxNi41IEwxNi4yOSwxNi41IEMxNi40MjI2MDM5LDE2LjQ5ODM4MzUgMTYuNTQ5NzE5NywxNi41NTI4NjE3IDE2LjY0LDE2LjY1IEwxOC4xNSwxOC4xNCBDMTguMzQxNzgzMywxOC4zMzc4MTM3IDE4LjM0MTc4MzMsMTguNjUyMTg2MyAxOC4xNSwxOC44NSBaIiBpZD0iU2hhcGUiIGZpbGw9IiM3Qzg3QTUiIG9wYWNpdHk9IjAuNSI+PC9wYXRoPgogICAgICAgICAgICA8cGF0aCBkPSJNMTAuODUsMjMuNDUgTDExLjM1LDIyLjk1IEMxMS40NDc2NTg0LDIyLjg1NTkyNDQgMTEuNTAxOTY2MSwyMi43MjU1ODU4IDExLjUsMjIuNTkgTDExLjUsMjIuMyBDMTEuNSwyMi4wMjM4NTc2IDExLjcyMzg1NzYsMjEuOCAxMiwyMS44IEwxMi41LDIxLjggQzEyLjc3NjE0MjQsMjEuOCAxMywyMi4wMjM4NTc2IDEzLDIyLjMgQzEzLDIyLjU3NjE0MjQgMTMuMjIzODU3NiwyMi44IDEzLjUsMjIuOCBMMTUuNSwyMi44IEMxNS43NzYxNDI0LDIyLjggMTYsMjIuNTc2MTQyNCAxNiwyMi4zIEMxNiwyMi4wMjM4NTc2IDE2LjIyMzg1NzYsMjEuOCAxNi41LDIxLjggTDE3LDIxLjggQzE3LjI3NjE0MjQsMjEuOCAxNy41LDIyLjAyMzg1NzYgMTcuNSwyMi4zIEwxNy41LDIyLjU5IEMxNy40OTgwMzM5LDIyLjcyNTU4NTggMTcuNTUyMzQxNiwyMi44NTU5MjQ0IDE3LjY1LDIyLjk1IEwxOC4xNSwyMy40NSBDMTguMzQwNTcxNCwyMy42NDQ0MjE4IDE4LjM0MDU3MTQsMjMuOTU1NTc4MiAxOC4xNSwyNC4xNSBMMTYuNjQsMjUuNjUgQzE2LjU0OTcxOTcsMjUuNzQ3MTM4MyAxNi40MjI2MDM5LDI1LjgwMTYxNjUgMTYuMjksMjUuOCBMMTIuNzEsMjUuOCBDMTIuNTc3Mzk2MSwyNS44MDE2MTY1IDEyLjQ1MDI4MDMsMjUuNzQ3MTM4MyAxMi4zNiwyNS42NSBMMTAuODUsMjQuMTUgQzEwLjY1OTQyODYsMjMuOTU1NTc4MiAxMC42NTk0Mjg2LDIzLjY0NDQyMTggMTAuODUsMjMuNDUgWiIgaWQ9IlNoYXBlIiBmaWxsPSIjN0M4N0E1IiBvcGFjaXR5PSIwLjUiPjwvcGF0aD4KICAgICAgICAgICAgPHBhdGggZD0iTTIxLjUsMjcuNSBMMjYuNSwyNy41IEwyNi41LDMxLjUgQzI2LjUsMzIuMDUyMjg0NyAyNi4wNTIyODQ3LDMyLjUgMjUuNSwzMi41IEwyMS41LDMyLjUgTDIxLjUsMjcuNSBaIiBpZD0iU2hhcGUiIHN0cm9rZT0iI0NDNEMyMyIgZmlsbD0iI0YxNUEyOSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48L3BhdGg+CiAgICAgICAgPC9nPgogICAgPC9nPgo8L3N2Zz4=';

/**
 * Enum for Ev3 direct command types.
 * Found in the 'EV3 Communication Developer Kit', section 4, page 24, at
 * https://education.lego.com/en-us/support/mindstorms-ev3/developer-kits.
 * @readonly
 * @enum {number}
 */
const Ev3Command = {
    DIRECT_COMMAND_REPLY: 0x00,
    DIRECT_COMMAND_NO_REPLY: 0x80,
    DIRECT_REPLY: 0x02
};

/**
 * Enum for Ev3 commands opcodes.
 * Found in the 'EV3 Firmware Developer Kit', section 4, page 10, at
 * https://education.lego.com/en-us/support/mindstorms-ev3/developer-kits.
 * @readonly
 * @enum {number}
 */
const Ev3Opcode = {
    OPOUTPUT_STEP_SPEED: 0xAE,
    OPOUTPUT_TIME_SPEED: 0xAF,
    OPOUTPUT_STOP: 0xA3,
    OPOUTPUT_RESET: 0xA2,
    OPOUTPUT_STEP_SYNC: 0xB0,
    OPOUTPUT_TIME_SYNC: 0xB1,
    OPOUTPUT_GET_COUNT: 0xB3,
    OPSOUND: 0x94,
    OPSOUND_CMD_TONE: 1,
    OPSOUND_CMD_STOP: 0,
    OPINPUT_DEVICE_LIST: 0x98,
    OPINPUT_READSI: 0x9D
};

/**
 * Enum for Ev3 values used as arguments to various opcodes.
 * Found in the 'EV3 Firmware Developer Kit', section4, page 10, at
 * https://education.lego.com/en-us/support/mindstorms-ev3/developer-kits.
 * @readonly
 * @enum {string}
 */
const Ev3Value = {
    LAYER: 0x00, // always 0, chained EV3s not supported
    NUM8: 0x81, // "1 byte to follow"
    NUM16: 0x82, // "2 bytes to follow"
    NUM32: 0x83, // "4 bytes to follow"
    COAST: 0x00,
    BRAKE: 0x01,
    LONG_RAMP: 50,
    DO_NOT_CHANGE_TYPE: 0
};

/**
 * Enum for Ev3 device type numbers.
 * Found in the 'EV3 Firmware Developer Kit', section 5, page 100, at
 * https://education.lego.com/en-us/support/mindstorms-ev3/developer-kits.
 * @readonly
 * @enum {string}
 */
const Ev3Device = {
    29: 'color',
    30: 'ultrasonic',
    32: 'gyro',
    16: 'touch',
    8: 'mediumMotor',
    7: 'largeMotor',
    126: 'none',
    125: 'none'
};

/**
 * Enum for Ev3 device modes.
 * Found in the 'EV3 Firmware Developer Kit', section 5, page 100, at
 * https://education.lego.com/en-us/support/mindstorms-ev3/developer-kits.
 * @readonly
 * @enum {number}
 */
const Ev3Mode = {
    touch: 0, // touch
    color: 1, // ambient
    ultrasonic: 1, // inch
    none: 0
};

/**
 * Enum for Ev3 device labels used in the Scratch blocks/UI.
 * @readonly
 * @enum {string}
 */
const Ev3Label = { // TODO: rename?
    touch: 'button',
    color: 'brightness',
    ultrasonic: 'distance'
};

/**
 * Manage power, direction, and timers for one EV3 motor.
 */
class EV3Motor {

    /**
     * Construct a EV3 Motor instance, which could be of type 'largeMotor' or
     * 'mediumMotor'.
     *
     * @param {EV3} parent - the EV3 peripheral which owns this motor.
     * @param {int} index - the zero-based index of this motor on its parent peripheral.
     * @param {string} type - the type of motor (i.e. 'largeMotor' or 'mediumMotor').
     */
    constructor (parent, index, type) {
        /**
         * The EV3 peripheral which owns this motor.
         * @type {EV3}
         * @private
         */
        this._parent = parent;

        /**
         * The zero-based index of this motor on its parent peripheral.
         * @type {int}
         * @private
         */
        this._index = index;

        /**
         * The type of EV3 motor this could be: 'largeMotor' or 'mediumMotor'.
         * @type {string}
         * @private
         */
        this._type = type;

        /**
         * This motor's current direction: 1 for "clockwise" or -1 for "counterclockwise"
         * @type {number}
         * @private
         */
        this._direction = 1;

        /**
         * This motor's current power level, in the range [0,100].
         * @type {number}
         * @private
         */
        this._power = 100;

        /**
         * This motor's current position, in the range [0,360].
         * @type {number}
         * @private
         */
        this._position = 0;

        /**
         * An ID for the current coast command, to help override multiple coast
         * commands sent in succession.
         * @type {number}
         * @private
         */
        this._commandID = null;

        /**
         * A delay, in milliseconds, to add to coasting, to make sure that a brake
         * first takes effect if one was sent.
         * @type {number}
         * @private
         */
        this._coastDelay = 1000;
    }

    /**
     * @return {string} - this motor's type: 'largeMotor' or 'mediumMotor'
     */
    get type () {
        return this._type;
    }

    /**
     * @param {string} value - this motor's new type: 'largeMotor' or 'mediumMotor'
     */
    set type (value) {
        this._type = value;
    }

    /**
     * @return {int} - this motor's current direction: 1 for "clockwise" or -1 for "counterclockwise"
     */
    get direction () {
        return this._direction;
    }

    /**
     * @param {int} value - this motor's new direction: 1 for "clockwise" or -1 for "counterclockwise"
     */
    set direction (value) {
        if (value < 0) {
            this._direction = -1;
        } else {
            this._direction = 1;
        }
    }

    /**
     * @return {int} - this motor's current power level, in the range [0,100].
     */
    get power () {
        return this._power;
    }

    /**
     * @param {int} value - this motor's new power level, in the range [0,100].
     */
    set power (value) {
        this._power = value;
    }

    /**
     * @return {int} - this motor's current position, in the range [0,360].
     */
    get position () {
        let value = this._position;
        value = value % 360;
        value = value < 0 ? value * -1 : value;

        return value;
    }

    /**
     * @param {int} array - this motor's new position, in the range [0,360].
     */
    set position (array) {
        // tachoValue from Paula
        let value = array[0] + (array[1] * 256) + (array[2] * 256 * 256) + (array[3] * 256 * 256 * 256);
        if (value > 0x7fffffff) {
            value = value - 0x100000000;
        }
        this._position = value;
    }

    /**
     * Turn this motor on for a specific duration.
     * Found in the 'EV3 Firmware Developer Kit', page 56, at
     * https://education.lego.com/en-us/support/mindstorms-ev3/developer-kits.
     *
     * Opcode arguments:
     * (Data8) LAYER – Specify chain layer number [0 - 3]
     * (Data8) NOS – Output bit field [0x00 – 0x0F]
     * (Data8) SPEED – Power level, [-100 – 100]
     * (Data32) STEP1 – Time in milliseconds for ramp up
     * (Data32) STEP2 – Time in milliseconds for continues run
     * (Data32) STEP3 – Time in milliseconds for ramp down
     * (Data8) BRAKE - Specify break level [0: Float, 1: Break]
     *
     * @param {number} milliseconds - run the motor for this long.
     */
    turnOnFor (milliseconds) {
        const port = this._portMask(this._index);
        let n = milliseconds;
        let speed = this._power * this._direction;
        const ramp = Ev3Value.LONG_RAMP;

        let byteCommand = [];
        byteCommand[0] = Ev3Opcode.OPOUTPUT_TIME_SPEED;

        // If speed is less than zero, make it positive and multiply the input
        // value by -1
        if (speed < 0) {
            speed = -1 * speed;
            n = -1 * n;
        }
        // If the input value is less than 0
        const dir = (n < 0) ? 0x100 - speed : speed; // step negative or positive
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
        // Generate motor command values
        const runcmd = this._runValues(run);
        byteCommand = byteCommand.concat([
            Ev3Value.LAYER,
            port,
            Ev3Value.NUM8,
            dir & 0xff,
            Ev3Value.NUM8,
            rampup
        ]).concat(runcmd.concat([
            Ev3Value.NUM8,
            rampdown,
            Ev3Value.BRAKE
        ]));

        const cmd = this._parent.generateCommand(
            Ev3Command.DIRECT_COMMAND_NO_REPLY,
            byteCommand
        );

        this._parent.send(cmd);

        this.coastAfter(milliseconds);
    }

    /**
     * Set the motor to coast after a specified amount of time.
     * TODO: rename this startBraking?
     * @param {number} time - the time in milliseconds.
     */
    coastAfter (time) {
        // Set the motor command id to check before starting coast
        const commandId = uid();
        this._commandID = commandId;

        // Send coast message
        setTimeout(() => {
            // Do not send coast if another motor command changed the command id.
            if (this._commandID === commandId) {
                this.coast();
                this._commandID = null;
            }
        }, time + this._coastDelay); // add a delay so the brake takes effect
    }

    /**
     * Set the motor to coast.
     */
    coast () {
        const cmd = this._parent.generateCommand(
            Ev3Command.DIRECT_COMMAND_NO_REPLY,
            [
                Ev3Opcode.OPOUTPUT_STOP,
                Ev3Value.LAYER,
                this._portMask(this._index), // port output bit field
                Ev3Value.COAST
            ]
        );

        this._parent.send(cmd);
    }

    /**
     * Generate motor run values for a given input.
     * @param  {number} run - run input.
     * @return {array} - run values as a byte array.
     */
    _runValues (run) {
        // If run duration is less than max 16-bit integer
        if (run < 0x7fff) {
            return [
                Ev3Value.NUM16,
                run & 0xff,
                (run >> 8) & 0xff
            ];
        }

        // Run forever
        return [
            Ev3Value.NUM32,
            run & 0xff,
            (run >> 8) & 0xff,
            (run >> 16) & 0xff,
            (run >> 24) & 0xff
        ];
    }

    /**
     * Return a port value for the EV3 that is in the format for 'output bit field'
     * as 1/2/4/8, generally needed for motor ports, instead of the typical 0/1/2/3.
     * The documentation in the 'EV3 Firmware Developer Kit' for motor port arguments
     * is sometimes mistaken, but we believe motor ports are mostly addressed this way.
     * @param {number} port - the port number to convert to an 'output bit field'.
     * @return {number} - the converted port number.
     */
    _portMask (port) {
        return Math.pow(2, port);
    }
}

class EV3 {

    constructor (runtime, extensionId) {

        /**
         * The Scratch 3.0 runtime used to trigger the green flag button.
         * @type {Runtime}
         * @private
         */
        this._runtime = runtime;
        this._runtime.on('PROJECT_STOP_ALL', this.stopAll.bind(this));

        /**
         * A list of the names of the sensors connected in ports 1,2,3,4.
         * @type {string[]}
         * @private
         */
        this._sensorPorts = [];

        /**
         * A list of the names of the motors connected in ports A,B,C,D.
         * @type {string[]}
         * @private
         */
        this._motorPorts = [];

        /**
         * The state of all sensor values.
         * @type {string[]}
         * @private
         */
        this._sensors = {
            distance: 0,
            brightness: 0,
            buttons: [0, 0, 0, 0]
        };

        /**
         * The motors which this EV3 could possibly have connected.
         * @type {string[]}
         * @private
         */
        this._motors = [null, null, null, null];

        /**
         * The polling interval, in milliseconds.
         * @type {number}
         * @private
         */
        this._pollingInterval = 150;

        /**
         * The polling interval ID.
         * @type {number}
         * @private
         */
        this._pollingIntervalID = null;

        /**
         * The counter keeping track of polling cycles.
         * @type {string[]}
         * @private
         */
        this._pollingCounter = 0;

        /**
         * The Bluetooth socket connection for reading/writing peripheral data.
         * @type {BT}
         * @private
         */
        this._bt = null;
        this._runtime.registerPeripheralExtension(extensionId, this);

        this._onConnect = this._onConnect.bind(this);
        this._onMessage = this._onMessage.bind(this);
        this._pollValues = this._pollValues.bind(this);
    }

    get distance () {
        let value = this._sensors.distance > 100 ? 100 : this._sensors.distance;
        value = value < 0 ? 0 : value;
        value = Math.round(100 * value) / 100;

        return value;
    }

    get brightness () {
        return this._sensors.brightness;
    }

    /**
     * Access a particular motor on this peripheral.
     * @param {int} index - the zero-based index of the desired motor.
     * @return {EV3Motor} - the EV3Motor instance, if any, at that index.
     */
    motor (index) {
        return this._motors[index];
    }

    isButtonPressed (port) {
        return this._sensors.buttons[port] === 1;
    }

    beep (freq, time) {
        const cmd = this.generateCommand(
            Ev3Command.DIRECT_COMMAND_NO_REPLY,
            [
                Ev3Opcode.OPSOUND,
                Ev3Opcode.OPSOUND_CMD_TONE,
                Ev3Value.NUM8,
                2,
                Ev3Value.NUM16,
                freq,
                freq >> 8,
                Ev3Value.NUM16,
                time,
                time >> 8
            ]
        );

        this.send(cmd);
    }

    stopAll () {
        this.stopAllMotors();
        this.stopSound();
    }

    stopSound () {
        const cmd = this.generateCommand(
            Ev3Command.DIRECT_COMMAND_NO_REPLY,
            [
                Ev3Opcode.OPSOUND,
                Ev3Opcode.OPSOUND_CMD_STOP
            ]
        );

        this.send(cmd);
    }

    stopAllMotors () {
        this._motors.forEach(motor => {
            if (motor) {
                motor.coast();
            }
        });
    }

    /**
     * Called by the runtime when user wants to scan for an EV3 peripheral.
     */
    scan () {
        this._bt = new BT(this._runtime, {
            majorDeviceClass: 8,
            minorDeviceClass: 1
        }, this._onConnect, this._onMessage);
    }

    /**
     * Called by the runtime when user wants to connect to a certain EV3 peripheral.
     * @param {number} id - the id of the peripheral to connect to.
     */
    connect (id) {
        this._bt.connectPeripheral(id);
    }

    /**
     * Called by the runtime when user wants to disconnect from the EV3 peripheral.
     */
    disconnect () {
        this._bt.disconnect();
        this._clearSensorsAndMotors();
        window.clearInterval(this._pollingIntervalID);
        this._pollingIntervalID = null;
    }

    /**
     * Called by the runtime to detect whether the EV3 peripheral is connected.
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
     * Send a message to the peripheral BT socket.
     * @param {Uint8Array} message - the message to send.
     * @return {Promise} - a promise result of the send operation.
     */
    send (message) {
        // TODO: add rate limiting?
        if (!this.isConnected()) return Promise.resolve();

        return this._bt.sendMessage({
            message: Base64Util.uint8ArrayToBase64(message),
            encoding: 'base64'
        });
    }

    /**
     * Genrates direct commands that are sent to the EV3 as a single or compounded byte arrays.
     * See 'EV3 Communication Developer Kit', section 4, page 24 at
     * https://education.lego.com/en-us/support/mindstorms-ev3/developer-kits.
     *
     * Direct commands are one of two types:
     * DIRECT_COMMAND_NO_REPLY = a direct command where no reply is expected
     * DIRECT_COMMAND_REPLY = a direct command where a reply is expected, and the
     * number and length of returned values needs to be specified.
     *
     * The direct command byte array sent takes the following format:
     * Byte 0 - 1: Command size, Little Endian. Command size not including these 2 bytes
     * Byte 2 - 3: Message counter, Little Endian. Forth running counter
     * Byte 4:     Command type. Either DIRECT_COMMAND_REPLY or DIRECT_COMMAND_NO_REPLY
     * Byte 5 - 6: Reservation (allocation) of global and local variables using a compressed format
     *             (globals reserved in byte 5 and the 2 lsb of byte 6, locals reserved in the upper
     *             6 bits of byte 6) – see documentation for more details.
     * Byte 7 - n: Byte codes as a single command or compound commands (I.e. more commands composed
     *             as a small program)
     *
     * @param {number} type - the direct command type.
     * @param {string} byteCommands - a compound array of EV3 Opcode + arguments.
     * @param {number} allocation - the allocation of global and local vars needed for replies.
     * @return {array} - generated complete command byte array, with header and compounded commands.
     */
    generateCommand (type, byteCommands, allocation = 0) {

        // Header (Bytes 0 - 6)
        let command = [];
        command[2] = 0; // Message counter unused for now
        command[3] = 0; // Message counter unused for now
        command[4] = type;
        command[5] = allocation & 0xFF;
        command[6] = allocation >> 8 && 0xFF;

        // Bytecodes (Bytes 7 - n)
        command = command.concat(byteCommands);

        // Calculate command length minus first two header bytes
        const len = command.length - 2;
        command[0] = len & 0xFF;
        command[1] = len >> 8 && 0xFF;

        return command;
    }

    /**
     * When the EV3 peripheral connects, start polling for sensor and motor values.
     * @private
     */
    _onConnect () {
        this._pollingIntervalID = window.setInterval(this._pollValues, this._pollingInterval);
    }

    /**
     * Poll the EV3 for sensor and motor input values, based on the list of
     * known connected sensors and motors. This is sent as many compound commands
     * in a direct command, with a reply expected.
     *
     * See 'EV3 Firmware Developer Kit', section 4.8, page 46, at
     * https://education.lego.com/en-us/support/mindstorms-ev3/developer-kits
     * for a list of polling/input device commands and their arguments.
     *
     * @private
     */
    _pollValues () {
        if (!this.isConnected()) {
            window.clearInterval(this._pollingIntervalID);
            return;
        }

        const byteCommands = []; // a compound command
        let allocation = 0;

        let sensorCount = 0;

        // For the command to send, either request device list or request sensor data
        // based on the polling counter value.  (i.e., reset the list of devices every
        // 20 counts).

        if (this._pollingCounter % 20 === 0) {
            // GET DEVICE LIST
            byteCommands[0] = Ev3Opcode.OPINPUT_DEVICE_LIST;
            byteCommands[1] = Ev3Value.NUM8; // 1 byte to follow
            byteCommands[2] = 33; // 0x21 ARRAY // TODO: ????
            byteCommands[3] = 96; // 0x60 CHANGED // TODO: ????
            byteCommands[4] = 225; // 0xE1 size of global var - 1 byte to follow // TODO: ????
            byteCommands[5] = 32; // 0x20 global var index "0" 0b00100000 // TODO: ????

            // Command and payload lengths
            allocation = 33;

            // Clear sensor data // TODO: is this enough?
            this._updateDevices = true;

        } else {
            // GET SENSOR VALUES FOR CONNECTED SENSORS
            let index = 0;
            // eslint-disable-next-line no-undefined
            if (!this._sensorPorts.includes(undefined)) { // TODO: why is this needed?
                for (let i = 0; i < 4; i++) {
                    if (this._sensorPorts[i] !== 'none') {
                        byteCommands[index + 0] = Ev3Opcode.OPINPUT_READSI;
                        byteCommands[index + 1] = Ev3Value.LAYER;
                        byteCommands[index + 2] = i; // PORT
                        byteCommands[index + 3] = Ev3Value.DO_NOT_CHANGE_TYPE;
                        byteCommands[index + 4] = Ev3Mode[this._sensorPorts[i]];
                        byteCommands[index + 5] = 225; // 0xE1 one byte to follow // TODO: ????
                        byteCommands[index + 6] = sensorCount * 4; // global index // TODO: ????
                        index += 7;
                    }
                    sensorCount++;
                }
            }

            // GET MOTOR POSITION VALUES, EVEN IF NO MOTOR PRESENT
            // eslint-disable-next-line no-undefined
            if (!this._motorPorts.includes(undefined)) {
                for (let i = 0; i < 4; i++) {
                    byteCommands[index + 0] = Ev3Opcode.OPOUTPUT_GET_COUNT;
                    byteCommands[index + 1] = Ev3Value.LAYER;
                    byteCommands[index + 2] = i; // port
                    byteCommands[index + 3] = 225; // 0xE1 byte following
                    byteCommands[index + 4] = sensorCount * 4; // global index
                    index += 5;
                    sensorCount++;
                }
            }

            // Command and payload lengths
            allocation = sensorCount * 4;
        }

        const cmd = this.generateCommand(
            Ev3Command.DIRECT_COMMAND_REPLY,
            byteCommands,
            allocation
        );

        this.send(cmd);

        this._pollingCounter++;
    }

    /**
     * Message handler for incoming EV3 reply messages, either a list of connected
     * devices (sensors and motors) or the values of the connected sensors and motors.
     *
     * See 'EV3 Communication Developer Kit', section 4.1, page 24 at
     * https://education.lego.com/en-us/support/mindstorms-ev3/developer-kits
     * for more details on direct reply formats.
     *
     * The direct reply byte array sent takes the following format:
     * Byte 0 – 1: Reply size, Little Endian. Reply size not including these 2 bytes
     * Byte 2 – 3: Message counter, Little Endian. Equals the Direct Command
     * Byte 4:     Reply type. Either DIRECT_REPLY or DIRECT_REPLY_ERROR
     * Byte 5 - n: Resonse buffer. I.e. the content of the by the Command reserved global variables.
     *             I.e. if the command reserved 64 bytes, these bytes will be placed in the reply
     *             packet as the bytes 5 to 68.
     *
     * See 'EV3 Firmware Developer Kit', section 4.8, page 56 at
     * https://education.lego.com/en-us/support/mindstorms-ev3/developer-kits
     * for direct response buffer formats for various commands.
     *
     * @param {object} params - incoming message parameters
     * @private
     */
    _onMessage (params) {
        const message = params.message;
        const data = Base64Util.base64ToUint8Array(message);
        // log.info(`received array: ${array}`);

        // TODO: Is this the correct check?
        if (data[4] !== Ev3Command.DIRECT_REPLY) {
            return;
        }

        if (this._updateDevices) {
            // *****************
            // PARSE DEVICE LIST
            // *****************
            // TODO: put these in for loop?
            this._sensorPorts[0] = Ev3Device[data[5]] ? Ev3Device[data[5]] : 'none';
            this._sensorPorts[1] = Ev3Device[data[6]] ? Ev3Device[data[6]] : 'none';
            this._sensorPorts[2] = Ev3Device[data[7]] ? Ev3Device[data[7]] : 'none';
            this._sensorPorts[3] = Ev3Device[data[8]] ? Ev3Device[data[8]] : 'none';
            this._motorPorts[0] = Ev3Device[data[21]] ? Ev3Device[data[21]] : 'none';
            this._motorPorts[1] = Ev3Device[data[22]] ? Ev3Device[data[22]] : 'none';
            this._motorPorts[2] = Ev3Device[data[23]] ? Ev3Device[data[23]] : 'none';
            this._motorPorts[3] = Ev3Device[data[24]] ? Ev3Device[data[24]] : 'none';
            for (let m = 0; m < 4; m++) {
                const type = this._motorPorts[m];
                if (type !== 'none' && !this._motors[m]) {
                    // add new motor if don't already have one
                    this._motors[m] = new EV3Motor(this, m, type);
                }
                if (type === 'none' && this._motors[m]) {
                    // clear old motor
                    this._motors[m] = null;
                }
            }
            this._updateDevices = false;
            // eslint-disable-next-line no-undefined
        } else if (!this._sensorPorts.includes(undefined) && !this._motorPorts.includes(undefined)) {
            // *******************
            // PARSE SENSOR VALUES
            // *******************
            let offset = 5; // start reading sensor values at byte 5
            for (let i = 0; i < 4; i++) {
                // array 2 float
                const buffer = new Uint8Array([
                    data[offset],
                    data[offset + 1],
                    data[offset + 2],
                    data[offset + 3]
                ]).buffer;
                const view = new DataView(buffer);
                const value = view.getFloat32(0, true);

                if (Ev3Label[this._sensorPorts[i]] === 'button') {
                    // Read a button value per port
                    this._sensors.buttons[i] = value ? value : 0;
                } else if (Ev3Label[this._sensorPorts[i]]) { // if valid
                    // Read brightness / distance values and set to 0 if null
                    this._sensors[Ev3Label[this._sensorPorts[i]]] = value ? value : 0;
                }
                offset += 4;
            }
            // *****************************************************
            // PARSE MOTOR POSITION VALUES, EVEN IF NO MOTOR PRESENT
            // *****************************************************
            for (let i = 0; i < 4; i++) {
                const positionArray = [
                    data[offset],
                    data[offset + 1],
                    data[offset + 2],
                    data[offset + 3]
                ];
                if (this._motors[i]) {
                    this._motors[i].position = positionArray;
                }
                offset += 4;
            }
        }
    }

    /**
     * Clear all the senor port and motor names, and their values.
     * @private
     */
    _clearSensorsAndMotors () {
        this._sensorPorts = [];
        this._motorPorts = [];
        this._sensors = {
            distance: 0,
            brightness: 0,
            buttons: [0, 0, 0, 0]
        };
        this._motors = [null, null, null, null];
    }

}

/**
 * Enum for motor port names.
 * Note: if changed, will break compatibility with previously saved projects.
 * @readonly
 * @enum {string}
 */
const Ev3MotorMenu = ['A', 'B', 'C', 'D'];

/**
 * Enum for sensor port names.
 * Note: if changed, will break compatibility with previously saved projects.
 * @readonly
 * @enum {string}
 */
const Ev3SensorMenu = ['1', '2', '3', '4'];

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

        // Create a new EV3 peripheral instance
        this._peripheral = new EV3(this.runtime, Scratch3Ev3Blocks.EXTENSION_ID);
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
                            defaultValue: 0
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
                            defaultValue: 0
                        },
                        TIME: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
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
                            defaultValue: 0
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
                            defaultValue: 0
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
                            defaultValue: 0
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
                            defaultValue: 0
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
                motorPorts: this._formatMenu(Ev3MotorMenu),
                sensorPorts: this._formatMenu(Ev3SensorMenu)
            }
        };
    }

    motorTurnClockwise (args) {
        const port = Cast.toNumber(args.PORT);
        let time = Cast.toNumber(args.TIME) * 1000;
        time = MathUtil.clamp(time, 0, 15000);

        return new Promise(resolve => {
            this._forEachMotor(port, motorIndex => {
                const motor = this._peripheral.motor(motorIndex);
                if (motor) {
                    motor.direction = 1;
                    motor.turnOnFor(time);
                }
            });

            // Run for some time even when no motor is connected
            setTimeout(resolve, time);
        });
    }

    motorTurnCounterClockwise (args) {
        const port = Cast.toNumber(args.PORT);
        let time = Cast.toNumber(args.TIME) * 1000;
        time = MathUtil.clamp(time, 0, 15000);

        return new Promise(resolve => {
            this._forEachMotor(port, motorIndex => {
                const motor = this._peripheral.motor(motorIndex);
                if (motor) {
                    motor.direction = -1;
                    motor.turnOnFor(time);
                }
            });

            // Run for some time even when no motor is connected
            setTimeout(resolve, time);
        });
    }

    motorSetPower (args) {
        const port = Cast.toNumber(args.PORT);
        const power = MathUtil.clamp(Cast.toNumber(args.POWER), 0, 100);

        this._forEachMotor(port, motorIndex => {
            const motor = this._peripheral.motor(motorIndex);
            if (motor) {
                motor.power = power;
            }
        });
    }

    getMotorPosition (args) {
        const port = Cast.toNumber(args.PORT);

        if (![0, 1, 2, 3].includes(port)) {
            return;
        }

        const motor = this._peripheral.motor(port);

        return motor ? motor.position : 0;
    }

    whenButtonPressed (args) {
        const port = Cast.toNumber(args.PORT);

        if (![0, 1, 2, 3].includes(port)) {
            return;
        }

        return this._peripheral.isButtonPressed(port);
    }

    whenDistanceLessThan (args) {
        const distance = MathUtil.clamp(Cast.toNumber(args.DISTANCE), 0, 100);

        return this._peripheral.distance < distance;
    }

    whenBrightnessLessThan (args) {
        const brightness = MathUtil.clamp(Cast.toNumber(args.DISTANCE), 0, 100);

        return this._peripheral.brightness < brightness;
    }

    buttonPressed (args) {
        const port = Cast.toNumber(args.PORT);

        if (![0, 1, 2, 3].includes(port)) {
            return;
        }

        return this._peripheral.isButtonPressed(port);
    }

    getDistance () {
        return this._peripheral.distance;
    }

    getBrightness () {
        return this._peripheral.brightness;
    }

    beep (args) {
        const note = MathUtil.clamp(Cast.toNumber(args.NOTE), 47, 99); // valid EV3 sounds
        let time = Cast.toNumber(args.TIME) * 1000;
        time = MathUtil.clamp(time, 0, 3000);

        if (time === 0) {
            return; // don't send a beep time of 0
        }

        return new Promise(resolve => {
            // https://en.wikipedia.org/wiki/MIDI_tuning_standard#Frequency_values
            const freq = Math.pow(2, ((note - 69 + 12) / 12)) * 440;
            this._peripheral.beep(freq, time);

            // Run for some time even when no piezo is connected.
            setTimeout(resolve, time);
        });
    }

    /**
     * Call a callback for each motor indexed by the provided motor ID.
     * @param {MotorID} motorID - the ID specifier.
     * @param {Function} callback - the function to call with the numeric motor index for each motor.
     * @private
     */
    // TODO: unnecessary, but could be useful if 'all motors' is added (see WeDo2 extension)
    _forEachMotor (motorID, callback) {
        let motors;
        switch (motorID) {
        case 0:
            motors = [0];
            break;
        case 1:
            motors = [1];
            break;
        case 2:
            motors = [2];
            break;
        case 3:
            motors = [3];
            break;
        default:
            log.warn(`Invalid motor ID: ${motorID}`);
            motors = [];
            break;
        }
        for (const index of motors) {
            callback(index);
        }
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

module.exports = Scratch3Ev3Blocks;
