const log = require('../util/log');

/**
 * @typedef {object} DispatchCallMessage - a message to the dispatch system representing a service method call
 * @property {*} responseId - send a response message with this response ID. See {@link DispatchResponseMessage}
 * @property {string} service - the name of the service to be called
 * @property {string} method - the name of the method to be called
 * @property {Array|undefined} args - the arguments to be passed to the method
 */

/**
 * @typedef {object} DispatchResponseMessage - a message to the dispatch system representing the results of a call
 * @property {*} responseId - a copy of the response ID from the call which generated this response
 * @property {*|undefined} error - if this is truthy, then it contains results from a failed call (such as an exception)
 * @property {*|undefined} result - if error is not truthy, then this contains the return value of the call (if any)
 */

/**
 * @typedef {DispatchCallMessage|DispatchResponseMessage} DispatchMessage
 * Any message to the dispatch system.
 */

/**
 * The SharedDispatch class is responsible for dispatch features shared by
 * {@link CentralDispatch} and {@link WorkerDispatch}.
 */
class SharedDispatch {
    constructor () {
        /**
         * List of callback registrations for promises waiting for a response from a call to a service on another
         * worker. A callback registration is an array of [resolve,reject] Promise functions.
         * Calls to local services don't enter this list.
         * @type {Array.<Function[]>}
         */
        this.callbacks = [];

        /**
         * The next response ID to be used.
         * @type {int}
         */
        this.nextResponseId = 0;
    }

    /**
     * Call a particular method on a particular service, regardless of whether that service is provided locally or on
     * a worker. If the service is provided by a worker, the `args` will be copied using the Structured Clone
     * algorithm, except for any items which are also in the `transfer` list. Ownership of those items will be
     * transferred to the worker, and they should not be used after this call.
     * @example
     *      dispatcher.call('vm', 'setData', 'cat', 42);
     *      // this finds the worker for the 'vm' service, then on that worker calls:
     *      vm.setData('cat', 42);
     * @param {string} service - the name of the service.
     * @param {string} method - the name of the method.
     * @param {*} [args] - the arguments to be copied to the method, if any.
     * @returns {Promise} - a promise for the return value of the service method.
     */
    call (service, method, ...args) {
        return this.transferCall(service, method, null, ...args);
    }

    /**
     * Call a particular method on a particular service, regardless of whether that service is provided locally or on
     * a worker. If the service is provided by a worker, the `args` will be copied using the Structured Clone
     * algorithm, except for any items which are also in the `transfer` list. Ownership of those items will be
     * transferred to the worker, and they should not be used after this call.
     * @example
     *      dispatcher.transferCall('vm', 'setData', [myArrayBuffer], 'cat', myArrayBuffer);
     *      // this finds the worker for the 'vm' service, transfers `myArrayBuffer` to it, then on that worker calls:
     *      vm.setData('cat', myArrayBuffer);
     * @param {string} service - the name of the service.
     * @param {string} method - the name of the method.
     * @param {Array} [transfer] - objects to be transferred instead of copied. Must be present in `args` to be useful.
     * @param {*} [args] - the arguments to be copied to the method, if any.
     * @returns {Promise} - a promise for the return value of the service method.
     */
    transferCall (service, method, transfer, ...args) {
        try {
            const {provider, isRemote} = this._getServiceProvider(service);
            if (provider) {
                if (isRemote) {
                    return this._remoteTransferCall(provider, service, method, transfer, ...args);
                }

                const result = provider[method].apply(provider, args);
                return Promise.resolve(result);
            }
            return Promise.reject(new Error(`Service not found: ${service}`));
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Check if a particular service lives on another worker.
     * @param {string} service - the service to check.
     * @returns {boolean} - true if the service is remote (calls must cross a Worker boundary), false otherwise.
     * @private
     */
    _isRemoteService (service) {
        return this._getServiceProvider(service).isRemote;
    }

    /**
     * Like {@link call}, but force the call to be posted through a particular communication channel.
     * @param {object} provider - send the call through this object's `postMessage` function.
     * @param {string} service - the name of the service.
     * @param {string} method - the name of the method.
     * @param {*} [args] - the arguments to be copied to the method, if any.
     * @returns {Promise} - a promise for the return value of the service method.
     */
    _remoteCall (provider, service, method, ...args) {
        return this._remoteTransferCall(provider, service, method, null, ...args);
    }

    /**
     * Like {@link transferCall}, but force the call to be posted through a particular communication channel.
     * @param {object} provider - send the call through this object's `postMessage` function.
     * @param {string} service - the name of the service.
     * @param {string} method - the name of the method.
     * @param {Array} [transfer] - objects to be transferred instead of copied. Must be present in `args` to be useful.
     * @param {*} [args] - the arguments to be copied to the method, if any.
     * @returns {Promise} - a promise for the return value of the service method.
     */
    _remoteTransferCall (provider, service, method, transfer, ...args) {
        return new Promise((resolve, reject) => {
            const responseId = this._storeCallbacks(resolve, reject);

            /** @TODO: remove this hack! this is just here so we don't try to send `util` to a worker */
            if ((args.length > 0) && (typeof args[args.length - 1].yield === 'function')) {
                args.pop();
            }

            if (transfer) {
                provider.postMessage({service, method, responseId, args}, transfer);
            } else {
                provider.postMessage({service, method, responseId, args});
            }
        });
    }

    /**
     * Store callback functions pending a response message.
     * @param {Function} resolve - function to call if the service method returns.
     * @param {Function} reject - function to call if the service method throws.
     * @returns {*} - a unique response ID for this set of callbacks. See {@link _deliverResponse}.
     * @protected
     */
    _storeCallbacks (resolve, reject) {
        const responseId = this.nextResponseId++;
        this.callbacks[responseId] = [resolve, reject];
        return responseId;
    }

    /**
     * Deliver call response from a worker. This should only be called as the result of a message from a worker.
     * @param {int} responseId - the response ID of the callback set to call.
     * @param {DispatchResponseMessage} message - the message containing the response value(s).
     * @protected
     */
    _deliverResponse (responseId, message) {
        try {
            const [resolve, reject] = this.callbacks[responseId];
            delete this.callbacks[responseId];
            if (message.error) {
                reject(message.error);
            } else {
                resolve(message.result);
            }
        } catch (e) {
            log.error(`Dispatch callback failed: ${JSON.stringify(e)}`);
        }
    }

    /**
     * Handle a message event received from a connected worker.
     * @param {Worker} worker - the worker which sent the message, or the global object if running in a worker.
     * @param {MessageEvent} event - the message event to be handled.
     * @protected
     */
    _onMessage (worker, event) {
        /** @type {DispatchMessage} */
        const message = event.data;
        message.args = message.args || [];
        let promise;
        if (message.service) {
            if (message.service === 'dispatch') {
                promise = this._onDispatchMessage(worker, message);
            } else {
                promise = this.call(message.service, message.method, ...message.args);
            }
        } else if (typeof message.responseId === 'undefined') {
            log.error(`Dispatch caught malformed message from a worker: ${JSON.stringify(event)}`);
        } else {
            this._deliverResponse(message.responseId, message);
        }
        if (promise) {
            if (typeof message.responseId === 'undefined') {
                log.error(`Dispatch message missing required response ID: ${JSON.stringify(event)}`);
            } else {
                promise.then(
                    result => worker.postMessage({responseId: message.responseId, result}),
                    error => worker.postMessage({responseId: message.responseId, error})
                );
            }
        }
    }

    /**
     * Fetch the service provider object for a particular service name.
     * @abstract
     * @param {string} service - the name of the service to look up
     * @returns {{provider:(object|Worker), isRemote:boolean}} - the means to contact the service, if found
     * @protected
     */
    _getServiceProvider (service) {
        throw new Error(`Could not get provider for ${service}: _getServiceProvider not implemented`);
    }

    /**
     * Handle a call message sent to the dispatch service itself
     * @abstract
     * @param {Worker} worker - the worker which sent the message.
     * @param {DispatchCallMessage} message - the message to be handled.
     * @returns {Promise|undefined} - a promise for the results of this operation, if appropriate
     * @private
     */
    _onDispatchMessage (worker, message) {
        throw new Error(`Unimplemented dispatch message handler cannot handle ${message.method} method`);
    }
}

module.exports = SharedDispatch;
