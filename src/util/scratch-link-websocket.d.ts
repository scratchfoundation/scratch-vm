export = ScratchLinkWebSocket;
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
declare class ScratchLinkWebSocket {
    constructor(type: any);
    _type: any;
    _onOpen: any;
    _onClose: any;
    _onError: any;
    _handleMessage: any;
    _ws: any;
    open(): void;
    close(): void;
    sendMessage(message: any): void;
    setOnOpen(fn: any): void;
    setOnClose(fn: any): void;
    setOnError(fn: any): void;
    setHandleMessage(fn: any): void;
    isOpen(): boolean;
    _onMessage(e: any): void;
}
