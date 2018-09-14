const JSONRPCWebSocket = require('../util/jsonrpc-web-socket');
const ScratchLinkWebSocket = 'wss://device-manager.scratch.mit.edu:20110/scratch/ble';
// const log = require('../util/log');

class BLE extends JSONRPCWebSocket {

    /**
     * A BLE peripheral socket object.  It handles connecting, over web sockets, to
     * BLE peripherals, and reading and writing data to them.
     * @param {Runtime} runtime - the Runtime for sending/receiving GUI update events.
     * @param {object} peripheralOptions - the list of options for peripheral discovery.
     * @param {object} connectCallback - a callback for connection.
     */
    constructor (runtime, peripheralOptions, connectCallback) {
        const ws = new WebSocket(ScratchLinkWebSocket);
        super(ws);

        this._ws = ws;
        this._ws.onopen = this.requestPeripheral.bind(this); // only call request peripheral after socket opens
        this._ws.onerror = this._sendError.bind(this, 'ws onerror');
        this._ws.onclose = this._sendError.bind(this, 'ws onclose');

        this._availablePeripherals = {};
        this._connectCallback = connectCallback;
        this._connected = false;
        this._characteristicDidChangeCallback = null;
        this._peripheralOptions = peripheralOptions;
        this._discoverTimeoutID = null;
        this._runtime = runtime;
    }

    /**
     * Request connection to the peripheral.
     * If the web socket is not yet open, request when the socket promise resolves.
     */
    requestPeripheral () {
        if (this._ws.readyState === 1) { // is this needed since it's only called on ws.onopen?
            this._availablePeripherals = {};
            this._discoverTimeoutID = window.setTimeout(this._sendDiscoverTimeout.bind(this), 15000);
            this.sendRemoteRequest('discover', this._peripheralOptions)
                .catch(e => {
                    this._sendError(e);
                }); // never reached?
        }
        // TODO: else?
    }

    /**
     * Try connecting to the input peripheral id, and then call the connect
     * callback if connection is successful.
     * @param {number} id - the id of the peripheral to connect to
     */
    connectPeripheral (id) {
        this.sendRemoteRequest('connect', {peripheralId: id})
            .then(() => {
                this._connected = true;
                this._runtime.emit(this._runtime.constructor.PERIPHERAL_CONNECTED);
                this._connectCallback();
            })
            .catch(e => {
                this._sendError(e);
            });
    }

    /**
     * Close the websocket.
     */
    disconnect () {
        this._ws.close();
        this._connected = false;
    }

    /**
     * @return {bool} whether the peripheral is connected.
     */
    isConnected () {
        return this._connected;
    }

    /**
     * Start receiving notifications from the specified ble service.
     * @param {number} serviceId - the ble service to read.
     * @param {number} characteristicId - the ble characteristic to get notifications from.
     * @param {object} onCharacteristicChanged - callback for characteristic change notifications.
     * @return {Promise} - a promise from the remote startNotifications request.
     */
    startNotifications (serviceId, characteristicId, onCharacteristicChanged = null) {
        const params = {
            serviceId,
            characteristicId
        };
        this._characteristicDidChangeCallback = onCharacteristicChanged;
        return this.sendRemoteRequest('startNotifications', params)
            .catch(e => {
                this._sendError(e);
            });
    }

    /**
     * Read from the specified ble service.
     * @param {number} serviceId - the ble service to read.
     * @param {number} characteristicId - the ble characteristic to read.
     * @param {boolean} optStartNotifications - whether to start receiving characteristic change notifications.
     * @param {object} onCharacteristicChanged - callback for characteristic change notifications.
     * @return {Promise} - a promise from the remote read request.
     */
    read (serviceId, characteristicId, optStartNotifications = false, onCharacteristicChanged = null) {
        const params = {
            serviceId,
            characteristicId
        };
        if (optStartNotifications) {
            params.startNotifications = true;
        }
        this._characteristicDidChangeCallback = onCharacteristicChanged;
        return this.sendRemoteRequest('read', params)
            .catch(e => {
                this._sendError(e);
            });
    }

    /**
     * Write data to the specified ble service.
     * @param {number} serviceId - the ble service to write.
     * @param {number} characteristicId - the ble characteristic to write.
     * @param {string} message - the message to send.
     * @param {string} encoding - the message encoding type.
     * @param {boolean} withResponse - if true, resolve after peripheral's response.
     * @return {Promise} - a promise from the remote send request.
     */
    write (serviceId, characteristicId, message, encoding = null, withResponse = null) {
        const params = {serviceId, characteristicId, message};
        if (encoding) {
            params.encoding = encoding;
        }
        if (withResponse) {
            params.withResponse = withResponse;
        }
        return this.sendRemoteRequest('write', params)
            .catch(e => {
                this._sendError(e);
            });
    }

    /**
     * Handle a received call from the socket.
     * @param {string} method - a received method label.
     * @param {object} params - a received list of parameters.
     * @return {object} - optional return value.
     */
    didReceiveCall (method, params) {
        switch (method) {
        case 'didDiscoverPeripheral':
            this._availablePeripherals[params.peripheralId] = params;
            this._runtime.emit(
                this._runtime.constructor.PERIPHERAL_LIST_UPDATE,
                this._availablePeripherals
            );
            if (this._discoverTimeoutID) {
                // TODO: window?
                window.clearTimeout(this._discoverTimeoutID);
            }
            break;
        case 'characteristicDidChange':
            this._characteristicDidChangeCallback(params.message);
            break;
        case 'ping':
            return 42;
        }
    }

    _sendError (/* e */) {
        this.disconnect();
        // log.error(`BLE error: ${JSON.stringify(e)}`);
        this._runtime.emit(this._runtime.constructor.PERIPHERAL_ERROR);
    }

    _sendDiscoverTimeout () {
        this._runtime.emit(this._runtime.constructor.PERIPHERAL_SCAN_TIMEOUT);
    }
}

module.exports = BLE;
