export = Blocks;
/**
 * @fileoverview
 * Store and mutate the VM block representation,
 * and handle updates from Scratch Blocks events.
 */
/**
 * Create a block container.
 * @param {Runtime} runtime The runtime this block container operates within
 * @param {boolean} optNoGlow Optional flag to indicate that blocks in this container
 * should not request glows. This does not affect glows when clicking on a block to execute it.
 */
declare class Blocks {
    /**
     * Blockly inputs that represent statements/branch.
     * are prefixed with this string.
     * @const{string}
     */
    static get BRANCH_INPUT_PREFIX(): string;
    constructor(runtime: any, optNoGlow: any);
    runtime: any;
    /**
     * All blocks in the workspace.
     * Keys are block IDs, values are metadata about the block.
     * @type {Object.<string, Object>}
     */
    _blocks: {
        [x: string]: any;
    };
    /**
     * All top-level scripts in the workspace.
     * A list of block IDs that represent scripts (i.e., first block in script).
     * @type {Array.<String>}
     */
    _scripts: Array<string>;
    _cache: {
        /**
         * Cache block inputs by block id
         * @type {Object.<string, !Array.<object>>}
         */
        inputs: {
            [x: string]: Array<object>;
        };
        /**
         * Cache procedure Param Names by block id
         * @type {Object.<string, ?Array.<string>>}
         */
        procedureParamNames: {
            [x: string]: Array<string> | null;
        };
        /**
         * Cache procedure definitions by block id
         * @type {Object.<string, ?string>}
         */
        procedureDefinitions: {
            [x: string]: string | null;
        };
        /**
         * A cache for execute to use and store on. Only available to
         * execute.
         * @type {Object.<string, object>}
         */
        _executeCached: {
            [x: string]: object;
        };
        /**
         * A cache of block IDs and targets to start threads on as they are
         * actively monitored.
         * @type {Array<{blockId: string, target: import("./target")}>}
         */
        _monitored: Array<{
            blockId: string;
            target: import("./target");
        }>;
        /**
         * A cache of hat opcodes to collection of theads to execute.
         * @type {Object.<string, object>}
         */
        scripts: {
            [x: string]: object;
        };
    };
    /**
     * Flag which indicates that blocks in this container should not glow.
     * Blocks will still glow when clicked on, but this flag is used to control
     * whether the blocks in this container can request a glow as part of
     * a running stack. E.g. the flyout block container and the monitor block container
     * should not be able to request a glow, but blocks containers belonging to
     * sprites should.
     * @type {boolean}
     */
    forceNoGlow: boolean;
    /**
     * Provide an object with metadata for the requested block ID.
     * @param {!string} blockId ID of block we have stored.
     * @return {?object} Metadata about the block, if it exists.
     */
    getBlock(blockId: string): object | null;
    /**
     * Get all known top-level blocks that start scripts.
     * @return {Array.<string>} List of block IDs.
     */
    getScripts(): Array<string>;
    /**
      * Get the next block for a particular block
      * @param {?string} id ID of block to get the next block for
      * @return {?string} ID of next block in the sequence
      */
    getNextBlock(id: string | null): string | null;
    /**
     * Get the branch for a particular C-shaped block.
     * @param {?string} id ID for block to get the branch for.
     * @param {?number} branchNum Which branch to select (e.g. for if-else).
     * @return {?string} ID of block in the branch.
     */
    getBranch(id: string | null, branchNum: number | null): string | null;
    /**
     * Get the opcode for a particular block
     * @param {?object} block The block to query
     * @return {?string} the opcode corresponding to that block
     */
    getOpcode(block: object | null): string | null;
    /**
     * Get all fields and their values for a block.
     * @param {?object} block The block to query.
     * @return {?object} All fields and their values.
     */
    getFields(block: object | null): object | null;
    /**
     * Get all non-branch inputs for a block.
     * @param {?object} block the block to query.
     * @return {?Array.<object>} All non-branch inputs and their associated blocks.
     */
    getInputs(block: object | null): Array<object> | null;
    /**
     * Get mutation data for a block.
     * @param {?object} block The block to query.
     * @return {?object} Mutation for the block.
     */
    getMutation(block: object | null): object | null;
    /**
     * Get the top-level script for a given block.
     * @param {?string} id ID of block to query.
     * @return {?string} ID of top-level script block.
     */
    getTopLevelScript(id: string | null): string | null;
    /**
     * Get the procedure definition for a given name.
     * @param {?string} name Name of procedure to query.
     * @return {?string} ID of procedure definition.
     */
    getProcedureDefinition(name: string | null): string | null;
    /**
     * Get names and ids of parameters for the given procedure.
     * @param {?string} name Name of procedure to query.
     * @return {?Array.<string>} List of param names for a procedure.
     */
    getProcedureParamNamesAndIds(name: string | null): Array<string> | null;
    /**
     * Get names, ids, and defaults of parameters for the given procedure.
     * @param {?string} name Name of procedure to query.
     * @return {?Array.<string>} List of param names for a procedure.
     */
    getProcedureParamNamesIdsAndDefaults(name: string | null): Array<string> | null;
    duplicate(): Blocks;
    /**
     * Create event listener for blocks, variables, and comments. Handles validation and
     * serves as a generic adapter between the blocks, variables, and the
     * runtime interface.
     * @param {object} e Blockly "block" or "variable" event
     */
    blocklyListen(e: object): void;
    /**
     * Reset all runtime caches.
     */
    resetCache(): void;
    /**
     * Emit a project changed event if this is a block container
     * that can affect the project state.
     */
    emitProjectChanged(): void;
    /**
     * Block management: create blocks and scripts from a `create` event
     * @param {!object} block Blockly create event to be processed
     */
    createBlock(block: object): void;
    /**
     * Block management: change block field values
     * @param {!object} args Blockly change event to be processed
     */
    changeBlock(args: object): void;
    /**
     * Block management: move blocks from parent to parent
     * @param {!object} e Blockly move event to be processed
     */
    moveBlock(e: object): void;
    /**
     * Block management: run all blocks.
     * @param {!object} runtime Runtime to run all blocks in.
     */
    runAllMonitored(runtime: object): void;
    /**
     * Block management: delete blocks and their associated scripts. Does nothing if a block
     * with the given ID does not exist.
     * @param {!string} blockId Id of block to delete
     */
    deleteBlock(blockId: string): void;
    /**
     * Returns a map of all references to variables or lists from blocks
     * in this block container.
     * @param {Array<object>} optBlocks Optional list of blocks to constrain the search to.
     * This is useful for getting variable/list references for a stack of blocks instead
     * of all blocks on the workspace
     * @param {?boolean} optIncludeBroadcast Optional whether to include broadcast fields.
     * @return {object} A map of variable ID to a list of all variable references
     * for that ID. A variable reference contains the field referencing that variable
     * and also the type of the variable being referenced.
     */
    getAllVariableAndListReferences(optBlocks: Array<object>, optIncludeBroadcast: boolean | null): object;
    /**
     * Keep blocks up to date after a variable gets renamed.
     * @param {string} varId The id of the variable that was renamed
     * @param {string} newName The new name of the variable that was renamed
     */
    updateBlocksAfterVarRename(varId: string, newName: string): void;
    /**
     * Keep blocks up to date after they are shared between targets.
     * @param {boolean} isStage If the new target is a stage.
     */
    updateTargetSpecificBlocks(isStage: boolean): void;
    /**
     * Update blocks after a sound, costume, or backdrop gets renamed.
     * Any block referring to the old name of the asset should get updated
     * to refer to the new name.
     * @param {string} oldName The old name of the asset that was renamed.
     * @param {string} newName The new name of the asset that was renamed.
     * @param {string} assetType String representation of the kind of asset
     * that was renamed. This can be one of 'sprite','costume', 'sound', or
     * 'backdrop'.
     */
    updateAssetName(oldName: string, newName: string, assetType: string): void;
    /**
     * Update sensing_of blocks after a variable gets renamed.
     * @param {string} oldName The old name of the variable that was renamed.
     * @param {string} newName The new name of the variable that was renamed.
     * @param {string} targetName The name of the target the variable belongs to.
     * @return {boolean} Returns true if any of the blocks were updated.
     */
    updateSensingOfReference(oldName: string, newName: string, targetName: string): boolean;
    /**
     * Helper function to retrieve a costume menu field from a block given its id.
     * @param {string} blockId A unique identifier for a block
     * @return {?object} The costume menu field of the block with the given block id.
     * Null if either a block with the given id doesn't exist or if a costume menu field
     * does not exist on the block with the given id.
     */
    _getCostumeField(blockId: string): object | null;
    /**
     * Helper function to retrieve a sound menu field from a block given its id.
     * @param {string} blockId A unique identifier for a block
     * @return {?object} The sound menu field of the block with the given block id.
     * Null, if either a block with the given id doesn't exist or if a sound menu field
     * does not exist on the block with the given id.
     */
    _getSoundField(blockId: string): object | null;
    /**
     * Helper function to retrieve a backdrop menu field from a block given its id.
     * @param {string} blockId A unique identifier for a block
     * @return {?object} The backdrop menu field of the block with the given block id.
     * Null, if either a block with the given id doesn't exist or if a backdrop menu field
     * does not exist on the block with the given id.
     */
    _getBackdropField(blockId: string): object | null;
    /**
     * Helper function to retrieve a sprite menu field from a block given its id.
     * @param {string} blockId A unique identifier for a block
     * @return {?object} The sprite menu field of the block with the given block id.
     * Null, if either a block with the given id doesn't exist or if a sprite menu field
     * does not exist on the block with the given id.
     */
    _getSpriteField(blockId: string): object | null;
    /**
     * Encode all of `this._blocks` as an XML string usable
     * by a Blockly/scratch-blocks workspace.
     * @param {object<string, Comment>} comments Map of comments referenced by id
     * @return {string} String of XML representing this object's blocks.
     */
    toXML(comments: any): string;
    /**
     * Recursively encode an individual block and its children
     * into a Blockly/scratch-blocks XML string.
     * @param {!string} blockId ID of block to encode.
     * @param {object<string, Comment>} comments Map of comments referenced by id
     * @return {string} String of XML representing this block and any children.
     */
    blockToXML(blockId: string, comments: any): string;
    /**
     * Recursively encode a mutation object to XML.
     * @param {!object} mutation Object representing a mutation.
     * @return {string} XML string representing a mutation.
     */
    mutationToXML(mutation: object): string;
    /**
     * Helper to serialize block fields and input fields for reporting new monitors
     * @param {!object} block Block to be paramified.
     * @return {!object} object of param key/values.
     */
    _getBlockParams(block: object): object;
    /**
     * Helper to get the corresponding internal procedure definition block
     * @param {!object} defineBlock Outer define block.
     * @return {!object} internal definition block which has the mutation.
     */
    _getCustomBlockInternal(defineBlock: object): object;
    /**
     * Helper to add a stack to `this._scripts`.
     * @param {?string} topBlockId ID of block that starts the script.
     */
    _addScript(topBlockId: string | null): void;
    /**
     * Helper to remove a script from `this._scripts`.
     * @param {?string} topBlockId ID of block that starts the script.
     */
    _deleteScript(topBlockId: string | null): void;
}
