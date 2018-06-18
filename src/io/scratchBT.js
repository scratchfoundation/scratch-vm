const JSONRPCWebSocket = require('../util/jsonrpc');

const ScratchLinkWebSocket = 'ws://localhost:20110/scratch/bt';

class ScratchBT extends JSONRPCWebSocket {
    constructor () {
        super(new WebSocket(ScratchLinkWebSocket));
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

    didReceiveCall (method /* , params */) {
        // TODO: Add peripheral 'undiscover' handling
        switch (method) {
        case 'didDiscoverPeripheral':
            // TODO: do something on peripheral discovered
            break;
        case 'didReceiveMessage':
            // TODO: do something on received message
            break;
        default:
            return 'nah';
        }
    }
}

module.exports = ScratchBT;
