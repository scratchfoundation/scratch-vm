const centralDispatch = require('../dispatch/central-dispatch');
const log = require('../util/log');

const ArgumentType = require('./argument-type');
const BlockType = require('./block-type');
const ScratchBlocks = require('scratch-blocks');

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
 * @property {string|undefined} func - the method implementing this block on the extension service (default: opcode)
 * @property {Array.<string>|undefined} filter - the list of targets for which this block should appear (default: all)
 */

/**
 * @typedef {object} CategoryInfo - Information about a block category
 * @property {string} id - the unique ID of this category
 * @property {string} color1 - the primary color for this category, in '#rrggbb' format
 * @property {string} color2 - the secondary color for this category, in '#rrggbb' format
 * @property {string} color3 - the tertiary color for this category, in '#rrggbb' format
 */

/**
 * Information used for converting Scratch argument types into scratch-blocks data.
 * @type {object.<ArgumentType, {shadowType: string, fieldType: string}>}}
 */
const ArgumentTypeMap = (() => {
    const map = {};
    map[ArgumentType.NUMBER] = {
        shadowType: 'math_number',
        fieldType: 'NUM'
    };
    map[ArgumentType.STRING] = {
        shadowType: 'text',
        fieldType: 'TEXT'
    };
    map[ArgumentType.BOOLEAN] = {
        shadowType: ''
    };
    return map;
})();

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

    registerExtensionService (serviceName) {
        centralDispatch.call(serviceName, 'getInfo').then(info => {
            this._registerExtensionInfo(serviceName, info);
        });
    }

    _registerExtensionInfo (serviceName, extensionInfo) {
        const categoryInfo = {
            id: extensionInfo.id,
            name: extensionInfo.name,
            color1: '#FF6680',
            color2: '#FF4D6A',
            color3: '#FF3355'
        };
        extensionInfo = this._sanitizeExtensionInfo(extensionInfo);
        for (let blockInfo of extensionInfo.blocks) {
            if (!(blockInfo.opcode && blockInfo.text)) {
                log.error(`Ignoring malformed extension block: ${JSON.stringify(blockInfo)}`);
                continue;
            }
            blockInfo = this._sanitizeBlockInfo(blockInfo);
            const convertedBlock = this._convertForScratchBlocks(blockInfo, serviceName, categoryInfo);
            console.dir(convertedBlock);
        }
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
     * @param {ExtensionInfo} extensionInfo - the extension info to be sanitized
     * @returns {ExtensionInfo} - a new extension info object with cleaned-up values
     * @private
     */
    _sanitizeExtensionInfo (extensionInfo) {
        extensionInfo = Object.assign({}, extensionInfo);
        extensionInfo.id = this._sanitizeID(extensionInfo.id);
        extensionInfo.name = extensionInfo.name || extensionInfo.id;
        extensionInfo.blocks = extensionInfo.blocks || [];
        extensionInfo.targetTypes = extensionInfo.targetTypes || [];
        return extensionInfo;
    }

    /**
     * Apply defaults for optional block fields.
     * @param {BlockInfo} blockInfo - the block info from the extension
     * @returns {BlockInfo} - a new block info object which has values for all relevant optional fields.
     * @private
     */
    _sanitizeBlockInfo (blockInfo) {
        blockInfo = Object.assign({}, {
            blockType: BlockType.COMMAND,
            terminal: false,
            blockAllThreads: false,
            arguments: {}
        }, blockInfo);
        blockInfo.opcode = this._sanitizeID(blockInfo.opcode);
        blockInfo.func = blockInfo.func ? this._sanitizeID(blockInfo.func) : blockInfo.opcode;
        return blockInfo;
    }

    /**
     * Convert BlockInfo into scratch-blocks JSON & XML, and generate a proxy function.
     * @param {BlockInfo} blockInfo - the block to convert
     * @param {string} serviceName - the name of the service hosting this extension
     * @param {CategoryInfo} categoryInfo - the category for this block
     * @returns {{json: object, xml: string, blockFunction: Function}} - the converted block information
     * @private
     */
    _convertForScratchBlocks (blockInfo, serviceName, categoryInfo) {
        const extendedOpcode = `${categoryInfo.id}.${blockInfo.opcode}`;
        const blockJSON = {
            id: extendedOpcode,
            inputsInline: true,
            previousStatement: null, // null = available connection; undefined = hat block
            nextStatement: null, // null = available connection; undefined = terminal
            category: categoryInfo.name,
            colour: categoryInfo.color1,
            colourSecondary: categoryInfo.color2,
            colorTertiary: categoryInfo.color3,
            args0: []
        };

        const inputList = [];

        // TODO: store this somewhere so that we can map args appropriately after translation.
        // This maps an arg name to its relative position in the original (usually English) block text.
        // When displaying a block in another language we'll need to run a `replace` action similar to the one below,
        // but each `[ARG]` will need to be replaced with the number in this map instead of `args0.length`.
        const argsMap = {};

        blockJSON.message0 = blockInfo.text.replace(/\[(.+?)]/g, (match, placeholder) => {

            // Sanitize the placeholder to ensure valid XML
            placeholder = placeholder.replace(/[<"&]/, '_');

            blockJSON.args0.push({
                type: 'input_value',
                name: placeholder
            });

            // scratch-blocks uses 1-based argument indexing
            const argNum = blockJSON.args0.length;
            argsMap[placeholder] = argNum;

            const argInfo = blockInfo.arguments[placeholder] || {};
            const argTypeInfo = ArgumentTypeMap[argInfo.type] || {};
            const defaultValue = (typeof argInfo.defaultValue === 'undefined' ? '' : argInfo.defaultValue.toString());
            inputList.push(
                `<value name="${placeholder}">` +
                `<shadow type="${argTypeInfo.shadowType}">` +
                `<field name="${argTypeInfo.fieldType}">${defaultValue}</field>` +
                `</shadow>` +
                `</value>`
            );

            return `%${argNum}`;
        });

        switch (blockInfo.blockType) {
        case BlockType.COMMAND:
            blockJSON.outputShape = ScratchBlocks.OUTPUT_SHAPE_SQUARE;
            break;
        case BlockType.REPORTER:
            blockJSON.output = 'String'; // TODO: distinguish number & string here?
            blockJSON.outputShape = ScratchBlocks.OUTPUT_SHAPE_ROUND;
            break;
        case BlockType.BOOLEAN:
            blockJSON.output = 'Boolean';
            blockJSON.outputShape = ScratchBlocks.OUTPUT_SHAPE_HEXAGONAL;
            break;
        case BlockType.HAT:
            blockJSON.outputShape = ScratchBlocks.OUTPUT_SHAPE_SQUARE;
            delete blockJSON.previousStatement;
            break;
        case BlockType.CONDITIONAL:
            // Statement inputs get names like 'SUBSTACK', 'SUBSTACK2', 'SUBSTACK3', ...
            for (let branchNum = 1; branchNum <= blockInfo.branchCount; ++branchNum) {
                blockJSON[`args${branchNum}`] = {
                    type: 'input_statement',
                    name: `SUBSTACK${branchNum > 1 ? branchNum : ''}`
                };
            }
            blockJSON.outputShape = ScratchBlocks.OUTPUT_SHAPE_SQUARE;
            break;
        }

        if (blockInfo.isTerminal) {
            delete blockJSON.nextStatement;
        }

        const blockXML = `<block type="${extendedOpcode}">${inputList.join('')}</block>`;

        return {
            json: blockJSON,
            xml: blockXML,
            blockFunction: this._extensionProxy.bind(this, serviceName, blockInfo.opcode)
        };
    }

    /**
     * Run an opcode by proxying the call to an extension service.
     * @param {string} serviceName - the name of the service hosting the extension
     * @param {string} opcode - the opcode to run, also the name of the method on the extension service
     * @param {object} blockArgs - the arguments provided to the block
     * @returns {Promise} - a promise which will resolve after the block function executes. If the block function
     *          returns a value, this promise will resolve to that value.
     * @private
     */
    _extensionProxy (serviceName, opcode, blockArgs) {
        return centralDispatch.call(serviceName, opcode, blockArgs);
    }
}

module.exports = ExtensionManager;
