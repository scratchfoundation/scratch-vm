var EventEmitter = require('events');
var util = require('util');

/**
 * A simple runtime for blocks.
 */
function Runtime () {
    // Bind event emitter
    EventEmitter.call(this);

    // State
    this.blocks = {};
    this.stacks = [];
}

/**
 * Inherit from EventEmitter
 */
util.inherits(Runtime, EventEmitter);

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

Runtime.prototype.changeBlock = function (args) {
    // Validate
    if (args.element !== 'field') return;
    if (typeof this.blocks[args.id] === 'undefined') return;
    if (typeof this.blocks[args.id].fields[args.name] === 'undefined') return;

    // Update block value
    this.blocks[args.id].fields[args.name].value = args.value;
};

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

Runtime.prototype._deleteStack = function (id) {
    var i = this.stacks.indexOf(id);
    if (i > -1) this.stacks.splice(i, 1);
};

Runtime.prototype._getNextBlock = function (id) {
    if (typeof this.blocks[id] === 'undefined') return null;
    return this.blocks[id].next;
};

Runtime.prototype._getSubstack = function (id) {
    if (typeof this.blocks[id] === 'undefined') return null;
    return this.blocks[id].fields['SUBSTACK'];
};

module.exports = Runtime;
