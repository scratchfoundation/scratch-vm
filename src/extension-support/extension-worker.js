/* eslint-env worker */

const dispatch = require('../dispatch/worker-dispatch');

class ExtensionWorker {
    constructor () {
        this.nextExtensionId = 0;

        dispatch.waitForConnection.then(() => {
            dispatch.call('extensions', 'allocateWorker').then(x => {
                const [id, extension] = x;
                this.workerId = id;

                // TODO: catch and report any exceptions here
                importScripts(extension);
            });
        });

        this.extensions = [];
    }

    register (extensionObject) {
        const extensionId = this.nextExtensionId++;
        this.extensions.push(extensionObject);
        dispatch.setService(`extension.${this.workerId}.${extensionId}`, extensionObject);
    }
}

const extensionWorker = new ExtensionWorker();

global.Scratch = global.Scratch || {};

/**
 * Expose only specific parts of the worker to extensions.
 */
global.Scratch.extensions = {
    register: extensionWorker.register.bind(extensionWorker)
};
