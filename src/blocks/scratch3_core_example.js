const BlockType = require('../extension-support/block-type');

/**
 * An example core block implemented using the extension spec.
 * This is not loaded as part of the core blocks in the VM but it is provided
 * and used as part of tests.
 */
class Scratch3CoreExample {
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
            id: 'coreExample',
            name: 'CoreEx', // This string does not need to be translated as this extension is only used as an example.
            blocks: [
                {
                    func: 'MAKE_A_VARIABLE',
                    blockType: BlockType.BUTTON,
                    text: 'make a variable (CoreEx)'
                },
                {
                    opcode: 'exampleOpcode',
                    blockType: BlockType.REPORTER,
                    text: 'example block'
                }
            ]
        };
    }

    /**
     * Example opcode just returns the name of the stage target.
     * @returns {string} The name of the first target in the project.
     */
    exampleOpcode () {
        const stage = this.runtime.getTargetForStage();
        return stage ? stage.getName() : 'no stage yet';
    }

}

module.exports = Scratch3CoreExample;
