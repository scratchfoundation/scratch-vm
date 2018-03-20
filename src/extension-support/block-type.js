/**
 * Types of block
 * @enum {string}
 */
const BlockType = {
    /**
     * Boolean reporter with hexagonal shape
     */
    BOOLEAN: 'Boolean',

    /**
     * Command block
     */
    COMMAND: 'command',

    /**
     * Specialized command block which may or may not run a child branch
     */
    CONDITIONAL: 'conditional',

    /**
     * Hat block which conditionally starts a block stack
     */
    HAT: 'hat',

    /**
     * General reporter with numeric or string value
     */
    REPORTER: 'reporter'
};

module.exports = BlockType;
