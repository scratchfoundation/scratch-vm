const JSONRPC = require('./jsonrpc');
// const log = require('../util/log');

class JSONRPCWebSocket extends JSONRPC {
    constructor (webSocket) {
        super();

        this._ws = webSocket;
        this._ws.onmessage = e => this._onSocketMessage(e);
        this._ws.onopen = e => this._onSocketOpen(e);
        this._ws.onclose = e => this._onSocketClose(e);
        this._ws.onerror = e => this._onSocketError(e);
    }

    dispose () {
        this._ws.close();
        this._ws = null;
    }

    _onSocketOpen () {
    }

    _onSocketClose () {
    }

    _onSocketError () {
    }

    _onSocketMessage (e) {
        const json = JSON.parse(e.data);
        this._handleMessage(json);
    }

    _sendMessage (message) {
        const messageText = JSON.stringify(message);
        this._ws.send(messageText);
    }
}

module.exports = JSONRPCWebSocket;
