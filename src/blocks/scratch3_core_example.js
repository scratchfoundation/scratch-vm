const BlockType = require('../extension-support/block-type');
const ArgumentType = require('../extension-support/argument-type');
const ContextMenuContext = require('../extension-support/context-menu-context');
const log = require('../util/log');

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
            menus: {
                myMenu: ['a', 'b', 'c']
            },
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
                },
                {
                    opcode: 'exampleDynamicOpcode',
                    blockType: BlockType.COMMAND,
                    text: 'example dynamic block',
                    isDynamic: true,
                    customContextMenu: [
                        {
                            text: 'Custom Context Menu Option',
                            callback: 'contextMenuOption'
                        },
                        {
                            text: 'Custom Context Menu Option - Toolbox Only',
                            callback: 'contextMenuOption',
                            context: ContextMenuContext.TOOLBOX_ONLY
                        },
                        {
                            text: 'Custom Context Menu Option - Workspace Only',
                            callback: 'contextMenuOption',
                            context: ContextMenuContext.WORKSPACE_ONLY
                        }
                    ]
                },
                {
                    opcode: 'blockWithMenu',
                    blockType: BlockType.COMMAND,
                    text: 'a block with a menu [MY_MENU]',
                    isDynamic: true,
                    arguments: {
                        MY_MENU: {
                            type: ArgumentType.STRING,
                            menu: 'myMenu',
                            defaultValue: 'a'
                        }
                    },
                    customContextMenu: [
                        {
                            text: 'Change menu value',
                            callback: 'changeMenu'
                        }
                    ]

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

    /**
     * An example of a dynamic block.
     */
    exampleDynamicOpcode () {
        log.info('Example dynamic block');
    }

    /**
     * An example of a context menu callback.
     */
    contextMenuOption ({blockInfo}) {
        log.info('Custom context menu example. ', blockInfo);
    }

    /**
     * An example of changing a dynamic block
     * (specifically changing the selected value of a menu in a dynamic block).
     */
    changeMenu ({blockInfo}) {
        blockInfo.arguments.MY_MENU.selectedValue = 'b';
        this.runtime.updateBlockInfo(blockInfo.id, blockInfo);
    }
}

module.exports = Scratch3CoreExample;
