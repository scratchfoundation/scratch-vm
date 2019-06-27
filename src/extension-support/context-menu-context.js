/**
 * Block argument types
 * @enum {string}
 */
const ContextMenuContext = {
    /**
     * Indicates that the context menu item should appear regardless of whether
     * the block is in the toolbox or on the main workspace.
     */
    ALL: 'all',

    /**
     * Indicates that the context menu item should only appear on a block
     * if it is in the toolbox.
     */
    TOOLBOX_ONLY: 'toolbox',

    /**
     * Indicates that the context menu item should only appear on a block
     * if it is on the main workspace.
     */
    WORKSPACE_ONLY: 'workspace'
};

module.exports = ContextMenuContext;
