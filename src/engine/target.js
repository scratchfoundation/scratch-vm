const EventEmitter = require('events');

const Blocks = require('./blocks');
const Variable = require('../engine/variable');
const Comment = require('../engine/comment');
const uid = require('../util/uid');
const {Map} = require('immutable');
const log = require('../util/log');
const StringUtil = require('../util/string-util');

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
            blocks = new Blocks();
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
     */
    createVariable (id, name, type) {
        if (!this.variables.hasOwnProperty(id)) {
            const newVariable = new Variable(id, name, type, false);
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
     * @param {string} id Id of renamed variable.
     * @param {string} newName New name for the variable.
     */
    renameVariable (id, newName) {
        if (this.variables.hasOwnProperty(id)) {
            const variable = this.variables[id];
            if (variable.id === id) {
                variable.name = newName;

                if (this.runtime) {
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
     * @param {string} id Id of renamed variable.
     */
    deleteVariable (id) {
        if (this.variables.hasOwnProperty(id)) {
            delete this.variables[id];
            if (this.runtime) {
                this.runtime.monitorBlocks.deleteBlock(id);
                this.runtime.requestRemoveMonitor(id);
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
     * If the given target has a block that references an existing global variable and that
     * variable *does not* exist in the target itself (e.g. it was a global variable in the
     * project the sprite was originally exported from), fix the variable references in this sprite
     * to reference the id of the pre-existing global variable.
     * If the given target has a block that references an existing global variable and that
     * variable does exist in the target itself (e.g. it's a local variable in the sprite being uploaded),
     * then the variable is renamed to distinguish itself from the pre-existing variable.
     * All blocks that reference the local variable will be updated to use the new name.
     */
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
                const existingVar = this.lookupVariableByNameAndType(varName, varType);
                if (existingVar && !conflictIdsToReplace[varId]) {
                    conflictIdsToReplace[varId] = existingVar.id;
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
        // Finally, handle global var conflicts (e.g. a sprite is uploaded, and has
        // blocks referencing some variable that the sprite does not own, and this
        // variable conflicts with a global var)
        for (const conflictId in conflictIdsToReplace) {
            const existingId = conflictIdsToReplace[conflictId];
            allReferences[conflictId].map(varRef => {
                varRef.referencingField.id = existingId;
                return varRef;
            });
        }
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
    }
}

module.exports = Target;
