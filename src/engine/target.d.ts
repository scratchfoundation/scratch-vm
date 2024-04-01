export = Target;
/**
 * @fileoverview
 * A Target is an abstract "code-running" object for the Scratch VM.
 * Examples include sprites/clones or potentially physical-world devices.
 */
declare class Target extends EventEmitter {
    /**
     * @param {import("./runtime")} runtime Reference to the runtime.
     * @param {?Blocks} blocks Blocks instance for the blocks owned by this target.
     * @constructor
     */
    constructor(runtime: import("./runtime"), blocks: Blocks | null);
    /**
     * Reference to the runtime.
     * @type {import("./runtime")}
     */
    runtime: import("./runtime");
    /**
     * A unique ID for this target.
     * @type {string}
     */
    id: string;
    /**
     * Blocks run as code for this target.
     * @type {!Blocks}
     */
    blocks: Blocks;
    /**
     * Dictionary of variables and their values for this target.
     * Key is the variable id.
     * @type {Object.<string,*>}
     */
    variables: {
        [x: string]: any;
    };
    /**
     * Dictionary of comments for this target.
     * Key is the comment id.
     * @type {Object.<string,*>}
     */
    comments: {
        [x: string]: any;
    };
    /**
     * Dictionary of custom state for this target.
     * This can be used to store target-specific custom state for blocks which need it.
     * TODO: do we want to persist this in SB3 files?
     * @type {Object.<string,*>}
     */
    _customState: {
        [x: string]: any;
    };
    /**
     * Currently known values for edge-activated hats.
     * Keys are block ID for the hat; values are the currently known values.
     * @type {Object.<string, *>}
     */
    _edgeActivatedHatValues: {
        [x: string]: any;
    };
    /**
     * Called when the project receives a "green flag."
     * @abstract
     */
    onGreenFlag(): void;
    /**
     * Return a human-readable name for this target.
     * Target implementations should override this.
     * @abstract
     * @returns {string} Human-readable name for the target.
     */
    getName(): string;
    /**
     * Update an edge-activated hat block value.
     * @param {!string} blockId ID of hat to store value for.
     * @param {*} newValue Value to store for edge-activated hat.
     * @return {*} The old value for the edge-activated hat.
     */
    updateEdgeActivatedValue(blockId: string, newValue: any): any;
    hasEdgeActivatedValue(blockId: any): boolean;
    /**
     * Clear all edge-activaed hat values.
     */
    clearEdgeActivatedValues(): void;
    /**
     * Look up a variable object, first by id, and then by name if the id is not found.
     * Create a new variable if both lookups fail.
     * @param {string} id Id of the variable.
     * @param {string} name Name of the variable.
     * @return {!Variable} Variable object.
     */
    lookupOrCreateVariable(id: string, name: string): Variable;
    /**
     * Look up a broadcast message object with the given id and return it
     * if it exists.
     * @param {string} id Id of the variable.
     * @param {string} name Name of the variable.
     * @return {?Variable} Variable object.
     */
    lookupBroadcastMsg(id: string, name: string): Variable | null;
    /**
     * Look up a broadcast message with the given name and return the variable
     * if it exists. Does not create a new broadcast message variable if
     * it doesn't exist.
     * @param {string} name Name of the variable.
     * @return {?Variable} Variable object.
     */
    lookupBroadcastByInputValue(name: string): Variable | null;
    /**
     * Look up a variable object.
     * Search begins for local variables; then look for globals.
     * @param {string} id Id of the variable.
     * @param {string} name Name of the variable.
     * @return {!Variable} Variable object.
     */
    lookupVariableById(id: string): Variable;
    /**
     * Look up a variable object by its name and variable type.
     * Search begins with local variables; then global variables if a local one
     * was not found.
     * @param {string} name Name of the variable.
     * @param {string} type Type of the variable. Defaults to Variable.SCALAR_TYPE.
     * @param {?boolean} skipStage Optional flag to skip checking the stage
     * @return {?Variable} Variable object if found, or null if not.
     */
    lookupVariableByNameAndType(name: string, type: string, skipStage: boolean | null): Variable | null;
    /**
    * Look up a list object for this target, and create it if one doesn't exist.
    * Search begins for local lists; then look for globals.
    * @param {!string} id Id of the list.
    * @param {!string} name Name of the list.
    * @return {!Variable} Variable object representing the found/created list.
     */
    lookupOrCreateList(id: string, name: string): Variable;
    /**
     * Creates a variable with the given id and name and adds it to the
     * dictionary of variables.
     * @param {string} id Id of variable
     * @param {string} name Name of variable.
     * @param {string} type Type of variable, '', 'broadcast_msg', or 'list'
     * @param {boolean} isCloud Whether the variable to create has the isCloud flag set.
     * Additional checks are made that the variable can be created as a cloud variable.
     */
    createVariable(id: string, name: string, type: string, isCloud: boolean): void;
    /**
     * Creates a comment with the given properties.
     * @param {string} id Id of the comment.
     * @param {string} blockId Optional id of the block the comment is attached
     * to if it is a block comment.
     * @param {string} text The text the comment contains.
     * @param {number} x The x coordinate of the comment on the workspace.
     * @param {number} y The y coordinate of the comment on the workspace.
     * @param {number} width The width of the comment when it is full size
     * @param {number} height The height of the comment when it is full size
     * @param {boolean} minimized Whether the comment is minimized.
     */
    createComment(id: string, blockId: string, text: string, x: number, y: number, width: number, height: number, minimized: boolean): void;
    /**
     * Renames the variable with the given id to newName.
     * @param {string} id Id of variable to rename.
     * @param {string} newName New name for the variable.
     */
    renameVariable(id: string, newName: string): void;
    /**
     * Removes the variable with the given id from the dictionary of variables.
     * @param {string} id Id of variable to delete.
     */
    deleteVariable(id: string): void;
    /**
     * Remove this target's monitors from the runtime state and remove the
     * target-specific monitored blocks (e.g. local variables, global variables for the stage, x-position).
     * NOTE: This does not delete any of the stage monitors like backdrop name.
     */
    deleteMonitors(): void;
    /**
     * Create a clone of the variable with the given id from the dictionary of
     * this target's variables.
     * @param {string} id Id of variable to duplicate.
     * @param {boolean=} optKeepOriginalId Optional flag to keep the original variable ID
     * for the duplicate variable. This is necessary when cloning a sprite, for example.
     * @return {?Variable} The duplicated variable, or null if
     * the original variable was not found.
     */
    duplicateVariable(id: string, optKeepOriginalId?: boolean | undefined): Variable | null;
    /**
     * Duplicate the dictionary of this target's variables as part of duplicating.
     * this target or making a clone.
     * @param {object=} optBlocks Optional block container for the target being duplicated.
     * If provided, new variables will be generated with new UIDs and any variable references
     * in this blocks container will be updated to refer to the corresponding new IDs.
     * @return {object} The duplicated dictionary of variables
     */
    duplicateVariables(optBlocks?: object | undefined): object;
    /**
     * Post/edit sprite info.
     * @param {object} data An object with sprite info data to set.
     * @abstract
     */
    postSpriteInfo(): void;
    /**
     * Retrieve custom state associated with this target and the provided state ID.
     * @param {string} stateId - specify which piece of state to retrieve.
     * @returns {*} the associated state, if any was found.
     */
    getCustomState(stateId: string): any;
    /**
     * Store custom state associated with this target and the provided state ID.
     * @param {string} stateId - specify which piece of state to store on this target.
     * @param {*} newValue - the state value to store.
     */
    setCustomState(stateId: string, newValue: any): void;
    /**
     * Call to destroy a target.
     * @abstract
     */
    dispose(): void;
    /**
     * Get the names of all the variables of the given type that are in scope for this target.
     * For targets that are not the stage, this includes any target-specific
     * variables as well as any stage variables unless the skipStage flag is true.
     * For the stage, this is all stage variables.
     * @param {string} type The variable type to search for; defaults to Variable.SCALAR_TYPE
     * @param {?boolean} skipStage Optional flag to skip the stage.
     * @return {Array<string>} A list of variable names
     */
    getAllVariableNamesInScopeByType(type: string, skipStage: boolean | null): Array<string>;
    /**
     * Merge variable references with another variable.
     * @param {string} idToBeMerged ID of the variable whose references need to be updated
     * @param {string} idToMergeWith ID of the variable that the old references should be replaced with
     * @param {?Array<Object>} optReferencesToUpdate Optional context of the change.
     * Defaults to all the blocks in this target.
     * @param {?string} optNewName New variable name to merge with. The old
     * variable name in the references being updated should be replaced with this new name.
     * If this parameter is not provided or is '', no name change occurs.
     */
    mergeVariables(idToBeMerged: string, idToMergeWith: string, optReferencesToUpdate: Array<any> | null, optNewName: string | null): void;
    /**
     * Share a local variable (and given references for that variable) to the stage.
     * @param {string} varId The ID of the variable to share.
     * @param {Array<object>} varRefs The list of variable references being shared,
     * that reference the given variable ID. The names and IDs of these variable
     * references will be updated to refer to the new (or pre-existing) global variable.
     */
    shareLocalVariableToStage(varId: string, varRefs: Array<object>): void;
    /**
     * Share a local variable with a sprite, merging with one of the same name and
     * type if it already exists on the sprite, or create a new one.
     * @param {string} varId Id of the variable to share
     * @param {Target} sprite The sprite to share the variable with
     * @param {Array<object>} varRefs A list of all the variable references currently being shared.
     */
    shareLocalVariableToSprite(varId: string, sprite: Target, varRefs: Array<object>): void;
    /**
     * Given a list of variable referencing fields, shares those variables with
     * the target with the provided id, resolving any variable conflicts that arise
     * using the following rules:
     *
     * If this target is the stage, exit. There are no conflicts that arise
     * from sharing variables from the stage to another sprite. The variables
     * already exist globally, so no further action is needed.
     *
     * If a variable being referenced is a global variable, do nothing. The
     * global variable already exists so no further action is needed.
     *
     * If a variable being referenced is local, and
     * 1) The receiving target is a sprite:
     * create a new local variable or merge with an existing local variable
     * of the same name and type. Update all the referencing fields
     * for the original variable to reference the new variable.
     * 2) The receiving target is the stage:
     * Create a new global variable with a fresh name and update all the referencing
     * fields to reference the new variable.
     *
     * @param {Array<object>} blocks The blocks containing
     * potential conflicting references to variables.
     * @param {Target} receivingTarget The target receiving the variables
     */
    resolveVariableSharingConflictsWithTarget(blocks: Array<object>, receivingTarget: Target): void;
    /**
     * Fixes up variable references in this target avoiding conflicts with
     * pre-existing variables in the same scope.
     * This is used when uploading this target as a new sprite into an existing
     * project, where the new sprite may contain references
     * to variable names that already exist as global variables in the project
     * (and thus are in scope for variable references in the given sprite).
     *
     * If this target has a block that references an existing global variable and that
     * variable *does not* exist in this target (e.g. it was a global variable in the
     * project the sprite was originally exported from), merge the variables. This entails
     * fixing the variable references in this sprite to reference the id of the pre-existing global variable.
     *
     * If this target has a block that references an existing global variable and that
     * variable does exist in the target itself (e.g. it's a local variable in the sprite being uploaded),
     * then the local variable is renamed to distinguish itself from the pre-existing variable.
     * All blocks that reference the local variable will be updated to use the new name.
     */
    fixUpVariableReferences(): void;
}
import EventEmitter = require("events");
import Blocks = require("./blocks");
import Variable = require("../engine/variable");
