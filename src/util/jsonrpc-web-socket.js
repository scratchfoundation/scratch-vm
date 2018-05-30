const JSONRPC = require('./jsonrpc');

class JSONRPCWebSocket extends JSONRPC {
    constructor(webSocket) {
        super();

        this._ws = webSocket;
        this._ws.onmessage = e => this._onSocketMessage(e);
        this._ws.onopen = e => this._onSocketOpen(e);
        this._ws.onclose = e => this._onSocketClose(e);
        this._ws.onerror = e => this._onSocketError(e);
    }

    dispose() {
        this._ws.close();
        this._ws = null;
    }

    _onSocketOpen(e) {
        log(`WS opened: ${stringify(e)}`);
    }

    _onSocketClose(e) {
        log(`WS closed: ${stringify(e)}`);
    }

    _onSocketError(e) {
        log(`WS error: ${stringify(e)}`);
    }

    _onSocketMessage(e) {
        log(`Received message: ${e.data}`);
        const json = JSON.parse(e.data);
        this._handleMessage(json);
    }

    _sendMessage(message) {
        const messageText = JSON.stringify(message);
        log(`Sending message: ${messageText}`);
        this._ws.send(messageText);
    }
}

function stringify(o) {
    return JSON.stringify(o, o && Object.getOwnPropertyNames(o));
}

function log(text) {
    console.log('JSONRPCWebSocket:');
    console.log(text);
}

module.exports = JSONRPCWebSocket;
