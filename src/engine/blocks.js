const adapter = require('./adapter');
const mutationAdapter = require('./mutation-adapter');
const xmlEscape = require('../util/xml-escape');
const MonitorRecord = require('./monitor-record');

/**
 * @fileoverview
 * Store and mutate the VM block representation,
 * and handle updates from Scratch Blocks events.
 */

class Blocks {
    constructor () {
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
     * @return {!object} All non-branch inputs and their associated blocks.
     */
    getInputs (block) {
        if (typeof block === 'undefined') return null;
        const inputs = {};
        for (const input in block.inputs) {
            // Ignore blocks prefixed with branch prefix.
            if (input.substring(0, Blocks.BRANCH_INPUT_PREFIX.length) !==
                Blocks.BRANCH_INPUT_PREFIX) {
                inputs[input] = block.inputs[input];
            }
        }
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
        for (const id in this._blocks) {
            if (!this._blocks.hasOwnProperty(id)) continue;
            const block = this._blocks[id];
            if ((block.opcode === 'procedures_defnoreturn' ||
                block.opcode === 'procedures_defreturn') &&
                block.mutation.proccode === name) {
                return id;
            }
        }
        return null;
    }

    /**
     * Get the procedure definition for a given name.
     * @param {?string} name Name of procedure to query.
     * @return {?string} ID of procedure definition.
     */
    getProcedureParamNames (name) {
        for (const id in this._blocks) {
            if (!this._blocks.hasOwnProperty(id)) continue;
            const block = this._blocks[id];
            if ((block.opcode === 'procedures_defnoreturn' ||
                block.opcode === 'procedures_defreturn') &&
                block.mutation.proccode === name) {
                return JSON.parse(block.mutation.argumentnames);
            }
        }
        return null;
    }

    // ---------------------------------------------------------------------

    /**
     * Create event listener for blocks and variables. Handles validation and
     * serves as a generic adapter between the blocks, variables, and the
     * runtime interface.
     * @param {object} e Blockly "block" or "variable" event
     * @param {?Runtime} optRuntime Optional runtime to forward click events to.
     */
    blocklyListen (e, optRuntime) {
        // Validate event
        if (typeof e !== 'object') return;
        if (typeof e.blockId !== 'string' && typeof e.varId !== 'string') {
            return;
        }
        const stage = optRuntime.getTargetForStage();

        // UI event: clicked scripts toggle in the runtime.
        if (e.element === 'stackclick') {
            if (optRuntime) {
                optRuntime.toggleScript(e.blockId, {showVisualReport: true});
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
            this.deleteBlock({
                id: e.blockId
            });
            break;
        case 'var_create':
            stage.createVariable(e.varId, e.varName);
            break;
        case 'var_rename':
            stage.renameVariable(e.varId, e.newName);
            break;
        case 'var_delete':
            stage.deleteVariable(e.varId);
            break;
        }
    }

    // ---------------------------------------------------------------------

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
            if (args.name === 'VARIABLE') {
                // Get variable name using the id in args.value.
                const variable = optRuntime.getEditingTarget().lookupVariableById(args.value);
                if (variable) {
                    block.fields[args.name].value = variable.name;
                    block.fields[args.name].id = args.value;
                }
            } else {
                block.fields[args.name].value = args.value;
            }
            break;
        case 'mutation':
            block.mutation = mutationAdapter(args.value);
            break;
        case 'checkbox':
            block.isMonitored = args.value;
            if (optRuntime && wasMonitored && !block.isMonitored) {
                optRuntime.requestRemoveMonitor(block.id);
            } else if (optRuntime && !wasMonitored && block.isMonitored) {
                optRuntime.requestAddMonitor(MonitorRecord({
                    // @todo(vm#564) this will collide if multiple sprites use same block
                    id: block.id,
                    opcode: block.opcode,
                    params: this._getBlockParams(block),
                    // @todo(vm#565) for numerical values with decimals, some countries use comma
                    value: ''
                }));
            }
            break;
        }
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
    }


    /**
     * Block management: run all blocks.
     * @param {!object} runtime Runtime to run all blocks in.
     */
    runAllMonitored (runtime) {
        Object.keys(this._blocks).forEach(blockId => {
            if (this.getBlock(blockId).isMonitored) {
                // @todo handle specific targets (e.g. apple x position)
                runtime.toggleScript(blockId, {updateMonitor: true});
            }
        });
    }

    /**
     * Block management: delete blocks and their associated scripts.
     * @param {!object} e Blockly delete event to be processed.
     */
    deleteBlock (e) {
        // @todo In runtime, stop threads running on this script.

        // Get block
        const block = this._blocks[e.id];

        // Delete children
        if (block.next !== null) {
            this.deleteBlock({id: block.next});
        }

        // Delete inputs (including branches)
        for (const input in block.inputs) {
            // If it's null, the block in this input moved away.
            if (block.inputs[input].block !== null) {
                this.deleteBlock({id: block.inputs[input].block});
            }
            // Delete obscured shadow blocks.
            if (block.inputs[input].shadow !== null &&
                block.inputs[input].shadow !== block.inputs[input].block) {
                this.deleteBlock({id: block.inputs[input].shadow});
            }
        }

        // Delete any script starting with this block.
        this._deleteScript(e.id);

        // Delete block itself.
        delete this._blocks[e.id];
    }

    // ---------------------------------------------------------------------

    /**
     * Encode all of `this._blocks` as an XML string usable
     * by a Blockly/scratch-blocks workspace.
     * @return {string} String of XML representing this object's blocks.
     */
    toXML () {
        return this._scripts.map(script => this.blockToXML(script)).join();
    }

    /**
     * Recursively encode an individual block and its children
     * into a Blockly/scratch-blocks XML string.
     * @param {!string} blockId ID of block to encode.
     * @return {string} String of XML representing this block and any children.
     */
    blockToXML (blockId) {
        const block = this._blocks[blockId];
        // Encode properties of this block.
        const tagName = (block.shadow) ? 'shadow' : 'block';
        let xmlString =
            `<${tagName}
                id="${block.id}"
                type="${block.opcode}"
                ${block.topLevel ?
                    `x="${block.x}" y="${block.y}"` :
                    ''
                }
            >`;
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
                    xmlString += this.blockToXML(blockInput.block);
                }
                if (blockInput.shadow && blockInput.shadow !== blockInput.block) {
                    // Obscured shadow.
                    xmlString += this.blockToXML(blockInput.shadow);
                }
                xmlString += '</value>';
            }
        }
        // Add any fields on this block.
        for (const field in block.fields) {
            if (!block.fields.hasOwnProperty(field)) continue;
            const blockField = block.fields[field];
            let value = blockField.value;
            if (typeof value === 'string') {
                value = xmlEscape(blockField.value);
            }
            xmlString += `<field name="${blockField.name}">${value}</field>`;
        }
        // Add blocks connected to the next connection.
        if (block.next) {
            xmlString += `<next>${this.blockToXML(block.next)}</next>`;
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

module.exports = Blocks;
