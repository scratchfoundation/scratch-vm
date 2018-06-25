class JSONRPC {
    constructor () {
        this._requestID = 0;
        this._openRequests = {};
    }

    /**
     * Make an RPC request and retrieve the result.
     * @param {string} method - the remote method to call.
     * @param {object} params - the parameters to pass to the remote method.
     * @returns {Promise} - a promise for the result of the call.
     */
    sendRemoteRequest (method, params) {
        const requestID = this._requestID++;

        const promise = new Promise((resolve, reject) => {
            this._openRequests[requestID] = {resolve, reject};
        });

        this._sendRequest(method, params, requestID);

        return promise;
    }

    /**
     * Make an RPC notification with no expectation of a result or callback.
     * @param {string} method - the remote method to call.
     * @param {object} params - the parameters to pass to the remote method.
     */
    sendRemoteNotification (method, params) {
        this._sendRequest(method, params);
    }

    /**
     * Handle an RPC request from remote, should return a result or Promise for result, if appropriate.
     * @param {string} method - the method requested by the remote caller.
     * @param {object} params - the parameters sent with the remote caller's request.
     */
    didReceiveCall (/* method , params */) {
        throw new Error('Must override didReceiveCall');
    }

    _sendMessage (/* jsonMessageObject */) {
        throw new Error('Must override _sendMessage');
    }

    _sendRequest (method, params, id) {
        const request = {
            jsonrpc: '2.0',
            method,
            params
        };

        if (id !== null) {
            request.id = id;
        }

        this._sendMessage(request);
    }

    _handleMessage (json) {
        if (json.jsonrpc !== '2.0') {
            throw new Error(`Bad or missing JSON-RPC version in message: ${json}`);
        }
        if (json.hasOwnProperty('method')) {
            this._handleRequest(json);
        } else {
            this._handleResponse(json);
        }
    }

    _sendResponse (id, result, error) {
        const response = {
            jsonrpc: '2.0',
            id
        };
        if (error) {
            response.error = error;
        } else {
            response.result = result || null;
        }
        this._sendMessage(response);
    }

    _handleResponse (json) {
        const {result, error, id} = json;
        const openRequest = this._openRequests[id];
        delete this._openRequests[id];
        if (error) {
            openRequest.reject(error);
        } else {
            openRequest.resolve(result);
        }
    }

    _handleRequest (json) {
        const {method, params, id} = json;
        const rawResult = this.didReceiveCall(method, params);
        if (id) {
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
