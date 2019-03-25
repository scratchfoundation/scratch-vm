const EventEmitter = require('events');

const Blocks = require('./blocks');
const Variable = require('../engine/variable');
const Comment = require('../engine/comment');
const uid = require('../util/uid');
const {Map} = require('immutable');
const log = require('../util/log');
const StringUtil = require('../util/string-util');
const VariableUtil = require('../util/variable-util');

/**
 * @fileoverview
 * A Target is an abstract "code-running" object for the Scratch VM.
 * Examples include sprites/clones or potentially physical-world devices.
 */

class Target extends EventEmitter {

    /**
     * @param {Runtime} runtime Reference to the runtime.
     * @param {?Blocks} blocks Blocks instance for the blocks owned by this target.
     * @constructor
     */
    constructor (runtime, blocks) {
        super();

        if (!blocks) {
            blocks = new Blocks(runtime);
        }

        /**
         * Reference to the runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;
        /**
         * A unique ID for this target.
         * @type {string}
         */
        this.id = uid();
        /**
         * Blocks run as code for this target.
         * @type {!Blocks}
         */
        this.blocks = blocks;
        /**
         * Dictionary of variables and their values for this target.
         * Key is the variable id.
         * @type {Object.<string,*>}
         */
        this.variables = {};
        /**
         * Dictionary of comments for this target.
         * Key is the comment id.
         * @type {Object.<string,*>}
         */
        this.comments = {};
        /**
         * Dictionary of custom state for this target.
         * This can be used to store target-specific custom state for blocks which need it.
         * TODO: do we want to persist this in SB3 files?
         * @type {Object.<string,*>}
         */
        this._customState = {};

        /**
         * Currently known values for edge-activated hats.
         * Keys are block ID for the hat; values are the currently known values.
         * @type {Object.<string, *>}
         */
        this._edgeActivatedHatValues = {};
    }

    /**
     * Called when the project receives a "green flag."
     * @abstract
     */
    onGreenFlag () {}

    /**
     * Return a human-readable name for this target.
     * Target implementations should override this.
     * @abstract
     * @returns {string} Human-readable name for the target.
     */
    getName () {
        return this.id;
    }

    /**
     * Update an edge-activated hat block value.
     * @param {!string} blockId ID of hat to store value for.
     * @param {*} newValue Value to store for edge-activated hat.
     * @return {*} The old value for the edge-activated hat.
     */
    updateEdgeActivatedValue (blockId, newValue) {
        const oldValue = this._edgeActivatedHatValues[blockId];
        this._edgeActivatedHatValues[blockId] = newValue;
        return oldValue;
    }

    hasEdgeActivatedValue (blockId) {
        return this._edgeActivatedHatValues.hasOwnProperty(blockId);
    }

    /**
     * Clear all edge-activaed hat values.
     */
    clearEdgeActivatedValues () {
        this._edgeActivatedHatValues = {};
    }

    /**
     * Look up a variable object, first by id, and then by name if the id is not found.
     * Create a new variable if both lookups fail.
     * @param {string} id Id of the variable.
     * @param {string} name Name of the variable.
     * @return {!Variable} Variable object.
     */
    lookupOrCreateVariable (id, name) {
        let variable = this.lookupVariableById(id);
        if (variable) return variable;

        variable = this.lookupVariableByNameAndType(name, Variable.SCALAR_TYPE);
        if (variable) return variable;

        // No variable with this name exists - create it locally.
        const newVariable = new Variable(id, name, Variable.SCALAR_TYPE, false);
        this.variables[id] = newVariable;
        return newVariable;
    }

    /**
     * Look up a broadcast message object with the given id and return it
     * if it exists.
     * @param {string} id Id of the variable.
     * @param {string} name Name of the variable.
     * @return {?Variable} Variable object.
     */
    lookupBroadcastMsg (id, name) {
        let broadcastMsg;
        if (id) {
            broadcastMsg = this.lookupVariableById(id);
        } else if (name) {
            broadcastMsg = this.lookupBroadcastByInputValue(name);
        } else {
            log.error('Cannot find broadcast message if neither id nor name are provided.');
        }
        if (broadcastMsg) {
            if (name && (broadcastMsg.name.toLowerCase() !== name.toLowerCase())) {
                log.error(`Found broadcast message with id: ${id}, but` +
                    `its name, ${broadcastMsg.name} did not match expected name ${name}.`);
            }
            if (broadcastMsg.type !== Variable.BROADCAST_MESSAGE_TYPE) {
                log.error(`Found variable with id: ${id}, but its type ${broadcastMsg.type}` +
                    `did not match expected type ${Variable.BROADCAST_MESSAGE_TYPE}`);
            }
            return broadcastMsg;
        }
    }

    /**
     * Look up a broadcast message with the given name and return the variable
     * if it exists. Does not create a new broadcast message variable if
     * it doesn't exist.
     * @param {string} name Name of the variable.
     * @return {?Variable} Variable object.
     */
    lookupBroadcastByInputValue (name) {
        const vars = this.variables;
        for (const propName in vars) {
            if ((vars[propName].type === Variable.BROADCAST_MESSAGE_TYPE) &&
                (vars[propName].name.toLowerCase() === name.toLowerCase())) {
                return vars[propName];
            }
        }
    }

    /**
     * Look up a variable object.
     * Search begins for local variables; then look for globals.
     * @param {string} id Id of the variable.
     * @param {string} name Name of the variable.
     * @return {!Variable} Variable object.
     */
    lookupVariableById (id) {
        // If we have a local copy, return it.
        if (this.variables.hasOwnProperty(id)) {
            return this.variables[id];
        }
        // If the stage has a global copy, return it.
        if (this.runtime && !this.isStage) {
            const stage = this.runtime.getTargetForStage();
            if (stage && stage.variables.hasOwnProperty(id)) {
                return stage.variables[id];
            }
        }
    }

    /**
     * Look up a variable object by its name and variable type.
     * Search begins with local variables; then global variables if a local one
     * was not found.
     * @param {string} name Name of the variable.
     * @param {string} type Type of the variable. Defaults to Variable.SCALAR_TYPE.
     * @param {?bool} skipStage Optional flag to skip checking the stage
     * @return {?Variable} Variable object if found, or null if not.
     */
    lookupVariableByNameAndType (name, type, skipStage) {
        if (typeof name !== 'string') return;
        if (typeof type !== 'string') type = Variable.SCALAR_TYPE;
        skipStage = skipStage || false;

        for (const varId in this.variables) {
            const currVar = this.variables[varId];
            if (currVar.name === name && currVar.type === type) {
                return currVar;
            }
        }

        if (!skipStage && this.runtime && !this.isStage) {
            const stage = this.runtime.getTargetForStage();
            if (stage) {
                for (const varId in stage.variables) {
                    const currVar = stage.variables[varId];
                    if (currVar.name === name && currVar.type === type) {
                        return currVar;
                    }
                }
            }
        }

        return null;
    }

    /**
    * Look up a list object for this target, and create it if one doesn't exist.
    * Search begins for local lists; then look for globals.
    * @param {!string} id Id of the list.
    * @param {!string} name Name of the list.
    * @return {!Varible} Variable object representing the found/created list.
     */
    lookupOrCreateList (id, name) {
        let list = this.lookupVariableById(id);
        if (list) return list;

        list = this.lookupVariableByNameAndType(name, Variable.LIST_TYPE);
        if (list) return list;

        // No variable with this name exists - create it locally.
        const newList = new Variable(id, name, Variable.LIST_TYPE, false);
        this.variables[id] = newList;
        return newList;
    }

    /**
     * Creates a variable with the given id and name and adds it to the
     * dictionary of variables.
     * @param {string} id Id of variable
     * @param {string} name Name of variable.
     * @param {string} type Type of variable, '', 'broadcast_msg', or 'list'
     * @param {boolean} isCloud Whether the variable to create has the isCloud flag set.
     * Additional checks are made that the variable can be created as a cloud variable.
     */
    createVariable (id, name, type, isCloud) {
        if (!this.variables.hasOwnProperty(id)) {
            const newVariable = new Variable(id, name, type, false);
            if (isCloud && this.isStage && this.runtime.canAddCloudVariable()) {
                newVariable.isCloud = true;
                this.runtime.addCloudVariable();
                this.runtime.ioDevices.cloud.requestCreateVariable(newVariable);
            }
            this.variables[id] = newVariable;
        }
    }

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
    createComment (id, blockId, text, x, y, width, height, minimized) {
        if (!this.comments.hasOwnProperty(id)) {
            const newComment = new Comment(id, text, x, y,
                width, height, minimized);
            if (blockId) {
                newComment.blockId = blockId;
                const blockWithComment = this.blocks.getBlock(blockId);
                if (blockWithComment) {
                    blockWithComment.comment = id;
                } else {
                    log.warn(`Could not find block with id ${blockId
                    } associated with commentId: ${id}`);
                }
            }
            this.comments[id] = newComment;
        }
    }

    /**
     * Renames the variable with the given id to newName.
     * @param {string} id Id of variable to rename.
     * @param {string} newName New name for the variable.
     */
    renameVariable (id, newName) {
        if (this.variables.hasOwnProperty(id)) {
            const variable = this.variables[id];
            if (variable.id === id) {
                const oldName = variable.name;
                variable.name = newName;

                if (this.runtime) {
                    if (variable.isCloud && this.isStage) {
                        this.runtime.ioDevices.cloud.requestRenameVariable(oldName, newName);
                    }

                    const blocks = this.runtime.monitorBlocks;
                    blocks.changeBlock({
                        id: id,
                        element: 'field',
                        name: 'VARIABLE',
                        value: id
                    }, this.runtime);
                    const monitorBlock = blocks.getBlock(variable.id);
                    if (monitorBlock) {
                        this.runtime.requestUpdateMonitor(Map({
                            id: id,
                            params: blocks._getBlockParams(monitorBlock)
                        }));
                    }
                }

            }
        }
    }

    /**
     * Removes the variable with the given id from the dictionary of variables.
     * @param {string} id Id of variable to delete.
     */
    deleteVariable (id) {
        if (this.variables.hasOwnProperty(id)) {
            // Get info about the variable before deleting it
            const deletedVariableName = this.variables[id].name;
            const deletedVariableWasCloud = this.variables[id].isCloud;
            delete this.variables[id];
            if (this.runtime) {
                if (deletedVariableWasCloud && this.isStage) {
                    this.runtime.ioDevices.cloud.requestDeleteVariable(deletedVariableName);
                    this.runtime.removeCloudVariable();
                }
                this.runtime.monitorBlocks.deleteBlock(id);
                this.runtime.requestRemoveMonitor(id);
            }
        }
    }

    /**
     * Remove this target's monitors from the runtime state and remove the
     * target-specific monitored blocks (e.g. local variables, global variables for the stage, x-position).
     * NOTE: This does not delete any of the stage monitors like backdrop name.
     */
    deleteMonitors () {
        this.runtime.requestRemoveMonitorByTargetId(this.id);
        let targetSpecificMonitorBlockIds;
        if (this.isStage) {
            // This only deletes global variables and not other stage monitors like backdrop number.
            targetSpecificMonitorBlockIds = Object.keys(this.variables);
        } else {
            targetSpecificMonitorBlockIds = Object.keys(this.runtime.monitorBlocks._blocks)
                .filter(key => this.runtime.monitorBlocks._blocks[key].targetId === this.id);
        }
        for (const blockId of targetSpecificMonitorBlockIds) {
            this.runtime.monitorBlocks.deleteBlock(blockId);
        }
    }

    /**
     * Create a clone of the variable with the given id from the dictionary of
     * this target's variables.
     * @param {string} id Id of variable to duplicate.
     * @param {boolean=} optKeepOriginalId Optional flag to keep the original variable ID
     * for the duplicate variable. This is necessary when cloning a sprite, for example.
     * @return {?Variable} The duplicated variable, or null if
     * the original variable was not found.
     */
    duplicateVariable (id, optKeepOriginalId) {
        if (this.variables.hasOwnProperty(id)) {
            const originalVariable = this.variables[id];
            const newVariable = new Variable(
                optKeepOriginalId ? id : null, // conditionally keep original id or generate a new one
                originalVariable.name,
                originalVariable.type,
                originalVariable.isCloud
            );
            if (newVariable.type === Variable.LIST_TYPE) {
                newVariable.value = originalVariable.value.slice(0);
            } else {
                newVariable.value = originalVariable.value;
            }
            return newVariable;
        }
        return null;
    }

    /**
     * Duplicate the dictionary of this target's variables as part of duplicating.
     * this target or making a clone.
     * @param {object=} optBlocks Optional block container for the target being duplicated.
     * If provided, new variables will be generated with new UIDs and any variable references
     * in this blocks container will be updated to refer to the corresponding new IDs.
     * @return {object} The duplicated dictionary of variables
     */
    duplicateVariables (optBlocks) {
        let allVarRefs;
        if (optBlocks) {
            allVarRefs = optBlocks.getAllVariableAndListReferences();
        }
        return Object.keys(this.variables).reduce((accum, varId) => {
            const newVariable = this.duplicateVariable(varId, !optBlocks);
            accum[newVariable.id] = newVariable;
            if (optBlocks && allVarRefs) {
                const currVarRefs = allVarRefs[varId];
                if (currVarRefs) {
                    this.mergeVariables(varId, newVariable.id, currVarRefs);
                }
            }
            return accum;
        }, {});
    }

    /**
     * Post/edit sprite info.
     * @param {object} data An object with sprite info data to set.
     * @abstract
     */
    postSpriteInfo () {}

    /**
     * Retrieve custom state associated with this target and the provided state ID.
     * @param {string} stateId - specify which piece of state to retrieve.
     * @returns {*} the associated state, if any was found.
     */
    getCustomState (stateId) {
        return this._customState[stateId];
    }

    /**
     * Store custom state associated with this target and the provided state ID.
     * @param {string} stateId - specify which piece of state to store on this target.
     * @param {*} newValue - the state value to store.
     */
    setCustomState (stateId, newValue) {
        this._customState[stateId] = newValue;
    }

    /**
     * Call to destroy a target.
     * @abstract
     */
    dispose () {
        this._customState = {};

        if (this.runtime) {
            this.runtime.removeExecutable(this);
        }
    }

    // Variable Conflict Resolution Helpers

    /**
     * Get the names of all the variables of the given type that are in scope for this target.
     * For targets that are not the stage, this includes any target-specific
     * variables as well as any stage variables unless the skipStage flag is true.
     * For the stage, this is all stage variables.
     * @param {string} type The variable type to search for; defaults to Variable.SCALAR_TYPE
     * @param {?bool} skipStage Optional flag to skip the stage.
     * @return {Array<string>} A list of variable names
     */
    getAllVariableNamesInScopeByType (type, skipStage) {
        if (typeof type !== 'string') type = Variable.SCALAR_TYPE;
        skipStage = skipStage || false;
        const targetVariables = Object.values(this.variables)
            .filter(v => v.type === type)
            .map(variable => variable.name);
        if (skipStage || this.isStage || !this.runtime) {
            return targetVariables;
        }
        const stage = this.runtime.getTargetForStage();
        const stageVariables = stage.getAllVariableNamesInScopeByType(type);
        return targetVariables.concat(stageVariables);
    }

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
    mergeVariables (idToBeMerged, idToMergeWith, optReferencesToUpdate, optNewName) {
        const referencesToChange = optReferencesToUpdate ||
            // TODO should there be a separate helper function that traverses the blocks
            // for all references for a given ID instead of doing the below..?
            this.blocks.getAllVariableAndListReferences()[idToBeMerged];

        VariableUtil.updateVariableIdentifiers(referencesToChange, idToMergeWith, optNewName);
    }

    /**
     * Share a local variable (and given references for that variable) to the stage.
     * @param {string} varId The ID of the variable to share.
     * @param {Array<object>} varRefs The list of variable references being shared,
     * that reference the given variable ID. The names and IDs of these variable
     * references will be updated to refer to the new (or pre-existing) global variable.
     */
    shareLocalVariableToStage (varId, varRefs) {
        if (!this.runtime) return;
        const variable = this.variables[varId];
        if (!variable) {
            log.warn(`Cannot share a local variable to the stage if it's not local.`);
            return;
        }
        const stage = this.runtime.getTargetForStage();
        // If a local var is being shared with the stage,
        // sharing will make the variable global, resulting in a conflict
        // with the existing local variable. Preemptively Resolve this conflict
        // by renaming the new global variable.

        // First check if we've already done the local to global transition for this
        // variable. If we have, merge it with the global variable we've already created.
        const varIdForStage = `StageVarFromLocal_${varId}`;
        let stageVar = stage.lookupVariableById(varIdForStage);
        // If a global var doesn't already exist, create a new one with a fresh name.
        // Use the ID we created above so that we can lookup this new variable in the
        // future if we decide to share this same variable again.
        if (!stageVar) {
            const varName = variable.name;
            const varType = variable.type;

            const newStageName = `Stage: ${varName}`;
            stageVar = this.runtime.createNewGlobalVariable(newStageName, varIdForStage, varType);
        }
        // Update all variable references to use the new name and ID
        this.mergeVariables(varId, stageVar.id, varRefs, stageVar.name);
    }

    /**
     * Share a local variable with a sprite, merging with one of the same name and
     * type if it already exists on the sprite, or create a new one.
     * @param {string} varId Id of the variable to share
     * @param {Target} sprite The sprite to share the variable with
     * @param {Array<object>} varRefs A list of all the variable references currently being shared.
     */
    shareLocalVariableToSprite (varId, sprite, varRefs) {
        if (!this.runtime) return;
        if (this.isStage) return;
        const variable = this.variables[varId];
        if (!variable) {
            log.warn(`Tried to call 'shareLocalVariableToSprite' with a non-local variable.`);
            return;
        }
        const varName = variable.name;
        const varType = variable.type;
        // Check if the receiving sprite already has a variable of the same name and type
        // and use the existing variable, otherwise create a new one.
        const existingLocalVar = sprite.lookupVariableByNameAndType(varName, varType);
        let newVarId;
        if (existingLocalVar) {
            newVarId = existingLocalVar.id;
        } else {
            const newVar = new Variable(null, varName, varType);
            newVarId = newVar.id;
            sprite.variables[newVarId] = newVar;
        }

        // Merge with the local variable on the new sprite.
        this.mergeVariables(varId, newVarId, varRefs);
    }

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
    resolveVariableSharingConflictsWithTarget (blocks, receivingTarget) {
        if (this.isStage) return;

        // Get all the variable references in the given list of blocks
        const allVarListRefs = this.blocks.getAllVariableAndListReferences(blocks);

        // For all the variables being referenced, check for which ones are local
        // to this target, and resolve conflicts based on whether the receiving target
        // is a sprite (with a conflicting local variable) or whether it is
        // the stage (which cannot have local variables)
        for (const varId in allVarListRefs) {
            const currVar = this.variables[varId];
            if (!currVar) continue; // The current variable is global, there shouldn't be any conflicts here, skip it.

            // Get the list of references for the current variable id
            const currVarListRefs = allVarListRefs[varId];

            if (receivingTarget.isStage) {
                this.shareLocalVariableToStage(varId, currVarListRefs);
            } else {
                this.shareLocalVariableToSprite(varId, receivingTarget, currVarListRefs);
            }
        }
    }

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
    // TODO (#1360) This function is too long, add some helpers for the different chunks and cases...
    fixUpVariableReferences () {
        if (!this.runtime) return; // There's no runtime context to conflict with
        if (this.isStage) return; // Stage can't have variable conflicts with itself (and also can't be uploaded)
        const stage = this.runtime.getTargetForStage();
        if (!stage || !stage.variables) return;

        const renameConflictingLocalVar = (id, name, type) => {
            const conflict = stage.lookupVariableByNameAndType(name, type);
            if (conflict) {
                const newName = StringUtil.unusedName(
                    `${this.getName()}: ${name}`,
                    this.getAllVariableNamesInScopeByType(type));
                this.renameVariable(id, newName);
                return newName;
            }
            return null;
        };

        const allReferences = this.blocks.getAllVariableAndListReferences();
        const unreferencedLocalVarIds = [];
        if (Object.keys(this.variables).length > 0) {
            for (const localVarId in this.variables) {
                if (!this.variables.hasOwnProperty(localVarId)) continue;
                if (!allReferences[localVarId]) unreferencedLocalVarIds.push(localVarId);
            }
        }
        const conflictIdsToReplace = Object.create(null);
        const conflictNamesToReplace = Object.create(null);

        // Cache the list of all variable names by type so that we don't need to
        // re-calculate this in every iteration of the following loop.
        const varNamesByType = {};
        const allVarNames = type => {
            const namesOfType = varNamesByType[type];
            if (namesOfType) return namesOfType;
            varNamesByType[type] = this.runtime.getAllVarNamesOfType(type);
            return varNamesByType[type];
        };

        for (const varId in allReferences) {
            // We don't care about which var ref we get, they should all have the same var info
            const varRef = allReferences[varId][0];
            const varName = varRef.referencingField.value;
            const varType = varRef.type;
            if (this.lookupVariableById(varId)) {
                // Found a variable with the id in either the target or the stage,
                // figure out which one.
                if (this.variables.hasOwnProperty(varId)) {
                    // If the target has the variable, then check whether the stage
                    // has one with the same name and type. If it does, then rename
                    // this target specific variable so that there is a distinction.
                    const newVarName = renameConflictingLocalVar(varId, varName, varType);

                    if (newVarName) {
                        // We are not calling this.blocks.updateBlocksAfterVarRename
                        // here because it will search through all the blocks. We already
                        // have access to all the references for this var id.
                        allReferences[varId].map(ref => {
                            ref.referencingField.value = newVarName;
                            return ref;
                        });
                    }
                }
            } else {
                // We didn't find the referenced variable id anywhere,
                // Treat it as a reference to a global variable (from the original
                // project this sprite was exported from).
                // Check for whether a global variable of the same name and type exists,
                // and if so, track it to merge with the existing global in a second pass of the blocks.
                const existingVar = stage.lookupVariableByNameAndType(varName, varType);
                if (existingVar) {
                    if (!conflictIdsToReplace[varId]) {
                        conflictIdsToReplace[varId] = existingVar.id;
                    }
                } else {
                    // A global variable with the same name did not already exist,
                    // create a new one such that it does not conflict with any
                    // names of local variables of the same type.
                    const allNames = allVarNames(varType);
                    const freshName = StringUtil.unusedName(varName, allNames);
                    stage.createVariable(varId, freshName, varType);
                    if (!conflictNamesToReplace[varId]) {
                        conflictNamesToReplace[varId] = freshName;
                    }
                }
            }
        }
        // Rename any local variables that were missed above because they aren't
        // referenced by any blocks
        for (const id in unreferencedLocalVarIds) {
            const varId = unreferencedLocalVarIds[id];
            const name = this.variables[varId].name;
            const type = this.variables[varId].type;
            renameConflictingLocalVar(varId, name, type);
        }
        // Handle global var conflicts with existing global vars (e.g. a sprite is uploaded, and has
        // blocks referencing some variable that the sprite does not own, and this
        // variable conflicts with a global var)
        // In this case, we want to merge the new variable referenes with the
        // existing global variable
        for (const conflictId in conflictIdsToReplace) {
            const existingId = conflictIdsToReplace[conflictId];
            const referencesToUpdate = allReferences[conflictId];
            this.mergeVariables(conflictId, existingId, referencesToUpdate);
        }

        // Handle global var conflicts existing local vars (e.g a sprite is uploaded,
        // and has blocks referencing some variable that the sprite does not own, and this
        // variable conflcits with another sprite's local var).
        // In this case, we want to go through the variable references and update
        // the name of the variable in that reference.
        for (const conflictId in conflictNamesToReplace) {
            const newName = conflictNamesToReplace[conflictId];
            const referencesToUpdate = allReferences[conflictId];
            referencesToUpdate.map(ref => {
                ref.referencingField.value = newName;
                return ref;
            });
        }
    }

}

module.exports = Target;
