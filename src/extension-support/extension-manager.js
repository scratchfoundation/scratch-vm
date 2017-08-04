const dispatch = require('../dispatch/central-dispatch');
const log = require('../util/log');

const BlockType = require('./block-type');

/**
 * @typedef {object} ArgumentInfo - Information about an extension block argument
 * @property {ArgumentType} type - the type of value this argument can take
 * @property {*|undefined} default - the default value of this argument (default: blank)
 */

/**
 * @typedef {object} BlockInfo - Information about an extension block
 * @property {string} opcode - the block opcode
 * @property {string|object} text - the human-readable text on this block
 * @property {BlockType|undefined} blockType - the type of block (default: BlockType.COMMAND)
 * @property {int|undefined} branchCount - the number of branches this block controls, if conditional (default: 0)
 * @property {Boolean|undefined} isTerminal - true if this block ends a stack (default: false)
 * @property {Boolean|undefined} blockAllThreads - true if all threads must wait for this block to run (default: false)
 * @property {object.<string,ArgumentInfo>|undefined} arguments - information about this block's arguments, if any
 * @property {string|Function|undefined} func - the method for this block on the extension service (default: opcode)
 * @property {Array.<string>|undefined} filter - the list of targets for which this block should appear (default: all)
 */

/**
 * @typedef {object} CategoryInfo - Information about a block category
 * @property {string} id - the unique ID of this category
 * @property {string} color1 - the primary color for this category, in '#rrggbb' format
 * @property {string} color2 - the secondary color for this category, in '#rrggbb' format
 * @property {string} color3 - the tertiary color for this category, in '#rrggbb' format
 */

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

        dispatch.setService('extensions', this).catch(e => {
            log.error(`ExtensionManager was unable to register extension service: ${JSON.stringify(e)}`);
        });
    }

    foo () {
        this.loadExtensionURL('extensions/example-extension.js');
    }

    loadExtensionURL (extensionURL) {
        // If we `require` this at the global level it breaks non-webpack targets, including tests
        const ExtensionWorker = require('worker-loader!./extension-worker');

        this.pendingExtensionURLs.push(extensionURL);
        dispatch.addWorker(new ExtensionWorker());
    }

    allocateWorker () {
        const id = this.nextExtensionWorker++;
        const extFile = this.pendingExtensionURLs.shift();
        return [id, extFile];
    }

    registerExtensionService (serviceName) {
        dispatch.call(serviceName, 'getInfo').then(info => {
            this._registerExtensionInfo(serviceName, info);
        });
    }

    _registerExtensionInfo (serviceName, extensionInfo) {
        extensionInfo = this._prepareExtensionInfo(serviceName, extensionInfo);
        dispatch.call('runtime', '_registerExtensionPrimitives', extensionInfo).catch(e => {
            log.error(`Failed to register primitives for extension on service ${serviceName}: ${JSON.stringify(e)}`);
        });
    }

    /**
     * Modify the provided text as necessary to ensure that it may be used as an attribute value in valid XML.
     * @param {string} text - the text to be sanitized
     * @returns {string} - the sanitized text
     * @private
     */
    _sanitizeID (text) {
        return text.toString().replace(/[<"&]/, '_');
    }

    /**
     * Apply minor cleanup and defaults for optional extension fields.
     * TODO: make the ID unique in cases where two copies of the same extension are loaded.
     * @param {string} serviceName - the name of the service hosting this extension block
     * @param {ExtensionInfo} extensionInfo - the extension info to be sanitized
     * @returns {ExtensionInfo} - a new extension info object with cleaned-up values
     * @private
     */
    _prepareExtensionInfo (serviceName, extensionInfo) {
        extensionInfo = Object.assign({}, extensionInfo);
        extensionInfo.id = this._sanitizeID(extensionInfo.id);
        extensionInfo.name = extensionInfo.name || extensionInfo.id;
        extensionInfo.blocks = extensionInfo.blocks || [];
        extensionInfo.targetTypes = extensionInfo.targetTypes || [];
        extensionInfo.blocks = extensionInfo.blocks.reduce((result, blockInfo) => {
            try {
                result.push(this._prepareBlockInfo(serviceName, blockInfo));
            } catch (e) {
                // TODO: more meaningful error reporting
                log.error(`Skipping malformed block: ${e}`);
            }
            return result;
        }, []);
        return extensionInfo;
    }

    /**
     * Apply defaults for optional block fields.
     * @param {string} serviceName - the name of the service hosting this extension block
     * @param {BlockInfo} blockInfo - the block info from the extension
     * @returns {BlockInfo} - a new block info object which has values for all relevant optional fields.
     * @private
     */
    _prepareBlockInfo (serviceName, blockInfo) {
        blockInfo = Object.assign({}, {
            blockType: BlockType.COMMAND,
            terminal: false,
            blockAllThreads: false,
            arguments: {}
        }, blockInfo);
        blockInfo.opcode = this._sanitizeID(blockInfo.opcode);
        blockInfo.func = blockInfo.func ? this._sanitizeID(blockInfo.func) : blockInfo.opcode;
        blockInfo.func = dispatch.call.bind(dispatch, serviceName, blockInfo.func);
        return blockInfo;
    }
}

module.exports = ExtensionManager;
