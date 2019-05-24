const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const log = require('../../util/log');
const formatMessage = require('format-message');
const Cast = require('../../util/cast');
const Timer = require('../../util/timer');


/**
 * Enum for light specification.
 * @readonly
 * @enum {string}
 */
const LightLabel = {
    ONE: 'light 1',
    TWO: 'light 2', 
    THREE: 'light 3',
    ALL: 'all lights'
};

/**
 * Class for the translate block in Scratch 3.0.
 * @constructor
 */
class Scratch3LightplayBlocks {
    
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
            id: 'lightplay',
            name: 'Lightplay',
            menuIconURI: '', // TODO: Add the final icons.
            blockIconURI: '',
            blocks: [
                {
                    opcode: 'lightOn',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'lightplay.lightOn',
                        default: 'turn [LIGHT_ID] on',
                        description: 'turn a light on'
                    }),
                    arguments: {
                        LIGHT_ID: {
                            type: ArgumentType.STRING,
                            menu: 'LIGHT_ID',
                            defaultValue: LightLabel.ALL
                        }
                    }
                },  
            ],
            menus: {
              LIGHT_ID: [
                    {
                        text: formatMessage({
                            id: 'lightplay.lightId.one',
                            default: 'light 1',
                            description: 'label for light 1 element in light menu for Lightplay extension'
                        }),
                        value: LightLabel.ONE
                    },
                    {
                        text: formatMessage({
                            id: 'lightplay.lightId.two',
                            default: 'light 2',
                            description: 'label for light 2 element in light menu for Lightplay extension'
                        }),
                        value: LightLabel.TWO
                    },
                    {
                        text: formatMessage({
                            id: 'lightplay.lightId.three',
                            default: 'light 3',
                            description: 'label for light 3 element in light menu for Lightplay extension'
                        }),
                        value: LightLabel.THREE
                    },
                    {
                        text: formatMessage({
                            id: 'lightplay.lightId.all',
                            default: 'all lights',
                            description: 'label for all lights element in light menu for Lightplay extension'
                        }),
                        value: LightLabel.ALL
                    },
                ],

            }
        };
    }

    lightOn (args) {
      // TODO
    }

}
module.exports = Scratch3LightplayBlocks;
