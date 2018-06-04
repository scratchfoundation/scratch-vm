class JSONRPC {
    constructor() {
        this._requestID = 0;
        this._openRequests = {};
    }

    /**
     * Make an RPC Request and retrieve the result.
     * @param {string} method - the remote method to call
     * @param {object} params - the parameters to pass to the remote method
     * @returns {Promise} - a promise for the result of the call
     */
    sendRemoteRequest(method, params) {
        const requestID = this._requestID++;

        const promise = new Promise((resolve, reject) => {
            this._openRequests[requestID] = { resolve, reject };
        });

        this._sendRequest(method, params, requestID);

        return promise;
    }

    /**
     * Make an RPC Notification with no expectation of a result or callback.
     * @param {string} method - the remote method to call
     * @param {object} params - the parameters to pass to the remote method
     */
    sendRemoteNotification(method, params) {
        this._sendRequest(method, params);
    }

    /**
     * Handle an RPC request from remote.
     * @param {string} method - the method requested by the remote caller
     * @param {object} params - the parameters sent with the remote caller's request
     * @returns a result or Promise for result, if appropriate.
     */
    didReceiveCall(method, params) {
        throw new Error("Must override didReceiveCall");
    }

    /**
     * Send a JSON-style message object over the transport.
     * @param {object} jsonMessageObject - the message to send
     * @private
     */
    _sendMessage(jsonMessageObject) {
        throw new Error("Must override _sendMessage");
    }

    _sendRequest(method, params, id) {
        const request = {
            jsonrpc: "2.0",
            method,
            params
        };

        if (id != null) {
            request.id = id;
        }

        this._sendMessage(request);
    }

    _handleMessage(json) {
        if (json.jsonrpc !== '2.0') {
            throw new Error(`Bad or missing JSON-RPC version in message: ${stringify(json)}`);
        }
        if (json.hasOwnProperty('method')) {
            console.log("jsonrpc handlemessage / handlerequest");
            this._handleRequest(json);
        } else {
            console.log("jsonrpc handlemessage / handleresponse");
            this._handleResponse(json);
        }
    }

    _sendResponse(id, result, error) {
        const response = {
            jsonrpc: '2.0',
            id
        };
        if (error != null) {
            response.error = error;
        } else {
            response.result = result || null;
        }
        this._sendMessage(response);
    }

    _handleResponse(json) {
        const { result, error, id } = json;
        const openRequest = this._openRequests[id];
        delete this._openRequests[id];
        if (error) {
            openRequest.reject(error);
        } else {
            openRequest.resolve(result);
        }
    }

    _handleRequest(json) {
        const { method, params, id } = json;
        const rawResult = this.didReceiveCall(method, params);
        if (id != null) {
            Promise.resolve(rawResult).then(
                result => {
                    this._sendResponse(id, result);
                },
                error => {
                    this._sendResponse(id, null, error);
                }
            );
        }
    }
}

module.exports = JSONRPC;
