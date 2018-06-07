const JSONRPCWebSocket = require('../util/jsonrpc-web-socket');
const PeripheralChooser = require('./peripheralChooser');
const log = require('../util/log');

class ScratchBLE extends JSONRPCWebSocket {

    /**
     * Construct a ScratchBLE session object.
     * @param {Runtime} onReadyCallback - a callback for when the session is ready
     */
    constructor () {

        const ws = new WebSocket('ws://localhost:20110/scratch/ble');

        super(ws);

        this._socketPromise = new Promise((resolve, reject) => {
            ws.onopen = resolve;
            ws.onerror = reject; // is this called onerror? I don't remember
        });

        this.peripheralChooser = new PeripheralChooser();

    }

    waitForConnect () {
        return this._socketPromise;
    }

    requestDevice (deviceOptions /* , guiOptions*/, onConnect, onError) {

        /* guiOptions
        {
            steps: [
                {
                    title: 'Connect to a micro:bit',
                    image: '..',
                    callback: startDiscoveryCallback
                }
            ]
        }
        */

        this.sendRemoteRequest('discover', deviceOptions)
            .then(() => this.peripheralChooser.choosePeripheral) // use guiOptions
            .then(id => this.sendRemoteRequest(
                'connect',
                {peripheralId: id}
            ))
            .then(
                onConnect,
                onError
            );
    }

    didReceiveCall (method, params) {
        switch (method) {
        case 'didDiscoverPeripheral':
            log.info(`Peripheral discovered: ${params.peripheralId}`);
            // *****GUI: send discovered devices to GUI
            this.peripheralChooser.updatePeripheral(params.peripheralId);
            break;
        case 'characteristicDidChange':
            if (this._dataCallback) {
                this._dataCallback(params.message);
            }
            break;
        case 'ping':
            return 42;
        }
    }

    read (serviceId, characteristicId, optStartNotifications = false, callback) {
        const params = {
            serviceId,
            characteristicId
        };
        if (optStartNotifications) {
            params.startNotifications = true;
        }
        this._dataCallback = callback;
        return this.sendRemoteRequest('read', params);
    }

    write (serviceId, characteristicId, message, encoding = null) {
        const params = {serviceId, characteristicId, message};
        if (encoding) {
            params.encoding = encoding;
        }
        return this.sendRemoteRequest('write', params);
    }
}

module.exports = ScratchBLE;
