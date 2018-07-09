const JSONRPCWebSocket = require('../util/jsonrpc-web-socket');
const log = require('../util/log');
const ScratchLinkWebSocket = 'ws://localhost:20110/scratch/ble';

class BLESession extends JSONRPCWebSocket {

    /**
     * A BLE device session object.  It handles connecting, over web sockets, to
     * BLE devices, and reading and writing data to them.
     * @param {Runtime} runtime - the Runtime for sending/receiving GUI update events.
     * @param {object} deviceOptions - the list of options for device discovery.
     * @param {object} connectCallback - a callback for connection.
     */
    constructor (runtime, deviceOptions, connectCallback) {
        const ws = new WebSocket(ScratchLinkWebSocket);
        super(ws);

        this._ws = ws;
        this._ws.onopen = this.requestDevice.bind(this); // only call request device after socket opens
        this._ws.onerror = this._sendError.bind(this, 'ws onerror');
        this._ws.onclose = this._sendError.bind(this, 'ws onclose');

        this._availablePeripherals = {};
        this._connectCallback = connectCallback;
        this._characteristicDidChangeCallback = null;
        this._deviceOptions = deviceOptions;
        this._runtime = runtime;

        this._connected = false;
    }

    /**
     * Request connection to the device.
     * If the web socket is not yet open, request when the socket promise resolves.
     */
    requestDevice () {
        if (this._ws.readyState === 1) { // is this needed since it's only called on ws.onopen?
            // TODO: start a 'discover' timeout
            this.sendRemoteRequest('discover', this._deviceOptions)
                .catch(e => this._sendError(e)); // never reached?
        }
        // TODO: else?
    }

    /**
     * Try connecting to the input peripheral id, and then call the connect
     * callback if connection is successful.
     * @param {number} id - the id of the peripheral to connect to
     */
    connectDevice (id) {
        this.sendRemoteRequest('connect', {peripheralId: id})
            .then(() => {
                log.info('should have connected');
                this._runtime.emit(this._runtime.constructor.PERIPHERAL_CONNECTED);
                this._connected = true;
                this._connectCallback();
            })
            .catch(e => {
                this._sendError(e);
            });
    }

    /**
     * Close the websocket.
     */
    disconnectSession () {
        this._ws.close();
        this._connected = false;
    }

    /**
     * @return {bool} whether the peripheral is connected.
     */
    getPeripheralIsConnected () {
        return this._connected;
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
            // TODO: cancel a discover timeout if one is active
            break;
        case 'characteristicDidChange':
            this._characteristicDidChangeCallback(params.message);
            break;
        case 'ping':
            return 42;
        }
    }

    /**
     * Start reading from the specified ble service.
     * @param {number} serviceId - the ble service to read.
     * @param {number} characteristicId - the ble characteristic to read.
     * @param {boolean} optStartNotifications - whether to start receiving characteristic change notifications.
     * @param {object} onCharacteristicChanged - callback for characteristic change notifications.
     * @return {Promise} - a promise from the remote read request.
     */
    read (serviceId, characteristicId, optStartNotifications = false, onCharacteristicChanged) {
        const params = {
            serviceId,
            characteristicId
        };
        if (optStartNotifications) {
            params.startNotifications = true;
        }
        this._characteristicDidChangeCallback = onCharacteristicChanged;
        return this.sendRemoteRequest('read', params);
        // TODO: handle error here
    }

    /**
     * Write data to the specified ble service.
     * @param {number} serviceId - the ble service to write.
     * @param {number} characteristicId - the ble characteristic to write.
     * @param {string} message - the message to send.
     * @param {string} encoding - the message encoding type.
     * @return {Promise} - a promise from the remote send request.
     */
    write (serviceId, characteristicId, message, encoding = null) {
        const params = {serviceId, characteristicId, message};
        if (encoding) {
            params.encoding = encoding;
        }
        return this.sendRemoteRequest('write', params);
    }

    _sendError (e) {
        this._connected = false;
        log.error(`BLESession error: ${JSON.stringify(e)}`);
        this._runtime.emit(this._runtime.constructor.PERIPHERAL_ERROR);
    }
}

module.exports = BLESession;
