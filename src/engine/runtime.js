var EventEmitter = require('events');
var Sequencer = require('./sequencer');
var util = require('util');

/**
 * Manages blocks, stacks, threads, and the sequencer.
 */
function Runtime () {
    // Bind event emitter
    EventEmitter.call(this);

    // State for the runtime
    /** @type {Object.<string, Object>} */
    this.blocks = {};
    /** @type {Array.<String>} */
    this.stacks = [];
    /** @type {Array.<Thread>} */
    this.threads = [];

    /** @type {!Sequencer} */
    this.sequencer = new Sequencer();
}

/**
 * Inherit from EventEmitter
 */
util.inherits(Runtime, EventEmitter);

/**
 * Block management: create blocks and stacks from a `create` event
 * @param {!Object} block Blockly create event to be processed
 */
Runtime.prototype.createBlock = function (block) {
    // Create new block
    this.blocks[block.id] = block;

    // Walk each field and add any shadow blocks
    // @todo Expand this to cover vertical / nested blocks
    for (var i in block.fields) {
        var shadows = block.fields[i].blocks;
        for (var y in shadows) {
            var shadow = shadows[y];
            this.blocks[shadow.id] = shadow;
        }
    }

    // Push block id to stacks array. New blocks are always a stack even if only
    // momentary. If the new block is added to an existing stack this stack will
    // be removed by the `moveBlock` method below.
    this.stacks.push(block.id);
};

/**
 * Block management: change block field values
 * @param {!Object} args Blockly change event to be processed
 */
Runtime.prototype.changeBlock = function (args) {
    // Validate
    if (args.element !== 'field') return;
    if (typeof this.blocks[args.id] === 'undefined') return;
    if (typeof this.blocks[args.id].fields[args.name] === 'undefined') return;

    // Update block value
    this.blocks[args.id].fields[args.name].value = args.value;
};

/**
 * Block management: move blocks from parent to parent
 * @param {!Object} e Blockly move event to be processed
 */
Runtime.prototype.moveBlock = function (e) {
    var _this = this;

    // Block has a new parent
    if (e.oldParent === undefined && e.newParent !== undefined) {
        // Remove stack
        _this._deleteStack(e.id);

        // Update new parent
        if (e.newField === undefined) {
            _this.blocks[e.newParent].next = e.id;
        } else {
            _this.blocks[e.newParent].fields[e.newField] = {
                name: e.newField,
                value: e.id,
                blocks: {}
            };
        }
    }

    // Block was removed from parent
    if (e.newParent === undefined && e.oldParent !== undefined) {
        // Add stack
        _this.stacks.push(e.id);

        // Update old parent
        if (e.oldField === undefined) {
            _this.blocks[e.oldParent].next = null;
        } else {
            delete _this.blocks[e.oldParent].fields[e.oldField];
        }
    }
};

/**
 * Block management: delete blocks and their associated stacks
 * @param {!Object} e Blockly delete event to be processed
 */
Runtime.prototype.deleteBlock = function (e) {
    // @todo Stop threads running on this stack

    // Get block
    var block = this.blocks[e.id];

    // Delete children
    if (block.next !== null) {
        this.deleteBlock({id: block.next});
    }

    // Delete substacks and fields
    for (var field in block.fields) {
        if (field === 'SUBSTACK') {
            this.deleteBlock({id: block.fields[field].value});
        } else {
            for (var shadow in block.fields[field].blocks) {
                this.deleteBlock({id: shadow});
            }
        }
    }

    // Delete stack
    this._deleteStack(e.id);

    // Delete block
    delete this.blocks[e.id];
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

/**
 * Helper to remove a stack from `this.stacks`
 * @param {?string} id ID of block that starts the stack
 */
Runtime.prototype._deleteStack = function (id) {
    var i = this.stacks.indexOf(id);
    if (i > -1) this.stacks.splice(i, 1);
};

/**
 * Helper to get the next block for a particular block
 * @param {?string} id ID of block to get the next block for
 * @return {?string} ID of next block in the sequence
 */
Runtime.prototype._getNextBlock = function (id) {
    if (typeof this.blocks[id] === 'undefined') return null;
    return this.blocks[id].next;
};

/**
 * Helper to get the substack for a particular C-shaped block
 * @param {?string} id ID for block to get the substack for
 * @return {?string} ID of block in the substack
 */
Runtime.prototype._getSubstack = function (id) {
    if (typeof this.blocks[id] === 'undefined') return null;
    return this.blocks[id].fields['SUBSTACK'];
};

module.exports = Runtime;
