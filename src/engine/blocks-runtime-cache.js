/**
 * @fileoverview
 * The BlocksRuntimeCache caches data about the top block of scripts so that
 * Runtime can iterate a targeted opcode and iterate the returned set faster.
 * Many top blocks need to match fields as well as opcode, since that matching
 * compares strings in uppercase we can go ahead and uppercase the cached value
 * so we don't need to in the future.
 */

/**
 * A set of cached data about the top block of a script.
 * @param {Blocks} container - Container holding the block and related data
 * @param {string} blockId - Id for whose block data is cached in this instance
 */
class RuntimeScriptCache {
    constructor (container, blockId) {
        /**
         * Container with block data for blockId.
         * @type {Blocks}
         */
        this.container = container;

        /**
         * ID for block this instance caches.
         * @type {string}
         */
        this.blockId = blockId;

        const block = container.getBlock(blockId);
        const fields = container.getFields(block);

        /**
         * Formatted fields or fields of input blocks ready for comparison in
         * runtime.
         *
         * This is a clone of parts of the targeted blocks. Changes to these
         * clones are limited to copies under RuntimeScriptCache and will not
         * appear in the original blocks in their container. This copy is
         * modified changing the case of strings to uppercase. These uppercase
         * values will be compared later by the VM.
         * @type {object}
         */
        this.fieldsOfInputs = Object.assign({}, fields);
        if (Object.keys(fields).length === 0) {
            const inputs = container.getInputs(block);
            for (const input in inputs) {
                if (!Object.prototype.hasOwnProperty.call(inputs, input)) continue;
                const id = inputs[input].block;
                const inputBlock = container.getBlock(id);
                const inputFields = container.getFields(inputBlock);
                Object.assign(this.fieldsOfInputs, inputFields);
            }
        }
        for (const key in this.fieldsOfInputs) {
            const field = this.fieldsOfInputs[key] = Object.assign({}, this.fieldsOfInputs[key]);
            if (field.value.toUpperCase) {
                field.value = field.value.toUpperCase();
            }
        }
    }
}

/**
 * Get an array of scripts from a block container prefiltered to match opcode.
 * @param {Blocks} container - Container of blocks
 * @param {string} opcode - Opcode to filter top blocks by
 */
exports.getScripts = function () {
    throw new Error('blocks.js has not initialized BlocksRuntimeCache');
};

/**
 * Exposed RuntimeScriptCache class used by integration in blocks.js.
 * @private
 */
exports._RuntimeScriptCache = RuntimeScriptCache;

require('./blocks');
