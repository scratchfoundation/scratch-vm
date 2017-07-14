const centralDispatch = require('../dispatch/central-dispatch');

class ExtensionManager {
    constructor () {
        /**
         * The list of current active extension workers.
         * @type {Array.<ExtensionWorker>}
         */
        this.workers = [];

        /**
         * The ID number to provide to the next extension worker.
         * @type {int}
         */
        this.nextExtensionWorker = 0;

        /**
         * The list of extension URLs which have been requested but not yet loaded in a worker.
         * @type {Array}
         */
        this.pendingExtensionURLs = [];

        centralDispatch.setService('extensions', this);
    }

    foo () {
        this.loadExtensionURL('extensions/example-extension.js');
    }

    loadExtensionURL (extensionURL) {
        // If we `require` this at the global level it breaks non-webpack targets, including tests
        const ExtensionWorker = require('worker-loader!./extension-worker');

        this.pendingExtensionURLs.push(extensionURL);
        centralDispatch.addWorker(new ExtensionWorker());
    }

    allocateWorker () {
        const id = this.nextExtensionWorker++;
        const extFile = this.pendingExtensionURLs.shift();
        return [id, extFile];
    }
}

module.exports = ExtensionManager;
