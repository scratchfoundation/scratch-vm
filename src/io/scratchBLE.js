const JSONRPCWebSocket = require('../util/jsonrpc-web-socket');
const PeripheralChooser = require('./peripheralChooser');

class ScratchBLE extends JSONRPCWebSocket {

    /**
     * Construct a ScratchBLE session object.
     * @param {Runtime} onReadyCallback - a callback for when the session is ready
     */
    constructor () {

        const ws = new WebSocket('ws://localhost:20110/scratch/ble');

        super(ws);

        this.peripheralChooser = new PeripheralChooser();

        this._socketPromise = new Promise((resolve, reject) => {
            ws.onopen = resolve;
            ws.onerror = reject;
        });
        this._characteristicDidChange = null;

    }

    /**
     * Returns a promise for when the web socket opens.
     * @return {Promise} - a promise when BLE socket is open
     */
    waitForSocket () {
        return this._socketPromise;
    }

    /**
     * Request a device with the device options and optional gui options.
     * @param {object} deviceOptions - list of device guiOptions
     * @param {callback} onConnect - on connect callback
     * @param {callback} onError - on error callback
     */
    requestDevice (deviceOptions /* , guiOptions*/, onConnect, onError) {

        /* guiOptions
        {
            steps: [
                {
                    title: 'Connect to a micro:bit',
                    image: '..',
                    callback: startDiscoveryCallback // ??
                }
            ]
        }
        */

        this.sendRemoteRequest('discover', deviceOptions)
            .then(() => this.peripheralChooser.choosePeripheral()) // use guiOptions
            .then(id => this.sendRemoteRequest(
                'connect',
                {peripheralId: id}
            ))
            .then(
                onConnect,
                onError
            );
    }

    /**
     * TODO: method signature
     */
    didReceiveCall (method, params) {
        switch (method) {
        case 'didDiscoverPeripheral':
            this.peripheralChooser.addPeripheral(params.peripheralId);
            break;
        case 'characteristicDidChange':
            this._characteristicDidChange(params.message);
            break;
        case 'ping':
            return 42;
        }
    }

    /**
     * TODO: method signature
     */
    read (serviceId, characteristicId, optStartNotifications = false, onCharacteristicChanged) {
        const params = {
            serviceId,
            characteristicId
        };
        if (optStartNotifications) {
            params.startNotifications = true;
        }
        this._characteristicDidChange = onCharacteristicChanged; // TODO: is this the best way to do this?
        return this.sendRemoteRequest('read', params);
    }

    /**
     * TODO: method signature
     */
    write (serviceId, characteristicId, message, encoding = null) {
        const params = {serviceId, characteristicId, message};
        if (encoding) {
            params.encoding = encoding;
        }
        return this.sendRemoteRequest('write', params);
    }
}

module.exports = ScratchBLE;
