const JSONRPC = require('./jsonrpc');
const log = require('./log');

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

    _onSocketOpen (e) {
        log.info(`WS opened: ${e}`);
    }

    _onSocketClose (e) {
        log.info(`WS closed: ${e}`);
    }

    _onSocketError (e) {
        log.info(`WS error: ${e}`);
    }

    _onSocketMessage (e) {
        log.info(`Received message: ${e.data}`);
        const json = JSON.parse(e.data);
        this._handleMessage(json);
    }

    _sendMessage (message) {
        const messageText = JSON.stringify(message);
        log.info(`Sending message: ${messageText}`);
        this._ws.send(messageText);
    }
}

module.exports = JSONRPCWebSocket;
