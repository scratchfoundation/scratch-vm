export = JSONRPC;
declare class JSONRPC {
    _requestID: number;
    _openRequests: {};
    /**
     * Make an RPC request and retrieve the result.
     * @param {string} method - the remote method to call.
     * @param {object} params - the parameters to pass to the remote method.
     * @returns {Promise} - a promise for the result of the call.
     */
    sendRemoteRequest(method: string, params: object): Promise<any>;
    /**
     * Make an RPC notification with no expectation of a result or callback.
     * @param {string} method - the remote method to call.
     * @param {object} params - the parameters to pass to the remote method.
     */
    sendRemoteNotification(method: string, params: object): void;
    /**
     * Handle an RPC request from remote, should return a result or Promise for result, if appropriate.
     * @param {string} method - the method requested by the remote caller.
     * @param {object} params - the parameters sent with the remote caller's request.
     */
    didReceiveCall(): void;
    _sendMessage(): void;
    _sendRequest(method: any, params: any, id: any): void;
    _handleMessage(json: any): void;
    _sendResponse(id: any, result: any, error: any): void;
    _handleResponse(json: any): void;
    _handleRequest(json: any): void;
}
