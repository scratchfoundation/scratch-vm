/**
 * @fileoverview
 * Access point for private method shared between blocks.js and execute.js for
 * caching execute information.
 */

/**
 * A private method shared with execute to build an object containing the block
 * information execute needs and that is reset when other cached Blocks info is
 * reset.
 * @param {Blocks} blocks Blocks containing the expected blockId
 * @param {string} blockId blockId for the desired execute cache
 */
function getCached() {
    throw new Error('blocks.js has not initialized BlocksExecuteCache');
}

export default {getCached};

// Call after the default throwing getCached is assigned for Blocks to replace.
import './blocks';
