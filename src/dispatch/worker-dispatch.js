const log = require('../util/log');

/**
 * This class provides a Worker with the means to participate in the message dispatch system managed by CentralDispatch.
 * From any context in the messaging system, the dispatcher's "call" method can call any method on any "service"
 * provided in any participating context. The dispatch system will forward function arguments and return values across
 * worker boundaries as needed.
 * @see {CentralDispatch}
 */
class WorkerDispatch {
    constructor () {
        /**
         * List of callback registrations for promises waiting for a response from a call to a service on another
         * worker. A callback registration is an array of [resolve,reject] Promise functions.
         * Calls to local services don't enter this list.
         * @type {Array.<[Function,Function]>}
         */
        this.callbacks = [];

        /**
         * This promise will be resolved when we have successfully connected to central dispatch.
         * @type {Promise}
         * @see {waitForConnection}
         * @private
         */
        this._connectionPromise = new Promise(resolve => {
            this._onConnect = resolve;
        });

        /**
         * The next callback ID to be used.
         * @type {int}
         */
        this.nextCallback = 0;

        /**
         * Map of service name to local service provider.
         * If a service is not listed here, it is assumed to be provided by another context (another Worker or the main
         * thread).
         * @see {setService}
         * @type {object}
         */
        this.services = {};

        this._onMessage = this._onMessage.bind(this);
        if (typeof self !== 'undefined') {
            self.onmessage = this._onMessage;
        }
    }

    /**
     * @returns {Promise} a promise which will resolve upon connection to central dispatch. If you need to make a call
     * immediately on "startup" you can attach a 'then' to this promise.
     * @example
     *      dispatch.waitForConnection.then(() => {
     *          dispatch.call('myService', 'hello');
     *      })
     */
    get waitForConnection () {
        return this._connectionPromise;
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
        return new Promise((resolve, reject) => {
            try {
                if (this.services.hasOwnProperty(service)) {
                    const provider = this.services[service];
                    const result = provider[method].apply(provider, args);
                    resolve(result);
                } else {
                    const callbackId = this.nextCallback++;
                    this.callbacks[callbackId] = [resolve, reject];
                    if (transfer) {
                        self.postMessage([service, method, callbackId, ...args], transfer);
                    } else {
                        self.postMessage([service, method, callbackId, ...args]);
                    }
                }
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Set a local object as the global provider of the specified service.
     * @param {string} service - a globally unique string identifying this service. Examples: 'vm', 'gui', 'extension9'.
     * @param {object} provider - a local object which provides this service.
     * WARNING: Any method on the provider can be called from any worker within the dispatch system.
     */
    setService (service, provider) {
        if (this.services.hasOwnProperty(service)) {
            log.warn(`Replacing existing service provider for ${service}`);
        }
        this.services[service] = provider;
        this.waitForConnection.then(() => {
            this.call('dispatch', 'setService', service);
        });
    }

    /**
     * Message handler active after the dispatcher handshake. This only handles method calls.
     * @param {MessageEvent} event - the message event to be handled.
     * @private
     */
    _onMessage (event) {
        const [service, method, callbackId, ...args] = /** @type {[string, string, *]} */ event.data;
        if (service === 'dispatch') {
            switch (method) {
            case '_handshake':
                this._onConnect();
                break;
            case '_callback':
                this._callback(callbackId, ...args);
                break;
            case '_terminate':
                self.close();
                break;
            }
        } else {
            this.call(service, method, ...args).then(
                result => {
                    self.postMessage(['dispatch', '_callback', callbackId, result]);
                },
                error => {
                    self.postMessage(['dispatch', '_callback', callbackId, null, error]);
                });
        }
    }

    /**
     * Handle a callback from a worker. This should only be called as the result of a message from a worker.
     * @param {int} callbackId - the ID of the callback to call.
     * @param {*} result - if `error` is not truthy, resolve the callback promise with this value.
     * @param {*} [error] - if this is truthy, reject the callback promise with this value.
     * @private
     */
    _callback (callbackId, result, error) {
        const [resolve, reject] = this.callbacks[callbackId];
        if (error) {
            reject(error);
        } else {
            resolve(result);
        }
    }
}

module.exports = new WorkerDispatch();
