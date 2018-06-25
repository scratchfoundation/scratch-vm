/**
 * @typedef {object} ExtensionMetadata
 * All the metadata needed to register an extension.
 * @property {string} id - a unique alphanumeric identifier for this extension. No special characters allowed.
 * @property {string} [name] - the human-readable name of this extension.
 * @property {string} [blockIconURI] - URI for an image to be placed on each block in this extension. Data URI ok.
 * @property {string} [menuIconURI] - URI for an image to be placed on this extension's category menu item. Data URI ok.
 * @property {string} [docsURI] - link to documentation content for this extension.
 * @property {Array.<ExtensionBlockMetadata|string>} blocks - the blocks provided by this extension, plus separators.
 * @property {Object.<ExtensionMenuMetadata>} [menus] - map of menu name to metadata for each of this extension's menus.
 */

/**
 * @typedef {object} ExtensionBlockMetadata
 * All the metadata needed to register an extension block.
 * @property {string} opcode - a unique alphanumeric identifier for this block. No special characters allowed.
 * @property {string} [func] - the name of the function implementing this block. Can be shared by other blocks/opcodes.
 * @property {BlockType} blockType - the type of block (command, reporter, etc.) being described.
 * @property {string} text - the text on the block, with [PLACEHOLDERS] for arguments.
 * @property {Boolean} [hideFromPalette] - true if this block should not appear in the block palette.
 * @property {Boolean} [isTerminal] - true if the block ends a stack - no blocks can be connected after it.
 * @property {ReporterScope} [reporterScope] - if this block is a reporter, this is the scope/context for its value.
 * @property {Boolean} [isEdgeActivated] - sets whether a hat block is edge-activated.
 * @property {Boolean} [shouldRestartExistingThreads] - sets whether a hat/event block should restart existing threads.
 * @property {int} [branchCount] - for flow control blocks, the number of branches/substacks for this block.
 * @property {Object.<ExtensionArgumentMetadata>} [arguments] - map of argument placeholder to metadata about each arg.
 */

/**
 * @typedef {object} ExtensionArgumentMetadata
 * All the metadata needed to register an argument for an extension block.
 * @property {ArgumentType} type - the type of the argument (number, string, etc.)
 * @property {*} [defaultValue] - the default value of this argument.
 * @property {string} [menu] - the name of the menu to use for this argument, if any.
 */

/**
 * @typedef {ExtensionDynamicMenu|ExtensionMenuItems} ExtensionMenuMetadata
 * All the metadata needed to register an extension drop-down menu.
 */

/**
 * @typedef {string} ExtensionDynamicMenu
 * The string name of a function which returns menu items.
 * @see {ExtensionMenuItems} - the type of data expected to be returned by the specified function.
 */

/**
 * @typedef {Array.<ExtensionMenuItemSimple|ExtensionMenuItemComplex>} ExtensionMenuItems
 * Items in an extension menu.
 */

/**
 * @typedef {string} ExtensionMenuItemSimple
 * A menu item for which the label and value are identical strings.
 */

/**
 * @typedef {object} ExtensionMenuItemComplex
 * A menu item for which the label and value can differ.
 * @property {*} value - the value of the block argument when this menu item is selected.
 * @property {string} text - the human-readable label of this menu item in the menu.
 */
