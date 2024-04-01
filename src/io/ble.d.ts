export = BLE;
declare class BLE extends JSONRPC {
    /**
     * A BLE peripheral socket object.  It handles connecting, over web sockets, to
     * BLE peripherals, and reading and writing data to them.
     * @param {Runtime} runtime - the Runtime for sending/receiving GUI update events.
     * @param {string} extensionId - the id of the extension using this socket.
     * @param {object} peripheralOptions - the list of options for peripheral discovery.
     * @param {object} connectCallback - a callback for connection.
     * @param {object} resetCallback - a callback for resetting extension state.
     */
    constructor(runtime: Runtime, extensionId: string, peripheralOptions: object, connectCallback: object, resetCallback?: object);
    _socket: any;
    _sendMessage: any;
    _availablePeripherals: {};
    _connectCallback: any;
    _connected: boolean;
    _characteristicDidChangeCallback: any;
    _resetCallback: any;
    _discoverTimeoutID: number;
    _extensionId: string;
    _peripheralOptions: any;
    _runtime: Runtime;
    /**
     * Request connection to the peripheral.
     * If the web socket is not yet open, request when the socket promise resolves.
     */
    requestPeripheral(): void;
    /**
     * Try connecting to the input peripheral id, and then call the connect
     * callback if connection is successful.
     * @param {number} id - the id of the peripheral to connect to
     */
    connectPeripheral(id: number): void;
    /**
     * Close the websocket.
     */
    disconnect(): void;
    /**
     * @return {bool} whether the peripheral is connected.
     */
    isConnected(): bool;
    /**
     * Start receiving notifications from the specified ble service.
     * @param {number} serviceId - the ble service to read.
     * @param {number} characteristicId - the ble characteristic to get notifications from.
     * @param {object} onCharacteristicChanged - callback for characteristic change notifications.
     * @return {Promise} - a promise from the remote startNotifications request.
     */
    startNotifications(serviceId: number, characteristicId: number, onCharacteristicChanged?: object): Promise<any>;
    /**
     * Read from the specified ble service.
     * @param {number} serviceId - the ble service to read.
     * @param {number} characteristicId - the ble characteristic to read.
     * @param {boolean} optStartNotifications - whether to start receiving characteristic change notifications.
     * @param {object} onCharacteristicChanged - callback for characteristic change notifications.
     * @return {Promise} - a promise from the remote read request.
     */
    read(serviceId: number, characteristicId: number, optStartNotifications?: boolean, onCharacteristicChanged?: object): Promise<any>;
    /**
     * Write data to the specified ble service.
     * @param {number} serviceId - the ble service to write.
     * @param {number} characteristicId - the ble characteristic to write.
     * @param {string} message - the message to send.
     * @param {string} encoding - the message encoding type.
     * @param {boolean} withResponse - if true, resolve after peripheral's response.
     * @return {Promise} - a promise from the remote send request.
     */
    write(serviceId: number, characteristicId: number, message: string, encoding?: string, withResponse?: boolean): Promise<any>;
    /**
     * Handle a received call from the socket.
     * @param {string} method - a received method label.
     * @param {object} params - a received list of parameters.
     * @return {object} - optional return value.
     */
    didReceiveCall(method: string, params: object): object;
    /**
     * Handle an error resulting from losing connection to a peripheral.
     *
     * This could be due to:
     * - battery depletion
     * - going out of bluetooth range
     * - being powered down
     *
     * Disconnect the socket, and if the extension using this socket has a
     * reset callback, call it. Finally, emit an error to the runtime.
     */
    handleDisconnectError(): void;
    _handleRequestError(): void;
    _handleDiscoverTimeout(): void;
}
import JSONRPC = require("../util/jsonrpc");
