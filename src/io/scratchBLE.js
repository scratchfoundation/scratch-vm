const JSONRPCWebSocket = require('../util/jsonrpc-web-socket');

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
            log(`Peripheral discovered: ${stringify(params)}`);
            this.discoveredPeripheralId = params['peripheralId'];
            break;
        case 'characteristicDidChange':
            const binary_string =  window.atob(params.message);
            const len = binary_string.length;
            const bytes = new Uint8Array( len );
            for (var i = 0; i < len; i++)        {
                bytes[i] = binary_string.charCodeAt(i);
            }
            log(`CHARACTERISTIC DID CHANGE! `);
            console.log(bytes.buffer);
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

function stringify(o) {
    return JSON.stringify(o, o && Object.getOwnPropertyNames(o));
}

function log(text) {
    console.log(`ScratchBLE: ` + text);
}

module.exports = ScratchBLE;
