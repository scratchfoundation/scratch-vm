const adapter = require('./adapter');
const mutationAdapter = require('./mutation-adapter');
const xmlEscape = require('../util/xml-escape');
const MonitorRecord = require('./monitor-record');
const Clone = require('../util/clone');
const {Map} = require('immutable');
const BlocksExecuteCache = require('./blocks-execute-cache');
const log = require('../util/log');
const Variable = require('./variable');

/**
 * @fileoverview
 * Store and mutate the VM block representation,
 * and handle updates from Scratch Blocks events.
 */

/**
 * Create a block container.
 * @param {boolean} optNoGlow Optional flag to indicate that blocks in this container
 * should not request glows. This does not affect glows when clicking on a block to execute it.
 */
class Blocks {
    constructor (optNoGlow) {
        /**
         * All blocks in the workspace.
         * Keys are block IDs, values are metadata about the block.
         * @type {Object.<string, Object>}
         */
        this._blocks = {};

        /**
         * All top-level scripts in the workspace.
         * A list of block IDs that represent scripts (i.e., first block in script).
         * @type {Array.<String>}
         */
        this._scripts = [];

        /**
         * Runtime Cache
         * @type {{inputs: {}, procedureParamNames: {}, procedureDefinitions: {}}}
         * @private
         */
        Object.defineProperty(this, '_cache', {writable: true, enumerable: false});
        this._cache = {
            /**
             * Cache block inputs by block id
             * @type {object.<string, !Array.<object>>}
             */
            inputs: {},
            /**
             * Cache procedure Param Names by block id
             * @type {object.<string, ?Array.<string>>}
             */
            procedureParamNames: {},
            /**
             * Cache procedure definitions by block id
             * @type {object.<string, ?string>}
             */
            procedureDefinitions: {},

            /**
             * A cache for execute to use and store on. Only available to
             * execute.
             * @type {object.<string, object>}
             */
            _executeCached: {}
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
        this.forceNoGlow = optNoGlow || false;

    }

    /**
     * Blockly inputs that represent statements/branch.
     * are prefixed with this string.
     * @const{string}
     */
    static get BRANCH_INPUT_PREFIX () {
        return 'SUBSTACK';
    }

    /**
     * Provide an object with metadata for the requested block ID.
     * @param {!string} blockId ID of block we have stored.
     * @return {?object} Metadata about the block, if it exists.
     */
    getBlock (blockId) {
        return this._blocks[blockId];
    }

    /**
     * Get all known top-level blocks that start scripts.
     * @return {Array.<string>} List of block IDs.
     */
    getScripts () {
        return this._scripts;
    }

    /**
      * Get the next block for a particular block
      * @param {?string} id ID of block to get the next block for
      * @return {?string} ID of next block in the sequence
      */
    getNextBlock (id) {
        const block = this._blocks[id];
        return (typeof block === 'undefined') ? null : block.next;
    }

    /**
     * Get the branch for a particular C-shaped block.
     * @param {?string} id ID for block to get the branch for.
     * @param {?number} branchNum Which branch to select (e.g. for if-else).
     * @return {?string} ID of block in the branch.
     */
    getBranch (id, branchNum) {
        const block = this._blocks[id];
        if (typeof block === 'undefined') return null;
        if (!branchNum) branchNum = 1;

        let inputName = Blocks.BRANCH_INPUT_PREFIX;
        if (branchNum > 1) {
            inputName += branchNum;
        }

        // Empty C-block?
        const input = block.inputs[inputName];
        return (typeof input === 'undefined') ? null : input.block;
    }

    /**
     * Get the opcode for a particular block
     * @param {?object} block The block to query
     * @return {?string} the opcode corresponding to that block
     */
    getOpcode (block) {
        return (typeof block === 'undefined') ? null : block.opcode;
    }

    /**
     * Get all fields and their values for a block.
     * @param {?object} block The block to query.
     * @return {?object} All fields and their values.
     */
    getFields (block) {
        return (typeof block === 'undefined') ? null : block.fields;
    }

    /**
     * Get all non-branch inputs for a block.
     * @param {?object} block the block to query.
     * @return {?Array.<object>} All non-branch inputs and their associated blocks.
     */
    getInputs (block) {
        if (typeof block === 'undefined') return null;
        let inputs = this._cache.inputs[block.id];
        if (typeof inputs !== 'undefined') {
            return inputs;
        }

        inputs = {};
        for (const input in block.inputs) {
            // Ignore blocks prefixed with branch prefix.
            if (input.substring(0, Blocks.BRANCH_INPUT_PREFIX.length) !==
                Blocks.BRANCH_INPUT_PREFIX) {
                inputs[input] = block.inputs[input];
            }
        }

        this._cache.inputs[block.id] = inputs;
        return inputs;
    }

    /**
     * Get mutation data for a block.
     * @param {?object} block The block to query.
     * @return {?object} Mutation for the block.
     */
    getMutation (block) {
        return (typeof block === 'undefined') ? null : block.mutation;
    }

    /**
     * Get the top-level script for a given block.
     * @param {?string} id ID of block to query.
     * @return {?string} ID of top-level script block.
     */
    getTopLevelScript (id) {
        let block = this._blocks[id];
        if (typeof block === 'undefined') return null;
        while (block.parent !== null) {
            block = this._blocks[block.parent];
        }
        return block.id;
    }

    /**
     * Get the procedure definition for a given name.
     * @param {?string} name Name of procedure to query.
     * @return {?string} ID of procedure definition.
     */
    getProcedureDefinition (name) {
        const blockID = this._cache.procedureDefinitions[name];
        if (typeof blockID !== 'undefined') {
            return blockID;
        }

        for (const id in this._blocks) {
            if (!this._blocks.hasOwnProperty(id)) continue;
            const block = this._blocks[id];
            if (block.opcode === 'procedures_definition') {
                const internal = this._getCustomBlockInternal(block);
                if (internal && internal.mutation.proccode === name) {
                    this._cache.procedureDefinitions[name] = id; // The outer define block id
                    return id;
                }
            }
        }

        this._cache.procedureDefinitions[name] = null;
        return null;
    }

    /**
     * Get names of parameters for the given procedure.
     * @param {?string} name Name of procedure to query.
     * @return {?Array.<string>} List of param names for a procedure.
     */
    getProcedureParamNamesAndIds (name) {
        const cachedNames = this._cache.procedureParamNames[name];
        if (typeof cachedNames !== 'undefined') {
            return cachedNames;
        }

        for (const id in this._blocks) {
            if (!this._blocks.hasOwnProperty(id)) continue;
            const block = this._blocks[id];
            if (block.opcode === 'procedures_prototype' &&
                block.mutation.proccode === name) {
                const names = JSON.parse(block.mutation.argumentnames);
                const ids = JSON.parse(block.mutation.argumentids);
                this._cache.procedureParamNames[name] = [names, ids];
                return this._cache.procedureParamNames[name];
            }
        }

        this._cache.procedureParamNames[name] = null;
        return null;
    }

    duplicate () {
        const newBlocks = new Blocks(this.forceNoGlow);
        newBlocks._blocks = Clone.simple(this._blocks);
        newBlocks._scripts = Clone.simple(this._scripts);
        return newBlocks;
    }
    // ---------------------------------------------------------------------

    /**
     * Create event listener for blocks, variables, and comments. Handles validation and
     * serves as a generic adapter between the blocks, variables, and the
     * runtime interface.
     * @param {object} e Blockly "block" or "variable" event
     * @param {?Runtime} optRuntime Optional runtime to forward click events to.
     */
    blocklyListen (e, optRuntime) {
        // Validate event
        if (typeof e !== 'object') return;
        if (typeof e.blockId !== 'string' && typeof e.varId !== 'string' &&
            typeof e.commentId !== 'string') {
            return;
        }
        const stage = optRuntime.getTargetForStage();
        const editingTarget = optRuntime.getEditingTarget();

        // UI event: clicked scripts toggle in the runtime.
        if (e.element === 'stackclick') {
            if (optRuntime) {
                optRuntime.toggleScript(e.blockId, {stackClick: true});
            }
            return;
        }

        // Block create/update/destroy
        switch (e.type) {
        case 'create': {
            const newBlocks = adapter(e);
            // A create event can create many blocks. Add them all.
            for (let i = 0; i < newBlocks.length; i++) {
                this.createBlock(newBlocks[i]);
            }
            break;
        }
        case 'change':
            this.changeBlock({
                id: e.blockId,
                element: e.element,
                name: e.name,
                value: e.newValue
            }, optRuntime);
            break;
        case 'move':
            this.moveBlock({
                id: e.blockId,
                oldParent: e.oldParentId,
                oldInput: e.oldInputName,
                newParent: e.newParentId,
                newInput: e.newInputName,
                newCoordinate: e.newCoordinate
            });
            break;
        case 'dragOutside':
            if (optRuntime) {
                optRuntime.emitBlockDragUpdate(e.isOutside);
            }
            break;
        case 'endDrag':
            if (optRuntime) {
                optRuntime.emitBlockDragUpdate(false /* areBlocksOverGui */);

                // Drag blocks onto another sprite
                if (e.isOutside) {
                    const newBlocks = adapter(e);
                    optRuntime.emitBlockEndDrag(newBlocks);
                }
            }
            break;
        case 'delete':
            // Don't accept delete events for missing blocks,
            // or shadow blocks being obscured.
            if (!this._blocks.hasOwnProperty(e.blockId) ||
                this._blocks[e.blockId].shadow) {
                return;
            }
            // Inform any runtime to forget about glows on this script.
            if (optRuntime && this._blocks[e.blockId].topLevel) {
                optRuntime.quietGlow(e.blockId);
            }
            this.deleteBlock(e.blockId);
            break;
        case 'var_create':
            // Check if the variable being created is global or local
            // If local, create a local var on the current editing target, as long
            // as there are no conflicts, and the current target is actually a sprite
            // If global or if the editing target is not present or we somehow got
            // into a state where a local var was requested for the stage,
            // create a stage (global) var after checking for name conflicts
            // on all the sprites.
            if (e.isLocal && editingTarget && !editingTarget.isStage) {
                if (!editingTarget.lookupVariableById(e.varId)) {
                    editingTarget.createVariable(e.varId, e.varName, e.varType);
                }
            } else {
                // Check for name conflicts in all of the targets
                const allTargets = optRuntime.targets.filter(t => t.isOriginal);
                for (const target of allTargets) {
                    if (target.lookupVariableByNameAndType(e.varName, e.varType, true)) {
                        return;
                    }
                }
                stage.createVariable(e.varId, e.varName, e.varType);
            }
            break;
        case 'var_rename':
            if (editingTarget && editingTarget.variables.hasOwnProperty(e.varId)) {
                // This is a local variable, rename on the current target
                editingTarget.renameVariable(e.varId, e.newName);
                // Update all the blocks on the current target that use
                // this variable
                editingTarget.blocks.updateBlocksAfterVarRename(e.varId, e.newName);
            } else {
                // This is a global variable
                stage.renameVariable(e.varId, e.newName);
                // Update all blocks on all targets that use the renamed variable
                const targets = optRuntime.targets;
                for (let i = 0; i < targets.length; i++) {
                    const currTarget = targets[i];
                    currTarget.blocks.updateBlocksAfterVarRename(e.varId, e.newName);
                }
            }
            break;
        case 'var_delete': {
            const target = (editingTarget && editingTarget.variables.hasOwnProperty(e.varId)) ?
                editingTarget : stage;
            target.deleteVariable(e.varId);
            break;
        }
        case 'comment_create':
            if (optRuntime && optRuntime.getEditingTarget()) {
                const currTarget = optRuntime.getEditingTarget();
                currTarget.createComment(e.commentId, e.blockId, e.text,
                    e.xy.x, e.xy.y, e.width, e.height, e.minimized);

                if (currTarget.comments[e.commentId].x === null &&
                    currTarget.comments[e.commentId].y === null) {
                    // Block comments imported from 2.0 projects are imported with their
                    // x and y coordinates set to null so that scratch-blocks can
                    // auto-position them. If we are receiving a create event for these
                    // comments, then the auto positioning should have taken place.
                    // Update the x and y position of these comments to match the
                    // one from the event.
                    currTarget.comments[e.commentId].x = e.xy.x;
                    currTarget.comments[e.commentId].y = e.xy.y;
                }
            }
            break;
        case 'comment_change':
            if (optRuntime && optRuntime.getEditingTarget()) {
                const currTarget = optRuntime.getEditingTarget();
                if (!currTarget.comments.hasOwnProperty(e.commentId)) {
                    log.warn(`Cannot change comment with id ${e.commentId} because it does not exist.`);
                    return;
                }
                const comment = currTarget.comments[e.commentId];
                const change = e.newContents_;
                if (change.hasOwnProperty('minimized')) {
                    comment.minimized = change.minimized;
                }
                if (change.hasOwnProperty('width') && change.hasOwnProperty('height')){
                    comment.width = change.width;
                    comment.height = change.height;
                }
                if (change.hasOwnProperty('text')) {
                    comment.text = change.text;
                }
            }
            break;
        case 'comment_move':
            if (optRuntime && optRuntime.getEditingTarget()) {
                const currTarget = optRuntime.getEditingTarget();
                if (currTarget && !currTarget.comments.hasOwnProperty(e.commentId)) {
                    log.warn(`Cannot change comment with id ${e.commentId} because it does not exist.`);
                    return;
                }
                const comment = currTarget.comments[e.commentId];
                const newCoord = e.newCoordinate_;
                comment.x = newCoord.x;
                comment.y = newCoord.y;
            }
            break;
        case 'comment_delete':
            if (optRuntime && optRuntime.getEditingTarget()) {
                const currTarget = optRuntime.getEditingTarget();
                if (!currTarget.comments.hasOwnProperty(e.commentId)) {
                    // If we're in this state, we have probably received
                    // a delete event from a workspace that we switched from
                    // (e.g. a delete event for a comment on sprite a's workspace
                    // when switching from sprite a to sprite b)
                    return;
                }
                delete currTarget.comments[e.commentId];
                if (e.blockId) {
                    const block = currTarget.blocks.getBlock(e.blockId);
                    if (!block) {
                        log.warn(`Could not find block referenced by comment with id: ${e.commentId}`);
                        return;
                    }
                    delete block.comment;
                }
            }
            break;
        }
    }

    // ---------------------------------------------------------------------

    /**
     * Reset all runtime caches.
     */
    resetCache () {
        this._cache.inputs = {};
        this._cache.procedureParamNames = {};
        this._cache.procedureDefinitions = {};
        this._cache._executeCached = {};
    }

    /**
     * Block management: create blocks and scripts from a `create` event
     * @param {!object} block Blockly create event to be processed
     */
    createBlock (block) {
        // Does the block already exist?
        // Could happen, e.g., for an unobscured shadow.
        if (this._blocks.hasOwnProperty(block.id)) {
            return;
        }
        // Create new block.
        this._blocks[block.id] = block;
        // Push block id to scripts array.
        // Blocks are added as a top-level stack if they are marked as a top-block
        // (if they were top-level XML in the event).
        if (block.topLevel) {
            this._addScript(block.id);
        }

        this.resetCache();
    }

    /**
     * Block management: change block field values
     * @param {!object} args Blockly change event to be processed
     * @param {?Runtime} optRuntime Optional runtime to allow changeBlock to change VM state.
     */
    changeBlock (args, optRuntime) {
        // Validate
        if (['field', 'mutation', 'checkbox'].indexOf(args.element) === -1) return;
        const block = this._blocks[args.id];
        if (typeof block === 'undefined') return;
        const wasMonitored = block.isMonitored;
        switch (args.element) {
        case 'field':
            // Update block value
            if (!block.fields[args.name]) return;
            if (args.name === 'VARIABLE' || args.name === 'LIST' ||
                args.name === 'BROADCAST_OPTION') {
                // Get variable name using the id in args.value.
                const variable = optRuntime.getEditingTarget().lookupVariableById(args.value);
                if (variable) {
                    block.fields[args.name].value = variable.name;
                    block.fields[args.name].id = args.value;
                }
            } else {
                // Changing the value in a dropdown
                block.fields[args.name].value = args.value;

                if (!optRuntime){
                    break;
                }

                const flyoutBlock = block.shadow && block.parent ? this._blocks[block.parent] : block;
                if (flyoutBlock.isMonitored) {
                    optRuntime.requestUpdateMonitor(Map({
                        id: flyoutBlock.id,
                        params: this._getBlockParams(flyoutBlock)
                    }));
                }
            }
            break;
        case 'mutation':
            block.mutation = mutationAdapter(args.value);
            break;
        case 'checkbox': {
            block.isMonitored = args.value;
            if (!optRuntime) {
                break;
            }

            // Variable blocks may be sprite specific depending on the owner of the variable
            let isSpriteLocalVariable = false;
            if (block.opcode === 'data_variable') {
                isSpriteLocalVariable = !optRuntime.getEditingTarget().isStage &&
                    optRuntime.getEditingTarget().variables[block.fields.VARIABLE.id];
            } else if (block.opcode === 'data_listcontents') {
                isSpriteLocalVariable = !optRuntime.getEditingTarget().isStage &&
                    optRuntime.getEditingTarget().variables[block.fields.LIST.id];
            }


            const isSpriteSpecific = isSpriteLocalVariable ||
                (optRuntime.monitorBlockInfo.hasOwnProperty(block.opcode) &&
                optRuntime.monitorBlockInfo[block.opcode].isSpriteSpecific);
            block.targetId = isSpriteSpecific ? optRuntime.getEditingTarget().id : null;

            if (wasMonitored && !block.isMonitored) {
                optRuntime.requestHideMonitor(block.id);
            } else if (!wasMonitored && block.isMonitored) {
                // Tries to show the monitor for specified block. If it doesn't exist, add the monitor.
                if (!optRuntime.requestShowMonitor(block.id)) {
                    optRuntime.requestAddMonitor(MonitorRecord({
                        id: block.id,
                        targetId: block.targetId,
                        spriteName: block.targetId ? optRuntime.getTargetById(block.targetId).getName() : null,
                        opcode: block.opcode,
                        params: this._getBlockParams(block),
                        // @todo(vm#565) for numerical values with decimals, some countries use comma
                        value: '',
                        mode: block.opcode === 'data_listcontents' ? 'list' : 'default'
                    }));
                }
            }
            break;
        }
        }

        this.resetCache();
    }

    /**
     * Block management: move blocks from parent to parent
     * @param {!object} e Blockly move event to be processed
     */
    moveBlock (e) {
        if (!this._blocks.hasOwnProperty(e.id)) {
            return;
        }

        // Move coordinate changes.
        if (e.newCoordinate) {
            this._blocks[e.id].x = e.newCoordinate.x;
            this._blocks[e.id].y = e.newCoordinate.y;
        }

        // Remove from any old parent.
        if (typeof e.oldParent !== 'undefined') {
            const oldParent = this._blocks[e.oldParent];
            if (typeof e.oldInput !== 'undefined' &&
                oldParent.inputs[e.oldInput].block === e.id) {
                // This block was connected to the old parent's input.
                oldParent.inputs[e.oldInput].block = null;
            } else if (oldParent.next === e.id) {
                // This block was connected to the old parent's next connection.
                oldParent.next = null;
            }
            this._blocks[e.id].parent = null;
        }

        // Has the block become a top-level block?
        if (typeof e.newParent === 'undefined') {
            this._addScript(e.id);
        } else {
            // Remove script, if one exists.
            this._deleteScript(e.id);
            // Otherwise, try to connect it in its new place.
            if (typeof e.newInput === 'undefined') {
                // Moved to the new parent's next connection.
                this._blocks[e.newParent].next = e.id;
            } else {
                // Moved to the new parent's input.
                // Don't obscure the shadow block.
                let oldShadow = null;
                if (this._blocks[e.newParent].inputs.hasOwnProperty(e.newInput)) {
                    oldShadow = this._blocks[e.newParent].inputs[e.newInput].shadow;
                }
                this._blocks[e.newParent].inputs[e.newInput] = {
                    name: e.newInput,
                    block: e.id,
                    shadow: oldShadow
                };
            }
            this._blocks[e.id].parent = e.newParent;
        }
        this.resetCache();
    }


    /**
     * Block management: run all blocks.
     * @param {!object} runtime Runtime to run all blocks in.
     */
    runAllMonitored (runtime) {
        Object.keys(this._blocks).forEach(blockId => {
            if (this.getBlock(blockId).isMonitored) {
                const targetId = this.getBlock(blockId).targetId;
                runtime.addMonitorScript(blockId, targetId ? runtime.getTargetById(targetId) : null);
            }
        });
    }

    /**
     * Block management: delete blocks and their associated scripts. Does nothing if a block
     * with the given ID does not exist.
     * @param {!string} blockId Id of block to delete
     */
    deleteBlock (blockId) {
        // @todo In runtime, stop threads running on this script.

        // Get block
        const block = this._blocks[blockId];
        if (!block) {
            // No block with the given ID exists
            return;
        }

        // Delete children
        if (block.next !== null) {
            this.deleteBlock(block.next);
        }

        // Delete inputs (including branches)
        for (const input in block.inputs) {
            // If it's null, the block in this input moved away.
            if (block.inputs[input].block !== null) {
                this.deleteBlock(block.inputs[input].block);
            }
            // Delete obscured shadow blocks.
            if (block.inputs[input].shadow !== null &&
                block.inputs[input].shadow !== block.inputs[input].block) {
                this.deleteBlock(block.inputs[input].shadow);
            }
        }

        // Delete any script starting with this block.
        this._deleteScript(blockId);

        // Delete block itself.
        delete this._blocks[blockId];

        this.resetCache();
    }

    /**
     * Returns a map of all references to variables or lists from blocks
     * in this block container.
     * @param {Array<object>} optBlocks Optional list of blocks to constrain the search to.
     * This is useful for getting variable/list references for a stack of blocks instead
     * of all blocks on the workspace
     * @return {object} A map of variable ID to a list of all variable references
     * for that ID. A variable reference contains the field referencing that variable
     * and also the type of the variable being referenced.
     */
    getAllVariableAndListReferences (optBlocks) {
        const blocks = optBlocks ? optBlocks : this._blocks;
        const allReferences = Object.create(null);
        for (const blockId in blocks) {
            let varOrListField = null;
            let varType = null;
            if (blocks[blockId].fields.VARIABLE) {
                varOrListField = blocks[blockId].fields.VARIABLE;
                varType = Variable.SCALAR_TYPE;
            } else if (blocks[blockId].fields.LIST) {
                varOrListField = blocks[blockId].fields.LIST;
                varType = Variable.LIST_TYPE;
            }
            if (varOrListField) {
                const currVarId = varOrListField.id;
                if (allReferences[currVarId]) {
                    allReferences[currVarId].push({
                        referencingField: varOrListField,
                        type: varType
                    });
                } else {
                    allReferences[currVarId] = [{
                        referencingField: varOrListField,
                        type: varType
                    }];
                }
            }
        }
        return allReferences;
    }

    /**
     * Keep blocks up to date after a variable gets renamed.
     * @param {string} varId The id of the variable that was renamed
     * @param {string} newName The new name of the variable that was renamed
     */
    updateBlocksAfterVarRename (varId, newName) {
        const blocks = this._blocks;
        for (const blockId in blocks) {
            let varOrListField = null;
            if (blocks[blockId].fields.VARIABLE) {
                varOrListField = blocks[blockId].fields.VARIABLE;
            } else if (blocks[blockId].fields.LIST) {
                varOrListField = blocks[blockId].fields.LIST;
            }
            if (varOrListField) {
                const currFieldId = varOrListField.id;
                if (varId === currFieldId) {
                    varOrListField.value = newName;
                }
            }
        }
    }

    /**
     * Keep blocks up to date after they are shared between targets.
     * @param {boolean} isStage If the new target is a stage.
     */
    updateTargetSpecificBlocks (isStage) {
        const blocks = this._blocks;
        for (const blockId in blocks) {
            if (isStage && blocks[blockId].opcode === 'event_whenthisspriteclicked') {
                blocks[blockId].opcode = 'event_whenstageclicked';
            } else if (!isStage && blocks[blockId].opcode === 'event_whenstageclicked') {
                blocks[blockId].opcode = 'event_whenthisspriteclicked';
            }
        }
    }

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
    updateAssetName (oldName, newName, assetType) {
        let getAssetField;
        if (assetType === 'costume') {
            getAssetField = this._getCostumeField.bind(this);
        } else if (assetType === 'sound') {
            getAssetField = this._getSoundField.bind(this);
        } else if (assetType === 'backdrop') {
            getAssetField = this._getBackdropField.bind(this);
        } else if (assetType === 'sprite') {
            getAssetField = this._getSpriteField.bind(this);
        } else {
            return;
        }
        const blocks = this._blocks;
        for (const blockId in blocks) {
            const assetField = getAssetField(blockId);
            if (assetField && assetField.value === oldName) {
                assetField.value = newName;
            }
        }
    }

    /**
     * Helper function to retrieve a costume menu field from a block given its id.
     * @param {string} blockId A unique identifier for a block
     * @return {?object} The costume menu field of the block with the given block id.
     * Null if either a block with the given id doesn't exist or if a costume menu field
     * does not exist on the block with the given id.
     */
    _getCostumeField (blockId) {
        const block = this.getBlock(blockId);
        if (block && block.fields.hasOwnProperty('COSTUME')) {
            return block.fields.COSTUME;
        }
        return null;
    }

    /**
     * Helper function to retrieve a sound menu field from a block given its id.
     * @param {string} blockId A unique identifier for a block
     * @return {?object} The sound menu field of the block with the given block id.
     * Null, if either a block with the given id doesn't exist or if a sound menu field
     * does not exist on the block with the given id.
     */
    _getSoundField (blockId) {
        const block = this.getBlock(blockId);
        if (block && block.fields.hasOwnProperty('SOUND_MENU')) {
            return block.fields.SOUND_MENU;
        }
        return null;
    }

    /**
     * Helper function to retrieve a backdrop menu field from a block given its id.
     * @param {string} blockId A unique identifier for a block
     * @return {?object} The backdrop menu field of the block with the given block id.
     * Null, if either a block with the given id doesn't exist or if a backdrop menu field
     * does not exist on the block with the given id.
     */
    _getBackdropField (blockId) {
        const block = this.getBlock(blockId);
        if (block && block.fields.hasOwnProperty('BACKDROP')) {
            return block.fields.BACKDROP;
        }
        return null;
    }

    /**
     * Helper function to retrieve a sprite menu field from a block given its id.
     * @param {string} blockId A unique identifier for a block
     * @return {?object} The sprite menu field of the block with the given block id.
     * Null, if either a block with the given id doesn't exist or if a sprite menu field
     * does not exist on the block with the given id.
     */
    _getSpriteField (blockId) {
        const block = this.getBlock(blockId);
        if (!block) {
            return null;
        }
        const spriteMenuNames = ['TOWARDS', 'TO', 'OBJECT', 'VIDEOONMENU2',
            'DISTANCETOMENU', 'TOUCHINGOBJECTMENU', 'CLONE_OPTION'];
        for (let i = 0; i < spriteMenuNames.length; i++) {
            const menuName = spriteMenuNames[i];
            if (block.fields.hasOwnProperty(menuName)) {
                return block.fields[menuName];
            }
        }
        return null;
    }

    // ---------------------------------------------------------------------

    /**
     * Encode all of `this._blocks` as an XML string usable
     * by a Blockly/scratch-blocks workspace.
     * @param {object<string, Comment>} comments Map of comments referenced by id
     * @return {string} String of XML representing this object's blocks.
     */
    toXML (comments) {
        return this._scripts.map(script => this.blockToXML(script, comments)).join();
    }

    /**
     * Recursively encode an individual block and its children
     * into a Blockly/scratch-blocks XML string.
     * @param {!string} blockId ID of block to encode.
     * @param {object<string, Comment>} comments Map of comments referenced by id
     * @return {string} String of XML representing this block and any children.
     */
    blockToXML (blockId, comments) {
        const block = this._blocks[blockId];
        // Encode properties of this block.
        const tagName = (block.shadow) ? 'shadow' : 'block';
        let xmlString =
            `<${tagName}
                id="${block.id}"
                type="${block.opcode}"
                ${block.topLevel ? `x="${block.x}" y="${block.y}"` : ''}
            >`;
        const commentId = block.comment;
        if (commentId) {
            if (comments) {
                if (comments.hasOwnProperty(commentId)) {
                    xmlString += comments[commentId].toXML();
                } else {
                    log.warn(`Could not find comment with id: ${commentId} in provided comment descriptions.`);
                }
            } else {
                log.warn(`Cannot serialize comment with id: ${commentId}; no comment descriptions provided.`);
            }
        }
        // Add any mutation. Must come before inputs.
        if (block.mutation) {
            xmlString += this.mutationToXML(block.mutation);
        }
        // Add any inputs on this block.
        for (const input in block.inputs) {
            if (!block.inputs.hasOwnProperty(input)) continue;
            const blockInput = block.inputs[input];
            // Only encode a value tag if the value input is occupied.
            if (blockInput.block || blockInput.shadow) {
                xmlString += `<value name="${blockInput.name}">`;
                if (blockInput.block) {
                    xmlString += this.blockToXML(blockInput.block, comments);
                }
                if (blockInput.shadow && blockInput.shadow !== blockInput.block) {
                    // Obscured shadow.
                    xmlString += this.blockToXML(blockInput.shadow, comments);
                }
                xmlString += '</value>';
            }
        }
        // Add any fields on this block.
        for (const field in block.fields) {
            if (!block.fields.hasOwnProperty(field)) continue;
            const blockField = block.fields[field];
            xmlString += `<field name="${blockField.name}"`;
            const fieldId = blockField.id;
            if (fieldId) {
                xmlString += ` id="${fieldId}"`;
            }
            const varType = blockField.variableType;
            if (typeof varType === 'string') {
                xmlString += ` variabletype="${varType}"`;
            }
            let value = blockField.value;
            if (typeof value === 'string') {
                value = xmlEscape(blockField.value);
            }
            xmlString += `>${value}</field>`;
        }
        // Add blocks connected to the next connection.
        if (block.next) {
            xmlString += `<next>${this.blockToXML(block.next, comments)}</next>`;
        }
        xmlString += `</${tagName}>`;
        return xmlString;
    }

    /**
     * Recursively encode a mutation object to XML.
     * @param {!object} mutation Object representing a mutation.
     * @return {string} XML string representing a mutation.
     */
    mutationToXML (mutation) {
        let mutationString = `<${mutation.tagName}`;
        for (const prop in mutation) {
            if (prop === 'children' || prop === 'tagName') continue;
            const mutationValue = (typeof mutation[prop] === 'string') ?
                xmlEscape(mutation[prop]) : mutation[prop];
            mutationString += ` ${prop}="${mutationValue}"`;
        }
        mutationString += '>';
        for (let i = 0; i < mutation.children.length; i++) {
            mutationString += this.mutationToXML(mutation.children[i]);
        }
        mutationString += `</${mutation.tagName}>`;
        return mutationString;
    }

    // ---------------------------------------------------------------------
    /**
     * Helper to serialize block fields and input fields for reporting new monitors
     * @param {!object} block Block to be paramified.
     * @return {!object} object of param key/values.
     */
    _getBlockParams (block) {
        const params = {};
        for (const key in block.fields) {
            params[key] = block.fields[key].value;
        }
        for (const inputKey in block.inputs) {
            const inputBlock = this._blocks[block.inputs[inputKey].block];
            for (const key in inputBlock.fields) {
                params[key] = inputBlock.fields[key].value;
            }
        }
        return params;
    }

    /**
     * Helper to get the corresponding internal procedure definition block
     * @param {!object} defineBlock Outer define block.
     * @return {!object} internal definition block which has the mutation.
     */
    _getCustomBlockInternal (defineBlock) {
        if (defineBlock.inputs && defineBlock.inputs.custom_block) {
            return this._blocks[defineBlock.inputs.custom_block.block];
        }
    }

    /**
     * Helper to add a stack to `this._scripts`.
     * @param {?string} topBlockId ID of block that starts the script.
     */
    _addScript (topBlockId) {
        const i = this._scripts.indexOf(topBlockId);
        if (i > -1) return; // Already in scripts.
        this._scripts.push(topBlockId);
        // Update `topLevel` property on the top block.
        this._blocks[topBlockId].topLevel = true;
    }

    /**
     * Helper to remove a script from `this._scripts`.
     * @param {?string} topBlockId ID of block that starts the script.
     */
    _deleteScript (topBlockId) {
        const i = this._scripts.indexOf(topBlockId);
        if (i > -1) this._scripts.splice(i, 1);
        // Update `topLevel` property on the top block.
        if (this._blocks[topBlockId]) this._blocks[topBlockId].topLevel = false;
    }
}

/**
 * A private method shared with execute to build an object containing the block
 * information execute needs and that is reset when other cached Blocks info is
 * reset.
 * @param {Blocks} blocks Blocks containing the expected blockId
 * @param {string} blockId blockId for the desired execute cache
 * @param {function} CacheType constructor for cached block information
 * @return {object} execute cache object
 */
BlocksExecuteCache.getCached = function (blocks, blockId, CacheType) {
    let cached = blocks._cache._executeCached[blockId];
    if (typeof cached !== 'undefined') {
        return cached;
    }

    const block = blocks.getBlock(blockId);
    if (typeof block === 'undefined') return null;

    if (typeof CacheType === 'undefined') {
        cached = {
            id: blockId,
            opcode: blocks.getOpcode(block),
            fields: blocks.getFields(block),
            inputs: blocks.getInputs(block),
            mutation: blocks.getMutation(block)
        };
    } else {
        cached = new CacheType(blocks, {
            id: blockId,
            opcode: blocks.getOpcode(block),
            fields: blocks.getFields(block),
            inputs: blocks.getInputs(block),
            mutation: blocks.getMutation(block)
        });
    }

    blocks._cache._executeCached[blockId] = cached;
    return cached;
};

module.exports = Blocks;
