const log = require('../util/log');

/**
 * This class serves as the central broker for message dispatch. It expects to operate on the main thread / Window and
 * it must be informed of any Worker threads which will participate in the messaging system. From any context in the
 * messaging system, the dispatcher's "call" method can call any method on any "service" provided in any participating
 * context. The dispatch system will forward function arguments and return values across worker boundaries as needed.
 * @see {WorkerDispatch}
 */
class CentralDispatch {
    constructor () {
        /**
         * List of callback registrations for promises waiting for a response from a call to a service on another
         * worker. A callback registration is an array of [resolve,reject] Promise functions.
         * Calls to services on this worker don't enter this list.
         * @type {Array.<[Function,Function]>}
         */
        this.callbacks = [];

        /**
         * The next callback ID to be used.
         * @type {int}
         */
        this.nextCallback = 0;

        /**
         * Map of channel name to worker or local service provider.
         * If the entry is a Worker, the service is provided by an object on that worker.
         * Otherwise, the service is provided locally and methods on the service will be called directly.
         * @see {setService}
         * @type {object.<Worker|object>}
         */
        this.services = {};

        /**
         * List of workers attached to this dispatcher.
         * @type {Array}
         */
        this.workers = [];
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
            if (this.services.hasOwnProperty(service)) {
                const provider = this.services[service];
                if (provider instanceof Worker) {
                    const callbackId = this.nextCallback++;
                    this.callbacks[callbackId] = [resolve, reject];
                    if (transfer) {
                        provider.postMessage([service, method, callbackId, args], transfer);
                    } else {
                        provider.postMessage([service, method, callbackId, args]);
                    }
                } else {
                    const result = provider[method].apply(provider, args);
                    resolve(result);
                }
            } else {
                reject(new Error(`Service not found: ${service}`));
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
    }

    /**
     * Add a worker to the message dispatch system. The worker must implement a compatible message dispatch framework.
     * The dispatcher will immediately attempt to "handshake" with the worker.
     * @param {Worker} worker - the worker to add into the dispatch system.
     */
    addWorker (worker) {
        if (this.workers.indexOf(worker) === -1) {
            this.workers.push(worker);
            worker.onmessage = this._onMessage.bind(this);
            worker.postMessage('dispatch-handshake');
        } else {
            log.warn('Ignoring attempt to add duplicate worker');
        }
    }

    /**
     * Handle a message event received from a connected worker.
     * @param {MessageEvent} event - the message event to be handled.
     * @private
     */
    _onMessage (event) {
        const worker = event.target;
        const [service, method, callbackId, ...args] = /** @type {[string, string, *]} */ event.data;
        if (service === 'dispatch') {
            switch (method) {
            case '_callback':
                this._callback(callbackId, ...args);
                break;
            case 'setService':
                this.setService(args[0], worker);
                break;
            }
        } else {
            this.call(service, method, ...args).then(
                result => {
                    worker.postMessage(['dispatch', '_callback', callbackId, result]);
                },
                error => {
                    worker.postMessage(['dispatch', '_callback', callbackId, null, error]);
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

const dispatch = new CentralDispatch();
module.exports = dispatch;
self.Scratch = self.Scratch || {};
self.Scratch.dispatch = dispatch;
