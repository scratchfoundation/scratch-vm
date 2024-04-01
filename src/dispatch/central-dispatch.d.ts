declare const _exports: CentralDispatch;
export = _exports;
/**
 * This class serves as the central broker for message dispatch. It expects to operate on the main thread / Window and
 * it must be informed of any Worker threads which will participate in the messaging system. From any context in the
 * messaging system, the dispatcher's "call" method can call any method on any "service" provided in any participating
 * context. The dispatch system will forward function arguments and return values across worker boundaries as needed.
 * @see {WorkerDispatch}
 */
declare class CentralDispatch extends SharedDispatch {
    /**
     * Map of channel name to worker or local service provider.
     * If the entry is a Worker, the service is provided by an object on that worker.
     * Otherwise, the service is provided locally and methods on the service will be called directly.
     * @see {setService}
     * @type {object.<Worker|object>}
     */
    services: object<any>;
    /**
     * The constructor we will use to recognize workers.
     * @type {Function}
     */
    workerClass: Function;
    /**
     * List of workers attached to this dispatcher.
     * @type {Array}
     */
    workers: any[];
    /**
     * Synchronously call a particular method on a particular service provided locally.
     * Calling this function on a remote service will fail.
     * @param {string} service - the name of the service.
     * @param {string} method - the name of the method.
     * @param {*} [args] - the arguments to be copied to the method, if any.
     * @returns {*} - the return value of the service method.
     */
    callSync(service: string, method: string, ...args?: any): any;
    /**
     * Synchronously set a local object as the global provider of the specified service.
     * WARNING: Any method on the provider can be called from any worker within the dispatch system.
     * @param {string} service - a globally unique string identifying this service. Examples: 'vm', 'gui', 'extension9'.
     * @param {object} provider - a local object which provides this service.
     */
    setServiceSync(service: string, provider: object): void;
    /**
     * Set a local object as the global provider of the specified service.
     * WARNING: Any method on the provider can be called from any worker within the dispatch system.
     * @param {string} service - a globally unique string identifying this service. Examples: 'vm', 'gui', 'extension9'.
     * @param {object} provider - a local object which provides this service.
     * @returns {Promise} - a promise which will resolve once the service is registered.
     */
    setService(service: string, provider: object): Promise<any>;
    /**
     * Add a worker to the message dispatch system. The worker must implement a compatible message dispatch framework.
     * The dispatcher will immediately attempt to "handshake" with the worker.
     * @param {Worker} worker - the worker to add into the dispatch system.
     */
    addWorker(worker: Worker): void;
    /**
     * Handle a call message sent to the dispatch service itself
     * @override
     * @param {Worker} worker - the worker which sent the message.
     * @param {DispatchCallMessage} message - the message to be handled.
     * @returns {Promise|undefined} - a promise for the results of this operation, if appropriate
     * @protected
     */
    protected override _onDispatchMessage(worker: Worker, message: DispatchCallMessage): Promise<any> | undefined;
}
import SharedDispatch = require("./shared-dispatch");
