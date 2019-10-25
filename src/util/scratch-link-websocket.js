/**
 * This class provides a ScratchLinkSocket implementation using WebSockets,
 * attempting to connect with the locally installed Scratch-Link.
 *
 * To connect with ScratchLink without WebSockets, you must implement all of the
 * public methods in this class.
 * - open()
 * - close()
 * - setOn[Open|Close|Error]
 * - setHandleMessage
 * - sendMessage(msgObj)
 * - isOpen()
 */
class ScratchLinkWebSocket {
    constructor (type) {
        this._type = type;
        this._onOpen = null;
        this._onClose = null;
        this._onError = null;
        this._handleMessage = null;

        this._ws = null;
    }

    open () {
        switch (this._type) {
        case 'BLE':
            this._ws = new WebSocket('wss://device-manager.scratch.mit.edu:20110/scratch/ble');
            break;
        case 'BT':
            this._ws = new WebSocket('wss://device-manager.scratch.mit.edu:20110/scratch/bt');
            break;
        default:
            throw new Error(`Unknown ScratchLink socket Type: ${this._type}`);
        }

        if (this._onOpen && this._onClose && this._onError && this._handleMessage) {
            this._ws.onopen = this._onOpen;
            this._ws.onclose = this._onClose;
            this._ws.onerror = this._onError;
        } else {
            throw new Error('Must set open, close, message and error handlers before calling open on the socket');
        }

        this._ws.onmessage = this._onMessage.bind(this);
    }

    close () {
        this._ws.close();
        this._ws = null;
    }

    sendMessage (message) {
        const messageText = JSON.stringify(message);
        this._ws.send(messageText);
    }

    setOnOpen (fn) {
        this._onOpen = fn;
    }

    setOnClose (fn) {
        this._onClose = fn;
    }

    setOnError (fn) {
        this._onError = fn;
    }

    setHandleMessage (fn) {
        this._handleMessage = fn;
    }

    isOpen () {
        return this._ws && this._ws.readyState === this._ws.OPEN;
    }

    _onMessage (e) {
        const json = JSON.parse(e.data);
        this._handleMessage(json);
    }
}

module.exports = ScratchLinkWebSocket;
