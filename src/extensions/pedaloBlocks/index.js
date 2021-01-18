// Core, Team, and Official extensions can `require` VM code:
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const TargetType = require('../../extension-support/target-type');

// ...or VM dependencies:
const formatMessage = require('format-message');

// Core, Team, and Official extension classes should be registered statically with the Extension Manager.
// See: scratch-vm/src/extension-support/extension-manager.js
class PedaloBlocks {
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
            id: 'pedaloBlocks',
            name: formatMessage({
                id: 'extensionName',
                default: 'Some Blocks',
                description: 'The name of the "PedaloBlocks" extension'
            }),
            blocks: [
                {
                    opcode: 'myReporter', // becomes 'PedaloBlocks.myReporter'
                    text: formatMessage({
                        id: 'PedaloBlocks.myReporter',
                        default: 'This will return a string',
                        description: 'The first block to be created'
                    }),
                    blockType: BlockType.REPORTER
                }
            ]
        };
    }

    myReporter (){
        return "I am reporter block";
    }

}

module.exports = PedaloBlocks;