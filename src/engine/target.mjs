import EventEmitter from 'events';

import uid from '../util/uid.mjs';

/**
 * @fileoverview
 * A Target is an abstract "code-running" object for the Scratch VM.
 * Examples include sprites/clones or potentially physical-world devices.
 */

class Target extends EventEmitter {

    /**
     * @param {Runtime} runtime Reference to the runtime.
     * @constructor
     */
    constructor (runtime) {
        super();
        /**
         * Reference to the runtime.
         * @type {Runtime}
         */
        this.runtime = runtime.runtime;
        /**
         * A unique ID for this target.
         * @type {string}
         */
        this.id = uid();
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

export default Target;
