const JSONRPCWebSocket = require('../util/jsonrpc-web-socket');
const log = require('../util/log');

class ScratchBLE extends JSONRPCWebSocket {
    constructor (webSocket) {
        super(webSocket); // TODO: Put Scratch-Link BLE URL back in here

        this.discoveredPeripheralId = null;
    }

    requestDevice (options) {
        return this.sendRemoteRequest('discover', options);
    }

    didReceiveCall (method, params) {
        switch (method) {
        case 'didDiscoverPeripheral':
            log.info(`Peripheral discovered: ${params.peripheralId}`);
            this.discoveredPeripheralId = params.peripheralId;
            break;
        case 'characteristicDidChange':
            log.info(`Characteristic changed: ${params}`);
            return 'test';
        case 'ping':
            return 42;
        }
    }

    read (serviceId, characteristicId, optStartNotifications = false) {
        const params = {
            serviceId,
            characteristicId
        };
        if (optStartNotifications) {
            params.startNotifications = true;
        }
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
