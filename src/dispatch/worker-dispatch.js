const SharedDispatch = require('./shared-dispatch');

const log = require('../util/log');

/**
 * This class provides a Worker with the means to participate in the message dispatch system managed by CentralDispatch.
 * From any context in the messaging system, the dispatcher's "call" method can call any method on any "service"
 * provided in any participating context. The dispatch system will forward function arguments and return values across
 * worker boundaries as needed.
 * @see {CentralDispatch}
 */
class WorkerDispatch extends SharedDispatch {
    constructor () {
        super();

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
         * Map of service name to local service provider.
         * If a service is not listed here, it is assumed to be provided by another context (another Worker or the main
         * thread).
         * @see {setService}
         * @type {object}
         */
        this.services = {};

        this._onMessage = this._onMessage.bind(this, self);
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
     * Set a local object as the global provider of the specified service.
     * WARNING: Any method on the provider can be called from any worker within the dispatch system.
     * @param {string} service - a globally unique string identifying this service. Examples: 'vm', 'gui', 'extension9'.
     * @param {object} provider - a local object which provides this service.
     * @returns {Promise} - a promise which will resolve once the service is registered.
     */
    setService (service, provider) {
        if (Object.prototype.hasOwnProperty.call(this.services, service)) {
            log.warn(`Worker dispatch replacing existing service provider for ${service}`);
        }
        this.services[service] = provider;
        return this.waitForConnection.then(() => this._remoteCall(self, 'dispatch', 'setService', service));
    }

    /**
     * Fetch the service provider object for a particular service name.
     * @override
     * @param {string} service - the name of the service to look up
     * @returns {{provider:(object|Worker), isRemote:boolean}} - the means to contact the service, if found
     * @protected
     */
    _getServiceProvider (service) {
        // if we don't have a local service by this name, contact central dispatch by calling `postMessage` on self
        const provider = this.services[service];
        return {
            provider: provider || self,
            isRemote: !provider
        };
    }

    /**
     * Handle a call message sent to the dispatch service itself
     * @override
     * @param {Worker} worker - the worker which sent the message.
     * @param {DispatchCallMessage} message - the message to be handled.
     * @returns {Promise|undefined} - a promise for the results of this operation, if appropriate
     * @protected
     */
    _onDispatchMessage (worker, message) {
        let promise;
        switch (message.method) {
        case 'handshake':
            promise = this._onConnect();
            break;
        case 'terminate':
            // Don't close until next tick, after sending confirmation back
            setTimeout(() => self.close(), 0);
            promise = Promise.resolve();
            break;
        default:
            log.error(`Worker dispatch received message for unknown method: ${message.method}`);
        }
        return promise;
    }
}

module.exports = new WorkerDispatch();
