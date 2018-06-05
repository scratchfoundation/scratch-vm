const JSONRPCWebSocket = require('../util/jsonrpc');
const log = require('../util/log');

class ScratchBT extends JSONRPCWebSocket {
    constructor () {
        super(new WebSocket('ws://localhost:20110/scratch/bt'));
    }

    requestDevice (options) {
        return this.sendRemoteRequest('discover', options);
    }

    connectDevice (options) {
        return this.sendRemoteRequest('connect', options);
    }

    sendMessage (options) {
        return this.sendRemoteRequest('send', options);
    }

    didReceiveCall (method, params) {
        switch (method) {
        case 'didDiscoverPeripheral':
            log.info(`Peripheral discovered: ${params}`);
            break;
        case 'didReceiveMessage':
            log.info(`Message received from peripheral: ${params}`);
            break;
        default:
            return 'nah';
        }
    }
}

module.exports = ScratchBT;
