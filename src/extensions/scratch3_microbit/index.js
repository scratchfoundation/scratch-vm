const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const log = require('../../util/log');

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxOS4xLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4KCjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgdmVyc2lvbj0iMS4xIgogICBpZD0ibWljcm9iaXQtbG9nbyIKICAgeD0iMHB4IgogICB5PSIwcHgiCiAgIHZpZXdCb3g9IjAgMCA0MC43MDUwMDIgNDAuNzA1MDAxIgogICBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCAyMTMgNTUiCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiCiAgIGlua3NjYXBlOnZlcnNpb249IjAuOTEgcjEzNzI1IgogICBzb2RpcG9kaTpkb2NuYW1lPSJiYmMtbWljcm9iaXQtd2hpdGUgKDEpLnN2ZyIKICAgd2lkdGg9IjQwLjcwNTAwMiIKICAgaGVpZ2h0PSI0MC43MDUwMDIiPjxtZXRhZGF0YQogICAgIGlkPSJtZXRhZGF0YTQ5Ij48cmRmOlJERj48Y2M6V29yawogICAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUKICAgICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPjxkYzp0aXRsZT48L2RjOnRpdGxlPjwvY2M6V29yaz48L3JkZjpSREY+PC9tZXRhZGF0YT48ZGVmcwogICAgIGlkPSJkZWZzNDciIC8+PHNvZGlwb2RpOm5hbWVkdmlldwogICAgIHBhZ2Vjb2xvcj0iI2ZmZmZmZiIKICAgICBib3JkZXJjb2xvcj0iIzY2NjY2NiIKICAgICBib3JkZXJvcGFjaXR5PSIxIgogICAgIG9iamVjdHRvbGVyYW5jZT0iMTAiCiAgICAgZ3JpZHRvbGVyYW5jZT0iMTAiCiAgICAgZ3VpZGV0b2xlcmFuY2U9IjEwIgogICAgIGlua3NjYXBlOnBhZ2VvcGFjaXR5PSIwIgogICAgIGlua3NjYXBlOnBhZ2VzaGFkb3c9IjIiCiAgICAgaW5rc2NhcGU6d2luZG93LXdpZHRoPSIxMjUzIgogICAgIGlua3NjYXBlOndpbmRvdy1oZWlnaHQ9Ijg1NiIKICAgICBpZD0ibmFtZWR2aWV3NDUiCiAgICAgc2hvd2dyaWQ9ImZhbHNlIgogICAgIGZpdC1tYXJnaW4tdG9wPSIwIgogICAgIGZpdC1tYXJnaW4tbGVmdD0iMCIKICAgICBmaXQtbWFyZ2luLXJpZ2h0PSIwIgogICAgIGZpdC1tYXJnaW4tYm90dG9tPSIwIgogICAgIGlua3NjYXBlOnpvb209IjEyLjM5NDM2NiIKICAgICBpbmtzY2FwZTpjeD0iMTcuNDY4MDc1IgogICAgIGlua3NjYXBlOmN5PSIxNy40Nzc5MDYiCiAgICAgaW5rc2NhcGU6d2luZG93LXg9IjI0IgogICAgIGlua3NjYXBlOndpbmRvdy15PSIxMiIKICAgICBpbmtzY2FwZTp3aW5kb3ctbWF4aW1pemVkPSIwIgogICAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9Im1pY3JvYml0LWxvZ28iIC8+PHBhdGgKICAgICBzdHlsZT0iZmlsbDojZmZmZmZmIgogICAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgICAgaWQ9InBhdGgzOSIKICAgICBkPSJtIDI4Ljg3NCwyMi43MDEwMDEgYyAxLjI5OCwwIDIuMzQ3LC0xLjA1MyAyLjM0NywtMi4zNDkgMCwtMS4yOTYgLTEuMDQ4LC0yLjM0ODAwMSAtMi4zNDcsLTIuMzQ4MDAxIC0xLjI5NywwIC0yLjM0OCwxLjA1MjAwMSAtMi4zNDgsMi4zNDgwMDEgMC4wMDEsMS4yOTYgMS4wNTEsMi4zNDkgMi4zNDgsMi4zNDkiIC8+PHBhdGgKICAgICBzdHlsZT0iZmlsbDojZmZmZmZmIgogICAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgICAgaWQ9InBhdGg0MSIKICAgICBkPSJtIDExLjYzLDE4LjAwNCBjIC0xLjI5NywwIC0yLjM0OSwxLjA1MjAwMSAtMi4zNDksMi4zNDgwMDEgMCwxLjI5NiAxLjA1MiwyLjM0OSAyLjM0OSwyLjM0OSAxLjI5NiwwIDIuMzQ3LC0xLjA1MyAyLjM0NywtMi4zNDkgMCwtMS4yOTYgLTEuMDUxLC0yLjM0ODAwMSAtMi4zNDcsLTIuMzQ4MDAxIiAvPjxwYXRoCiAgICAgc3R5bGU9ImZpbGw6I2ZmZmZmZiIKICAgICBpbmtzY2FwZTpjb25uZWN0b3ItY3VydmF0dXJlPSIwIgogICAgIGlkPSJwYXRoNDMiCiAgICAgZD0ibSAxMS42MywxMy4zNzQ1IGMgLTMuODQ4LDAgLTYuOTc4LDMuMTI5IC02Ljk3OCw2Ljk3ODAwMSAwLDMuODQ4IDMuMTMsNi45NzggNi45NzgsNi45NzggbCAxNy40NDUsMCBjIDMuODQ4LDAgNi45NzcsLTMuMTMgNi45NzcsLTYuOTc4IDAsLTMuODQ5MDAxIC0zLjEyOSwtNi45NzgwMDEgLTYuOTc3LC02Ljk3ODAwMSBsIC0xNy40NDUsMCBtIDE3LjQ0NSwxOC42MDgwMDEgLTE3LjQ0NSwwIGMgLTYuNDEzLDAgLTExLjYzLC01LjIxNyAtMTEuNjMsLTExLjYzIEMgMCwxMy45Mzk1IDUuMjE3LDguNzIyNTAwNCAxMS42Myw4LjcyMjUwMDQgbCAxNy40NDUsMCBjIDYuNDEzLDAgMTEuNjMsNS4yMTY5OTk2IDExLjYzLDExLjYzMDAwMDYgLTEwZS00LDYuNDEzIC01LjIxNywxMS42MyAtMTEuNjMsMTEuNjMiIC8+PC9zdmc+';

/**
 * Icon svg to be displayed in the menu encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const menuIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxOS4xLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4KCjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgdmVyc2lvbj0iMS4xIgogICBpZD0ibWljcm9iaXQtbG9nbyIKICAgeD0iMHB4IgogICB5PSIwcHgiCiAgIHZpZXdCb3g9IjAgMCA0MC43MDUwMDIgNDAuNzA1MDAxIgogICBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCAyMTMgNTUiCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiCiAgIGlua3NjYXBlOnZlcnNpb249IjAuOTEgcjEzNzI1IgogICBzb2RpcG9kaTpkb2NuYW1lPSJiYmMtbWljcm9iaXQtYmxhY2sgKDEpLnN2ZyIKICAgd2lkdGg9IjQwLjcwNTAwMiIKICAgaGVpZ2h0PSI0MC43MDUwMDIiPjxtZXRhZGF0YQogICAgIGlkPSJtZXRhZGF0YTQ5Ij48cmRmOlJERj48Y2M6V29yawogICAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUKICAgICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPjxkYzp0aXRsZT48L2RjOnRpdGxlPjwvY2M6V29yaz48L3JkZjpSREY+PC9tZXRhZGF0YT48ZGVmcwogICAgIGlkPSJkZWZzNDciIC8+PHNvZGlwb2RpOm5hbWVkdmlldwogICAgIHBhZ2Vjb2xvcj0iI2ZmZmZmZiIKICAgICBib3JkZXJjb2xvcj0iIzY2NjY2NiIKICAgICBib3JkZXJvcGFjaXR5PSIxIgogICAgIG9iamVjdHRvbGVyYW5jZT0iMTAiCiAgICAgZ3JpZHRvbGVyYW5jZT0iMTAiCiAgICAgZ3VpZGV0b2xlcmFuY2U9IjEwIgogICAgIGlua3NjYXBlOnBhZ2VvcGFjaXR5PSIwIgogICAgIGlua3NjYXBlOnBhZ2VzaGFkb3c9IjIiCiAgICAgaW5rc2NhcGU6d2luZG93LXdpZHRoPSIxMjUzIgogICAgIGlua3NjYXBlOndpbmRvdy1oZWlnaHQ9IjEwNzYiCiAgICAgaWQ9Im5hbWVkdmlldzQ1IgogICAgIHNob3dncmlkPSJmYWxzZSIKICAgICBmaXQtbWFyZ2luLXRvcD0iMCIKICAgICBmaXQtbWFyZ2luLWxlZnQ9IjAiCiAgICAgZml0LW1hcmdpbi1yaWdodD0iMCIKICAgICBmaXQtbWFyZ2luLWJvdHRvbT0iMCIKICAgICBpbmtzY2FwZTp6b29tPSIxLjU0OTI5NTgiCiAgICAgaW5rc2NhcGU6Y3g9IjQyLjIzNyIKICAgICBpbmtzY2FwZTpjeT0iMTIuNjI4IgogICAgIGlua3NjYXBlOndpbmRvdy14PSIxNDYwIgogICAgIGlua3NjYXBlOndpbmRvdy15PSI0MyIKICAgICBpbmtzY2FwZTp3aW5kb3ctbWF4aW1pemVkPSIwIgogICAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9Im1pY3JvYml0LWxvZ28iIC8+PHBhdGgKICAgICBzdHlsZT0iZmlsbDojMDAwMDAwIgogICAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgICAgaWQ9InBhdGgzOSIKICAgICBkPSJtIDI4Ljg3NCwyMi43MDEwMDEgYyAxLjI5OCwwIDIuMzQ3LC0xLjA1MyAyLjM0NywtMi4zNDkgMCwtMS4yOTYgLTEuMDQ4LC0yLjM0ODAwMSAtMi4zNDcsLTIuMzQ4MDAxIC0xLjI5NywwIC0yLjM0OCwxLjA1MjAwMSAtMi4zNDgsMi4zNDgwMDEgMC4wMDEsMS4yOTYgMS4wNTEsMi4zNDkgMi4zNDgsMi4zNDkiIC8+PHBhdGgKICAgICBzdHlsZT0iZmlsbDojMDAwMDAwIgogICAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgICAgaWQ9InBhdGg0MSIKICAgICBkPSJtIDExLjYzLDE4LjAwNCBjIC0xLjI5NywwIC0yLjM0OSwxLjA1MjAwMSAtMi4zNDksMi4zNDgwMDEgMCwxLjI5NiAxLjA1MiwyLjM0OSAyLjM0OSwyLjM0OSAxLjI5NiwwIDIuMzQ3LC0xLjA1MyAyLjM0NywtMi4zNDkgMCwtMS4yOTYgLTEuMDUxLC0yLjM0ODAwMSAtMi4zNDcsLTIuMzQ4MDAxIiAvPjxwYXRoCiAgICAgc3R5bGU9ImZpbGw6IzAwMDAwMCIKICAgICBpbmtzY2FwZTpjb25uZWN0b3ItY3VydmF0dXJlPSIwIgogICAgIGlkPSJwYXRoNDMiCiAgICAgZD0ibSAxMS42MywxMy4zNzQ1IGMgLTMuODQ4LDAgLTYuOTc4LDMuMTI5IC02Ljk3OCw2Ljk3ODAwMSAwLDMuODQ4IDMuMTMsNi45NzggNi45NzgsNi45NzggbCAxNy40NDUsMCBjIDMuODQ4LDAgNi45NzcsLTMuMTMgNi45NzcsLTYuOTc4IDAsLTMuODQ5MDAxIC0zLjEyOSwtNi45NzgwMDEgLTYuOTc3LC02Ljk3ODAwMSBsIC0xNy40NDUsMCBtIDE3LjQ0NSwxOC42MDgwMDEgLTE3LjQ0NSwwIGMgLTYuNDEzLDAgLTExLjYzLC01LjIxNyAtMTEuNjMsLTExLjYzIEMgMCwxMy45Mzk1IDUuMjE3LDguNzIyNTAwNCAxMS42Myw4LjcyMjUwMDQgbCAxNy40NDUsMCBjIDYuNDEzLDAgMTEuNjMsNS4yMTY5OTk2IDExLjYzLDExLjYzMDAwMDYgLTEwZS00LDYuNDEzIC01LjIxNywxMS42MyAtMTEuNjMsMTEuNjMiIC8+PC9zdmc+';

/**
 * Manage communication with a MicroBit device over a Device Manager client socket.
 */
class MicroBit {

    /**
     * @return {string} - the type of Device Manager device socket that this class will handle.
     */
    static get DEVICE_TYPE () {
        return 'ble';
    }

    /**
     * Construct a MicroBit communication object.
     * @param {Socket} socket - the socket for a MicroBit device, as provided by a Device Manager client.
     * @param {Runtime} runtime - the Scratch 3.0 runtime
     */
    constructor (socket, runtime) {
        /**
         * The socket-IO socket used to communicate with the Device Manager about this device.
         * @type {Socket}
         * @private
         */
        this._socket = socket;

        /**
         * The Scratch 3.0 runtime used to trigger the green flag button
         *
         * @type {Runtime}
         * @private
         */
        this._runtime = runtime;

        /**
         * The most recently received value for each sensor.
         * @type {Object.<string, number>}
         * @private
         */
        this._sensors = {
            tiltX: 0,
            tiltY: 0,
            buttonA: 0,
            buttonB: 0,
            touchPins: [0, 0, 0],
            gestureState: 0,
            ledMatrixState: new Uint8Array(5)
        };

        this._gestures = {
            moving: false,
            move: {
                active: false,
                timeout: false
            },
            shake: {
                active: false,
                timeout: false
            },
            jump: {
                active: false,
                timeout: false
            }
        };

        // this._onRxChar = this._onRxChar.bind(this);
        // this._onDisconnect = this._onDisconnect.bind(this);

        this._connectEvents();
    }

    /**
     * Manually dispose of this object.
     */
    dispose () {
        this._disconnectEvents();
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

    /**
     * @return {boolean} - the latest value received for the A button.
     */
    get buttonA () {
        return this._sensors.buttonA;
    }

    /**
     * @return {boolean} - the latest value received for the B button.
     */
    get buttonB () {
        return this._sensors.buttonB;
    }

    /**
     * @return {number} - the latest value received for the motion gesture states.
     */
    get gestureState () {
        return this._sensors.gestureState;
    }

    /**
     * @return {Uint8Array} - the current state of the 5x5 LED matrix.
     */
    get ledMatrixState () {
        return this._sensors.ledMatrixState;
    }

    /**
     * @param {number} pin - the pin to check touch state.
     * @return {number} - the latest value received for the touch pin states.
     */
    _checkPinState (pin) {
        return this._sensors.touchPins[pin];
    }

    /**
     * Attach event handlers to the device socket.
     * @private
     */
    _connectEvents () {
        // this._socket.on(BLE_UUIDs.rx, this._onRxChar);
        // this._socket.on('deviceWasClosed', this._onDisconnect);
        // this._socket.on('disconnect', this._onDisconnect);
    }

    /**
     * Detach event handlers from the device socket.
     * @private
     */
    _disconnectEvents () {
        // this._socket.off(BLE_UUIDs.rx, this._onRxChar);
        // this._socket.off('deviceWasClosed', this._onDisconnect);
        // this._socket.off('disconnect', this._onDisconnect);
    }

    /**
     * Process the sensor data from the incoming BLE characteristic.
     * @param {object} data - the incoming BLE data.
     * @private
     */
    _processData (data) {

        this._sensors.tiltX = data[1] | (data[0] << 8);
        if (this._sensors.tiltX > (1 << 15)) this._sensors.tiltX -= (1 << 16);
        this._sensors.tiltY = data[3] | (data[2] << 8);
        if (this._sensors.tiltY > (1 << 15)) this._sensors.tiltY -= (1 << 16);

        this._sensors.buttonA = data[4];
        this._sensors.buttonB = data[5];

        this._sensors.touchPins[0] = data[6];
        this._sensors.touchPins[1] = data[7];
        this._sensors.touchPins[2] = data[8];

        this._sensors.gestureState = data[9];
    }

    /**
     * React to device disconnection. May be called more than once.
     * @private
     */
    _onDisconnect () {
        this._disconnectEvents();
    }

    /**
     * Send a message to the device socket.
     * @param {string} message - the name of the message, such as 'playTone'.
     * @param {object} [details] - optional additional details for the message, such as tone duration and pitch.
     * @private
     */
    _send (message, details) {
        this._socket.emit(message, details);
    }
}

/*
 * const BLE_UUIDs = {
 *     uuid: '4cdbbd87d6e646c29d0bdf87551e159a',
 *     rx: '4cdb8702d6e646c29d0bdf87551e159a'
 * };
 */

/*
 * const DEV_SPEC = {
 *     info: {
 *         uuid: [BLE_UUIDs.uuid],
 *         read_characteristics: {
 *             '4cdb8702d6e646c29d0bdf87551e159a': {
 *                 notify: true
 *             }
 *         }
 *     },
 *     type: 'ble'
 * };
 */

/**
 * Enum for tilt sensor direction.
 * @readonly
 * @enum {string}
 */
const TiltDirection = {
    FRONT: 'front',
    BACK: 'back',
    LEFT: 'left',
    RIGHT: 'right',
    ANY: 'any'
};

/**
 * Converting symbols to hex values
 * @readonly
 */
const symbols2hex = {
    '❤': 0xAAC544,
    '♫': 0xF4AF78,
    '☓': 0x1151151,
    '✓': 0x8A88,
    '↑': 0x477C84,
    '↓': 0x427DC4,
    '←': 0x467D84,
    '→': 0x437CC4,
    '◯': 0xE8C62E,
    '☀': 0x1577DD5,
    '☺': 0x5022E,
    '!': 0x421004,
    '?': 0xC91004
};

/**
 * Enum for micro:bit BLE command protocol.
 * @readonly
 * @enum {number}
 */
const BLECommand = {
    CMD_PIN_CONFIG: 0x80,
    CMD_DISPLAY_TEXT: 0x81,
    CMD_DISPLAY_LED: 0x82
};

/**
 * Scratch 3.0 blocks to interact with a MicroBit device.
 */
class Scratch3MicroBitBlocks {

    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME () {
        return 'MicroBit';
    }

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return 'microbit';
    }

    /**
     * @return {number} - the tilt sensor counts as "tilted" if its tilt angle meets or exceeds this threshold.
     */
    static get TILT_THRESHOLD () {
        return 15;
    }

    /**
     * Construct a set of MicroBit blocks.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        this.connect();
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: Scratch3MicroBitBlocks.EXTENSION_ID,
            name: Scratch3MicroBitBlocks.EXTENSION_NAME,
            menuIconURI: menuIconURI,
            blockIconURI: blockIconURI,
            blocks: [
                {
                    opcode: 'whenButtonPressed',
                    text: 'when [BTN] button pressed',
                    blockType: BlockType.HAT,
                    arguments: {
                        BTN: {
                            type: ArgumentType.STRING,
                            menu: 'buttons',
                            defaultValue: 'A'
                        }
                    }
                },
                {
                    opcode: 'whenMoved',
                    text: 'when moved',
                    blockType: BlockType.HAT
                },
                {
                    opcode: 'whenShaken',
                    text: 'when shaken',
                    blockType: BlockType.HAT
                },
                {
                    opcode: 'whenJumped',
                    text: 'when jumped',
                    blockType: BlockType.HAT
                },
                {
                    opcode: 'displayText',
                    text: 'display [TEXT]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Hello!'
                        }
                    }
                },
                {
                    opcode: 'displaySymbol',
                    text: 'display [SYMBOL]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        SYMBOL: {
                            type: ArgumentType.STRING,
                            menu: 'symbols',
                            defaultValue: '❤'
                        }
                    }
                },
                {
                    opcode: 'displayMatrix',
                    text: 'set light x:[X] y:[Y] [STATE]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        X: {
                            type: ArgumentType.STRING,
                            menu: 'rowcol',
                            defaultValue: '1'
                        },
                        Y: {
                            type: ArgumentType.STRING,
                            menu: 'rowcol',
                            defaultValue: '1'
                        },
                        STATE: {
                            type: ArgumentType.STRING,
                            menu: 'pinState',
                            defaultValue: 'on'
                        }
                    }
                },
                {
                    opcode: 'displayClear',
                    text: 'set all lights off',
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'whenTilted',
                    text: 'when tilted [DIRECTION]',
                    blockType: BlockType.HAT,
                    arguments: {
                        DIRECTION: {
                            type: ArgumentType.STRING,
                            menu: 'tiltDirectionAny',
                            defaultValue: TiltDirection.ANY
                        }
                    }
                },
                {
                    opcode: 'isTilted',
                    text: 'tilted [DIRECTION]?',
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        DIRECTION: {
                            type: ArgumentType.STRING,
                            menu: 'tiltDirectionAny',
                            defaultValue: TiltDirection.ANY
                        }
                    }
                },
                {
                    opcode: 'getTiltAngle',
                    text: 'tilt angle [DIRECTION]',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        DIRECTION: {
                            type: ArgumentType.STRING,
                            menu: 'tiltDirection',
                            defaultValue: TiltDirection.FRONT
                        }
                    }
                },
                {
                    opcode: 'whenPinConnected',
                    text: 'when pin [PIN] connected',
                    blockType: BlockType.HAT,
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            menu: 'touchPins',
                            defaultValue: '0'
                        }
                    }
                }
            ],
            menus: {
                buttons: ['A', 'B', 'any'],
                rowcol: ['1', '2', '3', '4', '5'],
                pinState: ['on', 'off'],
                symbols: Object.keys(symbols2hex),
                tiltDirection: [TiltDirection.FRONT, TiltDirection.BACK, TiltDirection.LEFT, TiltDirection.RIGHT],
                tiltDirectionAny: [
                    TiltDirection.FRONT, TiltDirection.BACK, TiltDirection.LEFT,
                    TiltDirection.RIGHT, TiltDirection.ANY
                ],
                touchPins: ['0', '1', '2']
            }
        };
    }

    /**
     * Use the Device Manager client to attempt to connect to a MicroBit device.
     */
    connect () {
        this._device = new MicroBit(null, this.runtime);
        window.addEventListener('message', event => {
            if (event.data.type === 'data') {
                this._device._processData(new Uint8Array(event.data.buffer));
            }
        }, false);
        /*
         * if (this._device || this._finder) {
         *     return;
         * }
         * const deviceManager = this.runtime.ioDevices.deviceManager;
         * const finder = this._finder =
         *     deviceManager.searchAndConnect(Scratch3MicroBitBlocks.EXTENSION_NAME, MicroBit.DEVICE_TYPE, DEV_SPEC);
         *
         * this._finder.promise.then(
         *     socket => {
         *         if (this._finder === finder) {
         *             this._finder = null;
         *             this._device = new MicroBit(socket, this.runtime);
         *         } else {
         *             log.warn('Ignoring success from stale MicroBit connection attempt');
         *         }
         *     },
         *     reason => {
         *         if (this._finder === finder) {
         *             this._finder = null;
         *             log.warn(`MicroBit connection failed: ${reason}`);
         *         } else {
         *             log.warn('Ignoring failure from stale MicroBit connection attempt');
         *         }
         *     });
         */
    }

    /**
     * Test whether the A or B button is pressed
     * @param {object} args - the block's arguments.
     * @return {boolean} - true if the button is pressed.
     */
    whenButtonPressed (args) {
        if (args.BTN === 'any') {
            return this._device.buttonA | this._device.buttonB;
        } else if (args.BTN === 'A') {
            return this._device.buttonA;
        } else if (args.BTN === 'B') {
            return this._device.buttonB;
        }
        return false;
    }

    /**
     * Test whether the micro:bit is moving
     * @return {boolean} - true if the micro:bit is moving.
     */
    whenMoved () {
        return (this._device.gestureState >> 2) & 1;
    }

    /**
     * Test whether the micro:bit is shaken
     * @return {boolean} - true if the micro:bit is shaken.
     */
    whenShaken () {
        return this._device.gestureState & 1;
    }

    /**
     * Test whether the micro:bit is free falling
     * @return {boolean} - true if the micro:bit is free falling.
     */
    whenJumped () {
        return (this._device.gestureState >> 1) & 1;
    }

    /**
     * Display text on the 5x5 LED matrix.
     * @param {object} args - the block's arguments.
     * Note the limit is 19 characters
     */
    displayText (args) {
        const text = String(args.TEXT).substring(0, 19);
        const output = new Uint8Array(text.length + 1);
        output[0] = BLECommand.CMD_DISPLAY_TEXT;
        for (let i = 0; i < text.length; i++) {
            output[i + 1] = text.charCodeAt(i);
        }
        window.postMessage({type: 'command', buffer: output}, '*');
        return;
    }

    /**
     * Display a predefined symbol on the 5x5 LED matrix.
     * @param {object} args - the block's arguments.
     */
    displaySymbol (args) {
        const hex = symbols2hex[args.SYMBOL];
        const output = new Uint8Array(6);
        output[0] = BLECommand.CMD_DISPLAY_LED;
        output[1] = (hex >> 20) & 0x1F;
        output[2] = (hex >> 15) & 0x1F;
        output[3] = (hex >> 10) & 0x1F;
        output[4] = (hex >> 5) & 0x1F;
        output[5] = hex & 0x1F;
        window.postMessage({type: 'command', buffer: output}, '*');
        return;
    }

    /**
     * Control individual LEDs on the 5x5 matrix.
     * @param {object} args - the block's arguments.
     */
    displayMatrix (args) {
        if (args.STATE === 'on') {
            this._device.ledMatrixState[args.Y - 1] |= 1 << 5 - args.X;
        } else if (args.STATE === 'off') {
            this._device.ledMatrixState[args.Y - 1] &= ~(1 << 5 - args.X);
        } else return;
        this._displayLEDs(this._device.ledMatrixState);
        return;
    }

    /**
     * Turn all 5x5 matrix LEDs off.
     */
    displayClear () {
        for (let i = 0; i < 5; i++) {
            this._device.ledMatrixState[i] = 0;
        }
        this._displayLEDs(this._device.ledMatrixState);
        return;
    }

    /**
     * Send value to the micro:bit LED matrix
     * @param {Uin8array} matrix - the value to send to the matrix.
     */
    _displayLEDs (matrix) {
        const output = new Uint8Array(matrix.length + 1);
        output[0] = BLECommand.CMD_DISPLAY_LED;
        for (let i = 0; i < matrix.length; i++) {
            output[i + 1] = matrix[i];
        }
        window.postMessage({type: 'command', buffer: output}, '*');
    }

    /**
     * Test whether the tilt sensor is currently tilted.
     * @param {object} args - the block's arguments.
     * @property {TiltDirection} DIRECTION - the tilt direction to test (front, back, left, right, or any).
     * @return {boolean} - true if the tilt sensor is tilted past a threshold in the specified direction.
     */
    whenTilted (args) {
        return this._isTilted(args.DIRECTION);
    }

    /**
     * Test whether the tilt sensor is currently tilted.
     * @param {object} args - the block's arguments.
     * @property {TiltDirection} DIRECTION - the tilt direction to test (front, back, left, right, or any).
     * @return {boolean} - true if the tilt sensor is tilted past a threshold in the specified direction.
     */
    isTilted (args) {
        return this._isTilted(args.DIRECTION);
    }

    /**
     * @param {object} args - the block's arguments.
     * @property {TiltDirection} DIRECTION - the direction (front, back, left, right) to check.
     * @return {number} - the tilt sensor's angle in the specified direction.
     * Note that getTiltAngle(front) = -getTiltAngle(back) and getTiltAngle(left) = -getTiltAngle(right).
     */
    getTiltAngle (args) {
        return this._getTiltAngle(args.DIRECTION);
    }

    /**
     * Test whether the tilt sensor is currently tilted.
     * @param {TiltDirection} direction - the tilt direction to test (front, back, left, right, or any).
     * @return {boolean} - true if the tilt sensor is tilted past a threshold in the specified direction.
     * @private
     */
    _isTilted (direction) {
        switch (direction) {
        case TiltDirection.ANY:
            return (Math.abs(this._device.tiltX / 10) >= Scratch3MicroBitBlocks.TILT_THRESHOLD) ||
                (Math.abs(this._device.tiltY / 10) >= Scratch3MicroBitBlocks.TILT_THRESHOLD);
        default:
            return this._getTiltAngle(direction) >= Scratch3MicroBitBlocks.TILT_THRESHOLD;
        }
    }

    /**
     * @param {TiltDirection} direction - the direction (front, back, left, right) to check.
     * @return {number} - the tilt sensor's angle in the specified direction.
     * Note that getTiltAngle(front) = -getTiltAngle(back) and getTiltAngle(left) = -getTiltAngle(right).
     * @private
     */
    _getTiltAngle (direction) {
        switch (direction) {
        case TiltDirection.FRONT:
            return Math.round(this._device.tiltY / -10);
        case TiltDirection.BACK:
            return Math.round(this._device.tiltY / 10);
        case TiltDirection.LEFT:
            return Math.round(this._device.tiltX / -10);
        case TiltDirection.RIGHT:
            return Math.round(this._device.tiltX / 10);
        default:
            log.warn(`Unknown tilt direction in _getTiltAngle: ${direction}`);
        }
    }

    /**
     * @param {object} args - the block's arguments.
     * @return {boolean} - the touch pin state.
     * @private
     */
    whenPinConnected (args) {
        const pin = parseInt(args.PIN, 10);
        if (isNaN(pin)) return;
        if (pin < 0 || pin > 2) return false;
        return this._device._checkPinState(pin);
    }
}

module.exports = Scratch3MicroBitBlocks;
