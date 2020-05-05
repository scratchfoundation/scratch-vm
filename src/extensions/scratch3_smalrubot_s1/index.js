const BlockType = require('../../extension-support/block-type');
const log = require('../../util/log');

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/png;base64,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';

/**
 * Host for the Smalrubot S1-related blocks
 * @param {Runtime} runtime - the runtime instantiating this block package.
 * @constructor
 */
class Scratch3SmalrubotS1Blocks {
    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME () {
        return 'Smalrubot S1';
    }

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return 'smalrubotS1';
    }

    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: Scratch3SmalrubotS1Blocks.EXTENSION_ID,
            name: Scratch3SmalrubotS1Blocks.EXTENSION_NAME,
            blockIconURI: blockIconURI,
            showStatusButton: true,
            blocks: [
                {
                    opcode: 'hello',
                    text: 'Hello',
                    blockType: BlockType.COMMAND
                }
            ]
        };
    }

    hello () {
        log.log('Hello');
    }
}

module.exports = Scratch3SmalrubotS1Blocks;
