const JSONRPCWebSocket = require('../util/jsonrpc');

class ScratchBT extends JSONRPCWebSocket {
    constructor() {
        super(new WebSocket('ws://localhost:20110/scratch/bt'));
    }

    requestDevice(options) {
        return this.sendRemoteRequest('discover', options);
    }

    connectDevice(options) {
        return this.sendRemoteRequest('connect', options);
    }

    sendMessage(options) {
        return this.sendRemoteRequest('send', options);
    }

    didReceiveCall(method, params) {
        switch (method) {
            case 'didDiscoverPeripheral':
                addLine(`Peripheral discovered: ${stringify(params)}`);
                break;
            case 'didReceiveMessage':
                addLine(`Message received from peripheral: ${stringify(params)}`);
                break;
            default:
                return 'nah';
        }
    }
}

function stringify(o) {
    return JSON.stringify(o, o && Object.getOwnPropertyNames(o));
}

function addLine(text) {
    console.log('*** MICROBIT ***');
    console.log(text);
}

module.exports = ScratchBT;
