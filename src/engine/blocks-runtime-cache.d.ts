export function getScripts(): never;
export { RuntimeScriptCache as _RuntimeScriptCache };
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
declare class RuntimeScriptCache {
    constructor(container: any, blockId: any);
    /**
     * Container with block data for blockId.
     * @type {import("./blocks")}
     */
    container: import("./blocks");
    /**
     * ID for block this instance caches.
     * @type {string}
     */
    blockId: string;
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
    fieldsOfInputs: object;
}
