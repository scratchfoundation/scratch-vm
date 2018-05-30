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
        addLine(`WS opened: ${stringify(e)}`);
    }

    _onSocketClose(e) {
        addLine(`WS closed: ${stringify(e)}`);
    }

    _onSocketError(e) {
        addLine(`WS error: ${stringify(e)}`);
    }

    _onSocketMessage(e) {
        addLine(`Received message: ${e.data}`);
        const json = JSON.parse(e.data);
        this._handleMessage(json);
    }

    _sendMessage(message) {
        const messageText = JSON.stringify(message);
        addLine(`Sending message: ${messageText}`);
        this._ws.send(messageText);
    }
}

module.exports = JSONRPCWebSocket;
