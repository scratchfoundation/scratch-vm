const JSONRPCWebSocket = require('../util/jsonrpc-web-socket');

class ScratchBLE extends JSONRPCWebSocket {
    constructor() {
        super(new WebSocket('ws://localhost:20110/scratch/ble'));

        this.discoveredPeripheralId = null;
    }

    requestDevice(options) {
        return this.sendRemoteRequest('discover', options);
    }

    didReceiveCall(method, params) {
        switch (method) {
        case 'didDiscoverPeripheral':
            log(`Peripheral discovered: ${stringify(params)}`);
            this.discoveredPeripheralId = params['peripheralId'];
            break;
        case 'ping':
            return 42;
        }
    }

    read(serviceId, characteristicId, optStartNotifications = false) {
        const params = {
            serviceId,
            characteristicId
        };
        if (optStartNotifications) {
            params.startNotifications = true;
        }
        return this.sendRemoteRequest('read', params);
    }

    write(serviceId, characteristicId, message, encoding = null) {
        const params = { serviceId, characteristicId, message };
        if (encoding) {
            params.encoding = encoding;
        }
        return this.sendRemoteRequest('write', params);
    }
}

function stringify(o) {
    return JSON.stringify(o, o && Object.getOwnPropertyNames(o));
}

function log(text) {
    console.log('ScratchBLE:');
    console.log(text);
}

module.exports = ScratchBLE;
