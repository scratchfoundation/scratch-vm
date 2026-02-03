const { name } = require('file-loader');
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const TargetType = require('../../extension-support/target-type');

// ...or VM dependencies:
const formatMessage = require('format-message');


class RobotMovementBlocks {

     /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return 'Move';
    }

    constructor (runtime) {
         /**
         * Store this for later communication with the Scratch VM runtime.
         * If this extension is running in a sandbox then `runtime` is an async proxy object.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }
    /**
     * @return {object} This extension's metadata.
     */

    getInfo () {
        return {
            id: RobotMovementBlocks.EXTENSION_ID,
            name: 'Move',
            blocks: [
                {
                    opcode: 'forward',
                    blockType:  'BlockType.COMMAND',
                    text: 'letter [LETTER_NUM] of [TEXT]',
                    arguments: {
                        STEPS: {
                        type: ' ArgumentType.NUMBER',
                        defaultValue: 10
                    }
                    }
                }
            ]
        };
    }
    // ...
    forward (args) {
        console.log('VM move_forward - FRST_CUSTOM_BLOCK_IN_THE_FORK:');
        return
    };

}

