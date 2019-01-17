const JSONRPCWebSocket = require('../util/jsonrpc-web-socket');
const ScratchLinkWebSocket = 'wss://device-manager.scratch.mit.edu:20110/scratch/bt';
// const log = require('../util/log');

class BT extends JSONRPCWebSocket {

    /**
     * A BT peripheral socket object.  It handles connecting, over web sockets, to
     * BT peripherals, and reading and writing data to them.
     * @param {Runtime} runtime - the Runtime for sending/receiving GUI update events.
     * @param {string} extensionId - the id of the extension using this socket.
     * @param {object} peripheralOptions - the list of options for peripheral discovery.
     * @param {object} connectCallback - a callback for connection.
     * @param {object} disconnectCallback - a callback for disconnection.
     * @param {object} messageCallback - a callback for message sending.
     */
    constructor (runtime, extensionId, peripheralOptions, connectCallback, disconnectCallback = null, messageCallback) {
        const ws = new WebSocket(ScratchLinkWebSocket);
        super(ws);

        this._ws = ws;
        this._ws.onopen = this.requestPeripheral.bind(this); // only call request peripheral after socket opens
        this._ws.onerror = this._handleRequestError.bind(this, 'ws onerror');
        this._ws.onclose = this.handleDisconnectError.bind(this, 'ws onclose');

        this._availablePeripherals = {};
        this._connectCallback = connectCallback;
        this._connected = false;
        this._characteristicDidChangeCallback = null;
        this._disconnectCallback = disconnectCallback;
        this._discoverTimeoutID = null;
        this._extensionId = extensionId;
        this._peripheralOptions = peripheralOptions;
        this._messageCallback = messageCallback;
        this._runtime = runtime;
    }

    /**
     * Request connection to the peripheral.
     * If the web socket is not yet open, request when the socket promise resolves.
     */
    requestPeripheral () {
        if (this._ws.readyState === 1) { // is this needed since it's only called on ws.onopen?
            this._availablePeripherals = {};
            if (this._discoverTimeoutID) {
                window.clearTimeout(this._discoverTimeoutID);
            }
            this._discoverTimeoutID = window.setTimeout(this._handleDiscoverTimeout.bind(this), 15000);
            this.sendRemoteRequest('discover', this._peripheralOptions)
                .catch(
                    e => this._handleRequestError(e)
                );
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
                this._handleRequestError(e);
            });
    }

    /**
     * Close the websocket.
     */
    disconnect () {
        if (!this._connected) return;

        this._ws.close();
        this._connected = false;
        if (this._discoverTimeoutID) {
            window.clearTimeout(this._discoverTimeoutID);
        }

        this._runtime.emit(this._runtime.constructor.PERIPHERAL_DISCONNECTED);
    }

    /**
     * @return {bool} whether the peripheral is connected.
     */
    isConnected () {
        return this._connected;
    }

    sendMessage (options) {
        return this.sendRemoteRequest('send', options)
            .catch(e => {
                this.handleDisconnectError(e);
            });
    }

    /**
     * Handle a received call from the socket.
     * @param {string} method - a received method label.
     * @param {object} params - a received list of parameters.
     * @return {object} - optional return value.
     */
    didReceiveCall (method, params) {
        // TODO: Add peripheral 'undiscover' handling
        switch (method) {
        case 'didDiscoverPeripheral':
            this._availablePeripherals[params.peripheralId] = params;
            this._runtime.emit(
                this._runtime.constructor.PERIPHERAL_LIST_UPDATE,
                this._availablePeripherals
            );
            if (this._discoverTimeoutID) {
                window.clearTimeout(this._discoverTimeoutID);
            }
            break;
        case 'didReceiveMessage':
            this._messageCallback(params); // TODO: refine?
            break;
        default:
            return 'nah';
        }
    }

    /**
     * Handle an error resulting from losing connection to a peripheral.
     *
     * This could be due to:
     * - battery depletion
     * - going out of bluetooth range
     * - being powered down
     *
     * Disconnect the socket, and if the extension using this socket has a
     * disconnect callback, call it. Finally, emit an error to the runtime.
     */
    handleDisconnectError (/* e */) {
        // log.error(`BT error: ${JSON.stringify(e)}`);

        if (!this._connected) return;

        // TODO: Fix branching by splitting up cleanup/disconnect in extension
        if (this._disconnectCallback) {
            this._disconnectCallback(); // must call disconnect()
        } else {
            this.disconnect();
        }

        this._runtime.emit(this._runtime.constructor.PERIPHERAL_CONNECTION_LOST_ERROR, {
            message: `Scratch lost connection to`,
            extensionId: this._extensionId
        });
    }

    _handleRequestError (/* e */) {
        // log.error(`BT error: ${JSON.stringify(e)}`);

        this._runtime.emit(this._runtime.constructor.PERIPHERAL_REQUEST_ERROR, {
            message: `Scratch lost connection to`,
            extensionId: this._extensionId
        });
    }

    _handleDiscoverTimeout () {
        if (this._discoverTimeoutID) {
            window.clearTimeout(this._discoverTimeoutID);
        }
        this._runtime.emit(this._runtime.constructor.PERIPHERAL_SCAN_TIMEOUT);
    }
}

module.exports = BT;
