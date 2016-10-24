var adapter = require('./adapter');
var mutationAdapter = require('./mutation-adapter');
var xmlEscape = require('../util/xml-escape');

/**
 * @fileoverview
 * Store and mutate the VM block representation,
 * and handle updates from Scratch Blocks events.
 */

var Blocks = function () {
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
};

/**
 * Blockly inputs that represent statements/branch.
 * are prefixed with this string.
 * @const{string}
 */
Blocks.BRANCH_INPUT_PREFIX = 'SUBSTACK';

/**
 * Provide an object with metadata for the requested block ID.
 * @param {!string} blockId ID of block we have stored.
 * @return {?Object} Metadata about the block, if it exists.
 */
Blocks.prototype.getBlock = function (blockId) {
    return this._blocks[blockId];
};

/**
 * Get all known top-level blocks that start scripts.
 * @return {Array.<string>} List of block IDs.
 */
Blocks.prototype.getScripts = function () {
    return this._scripts;
};

 /**
  * Get the next block for a particular block
  * @param {?string} id ID of block to get the next block for
  * @return {?string} ID of next block in the sequence
  */
Blocks.prototype.getNextBlock = function (id) {
    if (typeof this._blocks[id] === 'undefined') return null;
    return this._blocks[id].next;
};

/**
 * Get the branch for a particular C-shaped block.
 * @param {?string} id ID for block to get the branch for.
 * @param {?number} branchNum Which branch to select (e.g. for if-else).
 * @return {?string} ID of block in the branch.
 */
Blocks.prototype.getBranch = function (id, branchNum) {
    var block = this._blocks[id];
    if (typeof block === 'undefined') return null;
    if (!branchNum) branchNum = 1;

    var inputName = Blocks.BRANCH_INPUT_PREFIX;
    if (branchNum > 1) {
        inputName += branchNum;
    }

    // Empty C-block?
    if (!(inputName in block.inputs)) return null;
    return block.inputs[inputName].block;
};

/**
 * Get the opcode for a particular block
 * @param {?string} id ID of block to query
 * @return {?string} the opcode corresponding to that block
 */
Blocks.prototype.getOpcode = function (id) {
    if (typeof this._blocks[id] === 'undefined') return null;
    return this._blocks[id].opcode;
};

/**
 * Get all fields and their values for a block.
 * @param {?string} id ID of block to query.
 * @return {!Object} All fields and their values.
 */
Blocks.prototype.getFields = function (id) {
    if (typeof this._blocks[id] === 'undefined') return null;
    return this._blocks[id].fields;
};

/**
 * Get all non-branch inputs for a block.
 * @param {?string} id ID of block to query.
 * @return {!Object} All non-branch inputs and their associated blocks.
 */
Blocks.prototype.getInputs = function (id) {
    if (typeof this._blocks[id] === 'undefined') return null;
    var inputs = {};
    for (var input in this._blocks[id].inputs) {
        // Ignore blocks prefixed with branch prefix.
        if (input.substring(0, Blocks.BRANCH_INPUT_PREFIX.length) !==
            Blocks.BRANCH_INPUT_PREFIX) {
            inputs[input] = this._blocks[id].inputs[input];
        }
    }
    return inputs;
};

/**
 * Get mutation data for a block.
 * @param {?string} id ID of block to query.
 * @return {!Object} Mutation for the block.
 */
Blocks.prototype.getMutation = function (id) {
    if (typeof this._blocks[id] === 'undefined') return null;
    return this._blocks[id].mutation;
};

/**
 * Get the top-level script for a given block.
 * @param {?string} id ID of block to query.
 * @return {?string} ID of top-level script block.
 */
Blocks.prototype.getTopLevelScript = function (id) {
    if (typeof this._blocks[id] === 'undefined') return null;
    var block = this._blocks[id];
    while (block.parent !== null) {
        block = this._blocks[block.parent];
    }
    return block.id;
};

/**
 * Get the procedure definition for a given name.
 * @param {?string} name Name of procedure to query.
 * @return {?string} ID of procedure definition.
 */
Blocks.prototype.getProcedureDefinition = function (name) {
    for (var id in this._blocks) {
        var block = this._blocks[id];
        if ((block.opcode === 'procedures_defnoreturn' ||
            block.opcode === 'procedures_defreturn') &&
            block.mutation.proccode === name) {
            return id;
        }
    }
    return null;
};

/**
 * Get the procedure definition for a given name.
 * @param {?string} name Name of procedure to query.
 * @return {?string} ID of procedure definition.
 */
Blocks.prototype.getProcedureParamNames = function (name) {
    for (var id in this._blocks) {
        var block = this._blocks[id];
        if ((block.opcode === 'procedures_defnoreturn' ||
            block.opcode === 'procedures_defreturn') &&
            block.mutation.proccode === name) {
            return JSON.parse(block.mutation.argumentnames);
        }
    }
    return null;
};

// ---------------------------------------------------------------------

/**
 * Create event listener for blocks. Handles validation and serves as a generic
 * adapter between the blocks and the runtime interface.
 * @param {Object} e Blockly "block" event
 * @param {?Runtime} optRuntime Optional runtime to forward click events to.
 */

Blocks.prototype.blocklyListen = function (e, optRuntime) {
    // Validate event
    if (typeof e !== 'object') return;
    if (typeof e.blockId !== 'string') return;

    // UI event: clicked scripts toggle in the runtime.
    if (e.element === 'stackclick') {
        if (optRuntime) {
            optRuntime.toggleScript(e.blockId);
        }
        return;
    }

    // Block create/update/destroy
    switch (e.type) {
    case 'create':
        var newBlocks = adapter(e);
        // A create event can create many blocks. Add them all.
        for (var i = 0; i < newBlocks.length; i++) {
            this.createBlock(newBlocks[i]);
        }
        break;
    case 'change':
        this.changeBlock({
            id: e.blockId,
            element: e.element,
            name: e.name,
            value: e.newValue
        });
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
    }
};

// ---------------------------------------------------------------------

/**
 * Block management: create blocks and scripts from a `create` event
 * @param {!Object} block Blockly create event to be processed
 */
Blocks.prototype.createBlock = function (block) {
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
};

/**
 * Block management: change block field values
 * @param {!Object} args Blockly change event to be processed
 */
Blocks.prototype.changeBlock = function (args) {
    // Validate
    if (args.element !== 'field' && args.element !== 'mutation') return;
    if (typeof this._blocks[args.id] === 'undefined') return;

    if (args.element === 'field') {
        // Update block value
        if (!this._blocks[args.id].fields[args.name]) return;
        this._blocks[args.id].fields[args.name].value = args.value;
    } else if (args.element === 'mutation') {
        this._blocks[args.id].mutation = mutationAdapter(args.value);
    }
};

/**
 * Block management: move blocks from parent to parent
 * @param {!Object} e Blockly move event to be processed
 */
Blocks.prototype.moveBlock = function (e) {
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
        var oldParent = this._blocks[e.oldParent];
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
            var oldShadow = null;
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
};

/**
 * Block management: delete blocks and their associated scripts.
 * @param {!Object} e Blockly delete event to be processed.
 */
Blocks.prototype.deleteBlock = function (e) {
    // @todo In runtime, stop threads running on this script.

    // Get block
    var block = this._blocks[e.id];

    // Delete children
    if (block.next !== null) {
        this.deleteBlock({id: block.next});
    }

    // Delete inputs (including branches)
    for (var input in block.inputs) {
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
};

// ---------------------------------------------------------------------

/**
 * Encode all of `this._blocks` as an XML string usable
 * by a Blockly/scratch-blocks workspace.
 * @return {string} String of XML representing this object's blocks.
 */
Blocks.prototype.toXML = function () {
    var xmlString = '<xml xmlns="http://www.w3.org/1999/xhtml">';
    for (var i = 0; i < this._scripts.length; i++) {
        xmlString += this.blockToXML(this._scripts[i]);
    }
    return xmlString + '</xml>';
};

/**
 * Recursively encode an individual block and its children
 * into a Blockly/scratch-blocks XML string.
 * @param {!string} blockId ID of block to encode.
 * @return {string} String of XML representing this block and any children.
 */
Blocks.prototype.blockToXML = function (blockId) {
    var block = this._blocks[blockId];
    // Encode properties of this block.
    var tagName = (block.shadow) ? 'shadow' : 'block';
    var xy = (block.topLevel) ?
        ' x="' + block.x + '" y="' + block.y + '"' :
        '';
    var xmlString = '';
    xmlString += '<' + tagName +
        ' id="' + block.id + '"' +
        ' type="' + block.opcode + '"' +
        xy +
        '>';
    // Add any mutation. Must come before inputs.
    if (block.mutation) {
        xmlString += this.mutationToXML(block.mutation);
    }
    // Add any inputs on this block.
    for (var input in block.inputs) {
        var blockInput = block.inputs[input];
        // Only encode a value tag if the value input is occupied.
        if (blockInput.block || blockInput.shadow) {
            xmlString += '<value name="' + blockInput.name + '">';
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
    for (var field in block.fields) {
        var blockField = block.fields[field];
        var value = blockField.value;
        if (typeof value === 'string') {
            value = xmlEscape(blockField.value);
        }
        xmlString += '<field name="' + blockField.name + '">' +
            value + '</field>';
    }
    // Add blocks connected to the next connection.
    if (block.next) {
        xmlString += '<next>' + this.blockToXML(block.next) + '</next>';
    }
    xmlString += '</' + tagName + '>';
    return xmlString;
};

/**
 * Recursively encode a mutation object to XML.
 * @param {!Object} mutation Object representing a mutation.
 * @return {string} XML string representing a mutation.
 */
Blocks.prototype.mutationToXML = function (mutation) {
    var mutationString = '<' + mutation.tagName;
    for (var prop in mutation) {
        if (prop === 'children' || prop === 'tagName') continue;
        var mutationValue = (typeof mutation[prop] === 'string') ?
            xmlEscape(mutation[prop]) : mutation[prop];
        mutationString += ' ' + prop + '="' + mutationValue + '"';
    }
    mutationString += '>';
    for (var i = 0; i < mutation.children.length; i++) {
        mutationString += this.mutationToXML(mutation.children[i]);
    }
    mutationString += '</' + mutation.tagName + '>';
    return mutationString;
};

// ---------------------------------------------------------------------

/**
 * Helper to add a stack to `this._scripts`.
 * @param {?string} topBlockId ID of block that starts the script.
 */
Blocks.prototype._addScript = function (topBlockId) {
    var i = this._scripts.indexOf(topBlockId);
    if (i > -1) return; // Already in scripts.
    this._scripts.push(topBlockId);
    // Update `topLevel` property on the top block.
    this._blocks[topBlockId].topLevel = true;
};

/**
 * Helper to remove a script from `this._scripts`.
 * @param {?string} topBlockId ID of block that starts the script.
 */
Blocks.prototype._deleteScript = function (topBlockId) {
    var i = this._scripts.indexOf(topBlockId);
    if (i > -1) this._scripts.splice(i, 1);
    // Update `topLevel` property on the top block.
    if (this._blocks[topBlockId]) this._blocks[topBlockId].topLevel = false;
};

module.exports = Blocks;
