var EventEmitter = require('events');
var util = require('util');

var Primitives = require('./primatives');
var Sequencer = require('./sequencer');
var Thread = require('./thread');

var STEP_THREADS_INTERVAL = 1000 / 30;

/**
 * A simple runtime for blocks.
 */
function Runtime () {
    // Bind event emitter
    EventEmitter.call(instance);

    // Instantiate sequencer and primitives
    this.sequencer = new Sequencer(this);
    this.primitives = new Primitives();

    // State
    this.blocks = {};
    this.stacks = [];
}

/**
 * Inherit from EventEmitter
 */
util.inherits(Runtime, EventEmitter);

Runtime.prototype.createBlock = function (e) {
    // Create new block
    this.blocks[e.id] = {
        id: e.id,
        opcode: e.opcode,
        next: null,
        inputs: {}
    };

    // Push block id to stacks array. New blocks are always a stack even if only
    // momentary. If the new block is added to an existing stack this stack will
    // be removed by the `moveBlock` method below.
    this.stacks.push(e.id);
};

Runtime.prototype.moveBlock = function (e) {
    var _this = this;

    // Block has a new parent
    if (e.oldParent === undefined && e.newParent !== undefined) {
        // Remove stack
        _this._deleteStack(e.id);

        // Update new parent
        if (e.newInput === undefined) {
            _this.blocks[e.newParent].next = e.id;
        } else {
            _this.blocks[e.newParent].inputs[e.newInput] = e.id;
        }
    }

    // Block was removed from parent
    if (e.newParentId === undefined && e.oldParent !== undefined) {
        // Add stack
        _this.stacks.push(e.id);

        // Update old parent
        if (e.oldInput === undefined) {
            _this.blocks[e.oldParent].next = null;
        } else {
            delete _this.blocks[e.oldParent].inputs[e.oldInput];
        }
    }
};

Runtime.prototype.changeBlock = function (e) {
    // @todo
};

Runtime.prototype.deleteBlock = function (e) {
    // @todo Stop threads running on this stack

    // Delete children
    var block = this.blocks[e.id];
    if (block.next !== null) {
        this.deleteBlock({id: block.next});
    }

    // Delete inputs
    for (var i in block.inputs) {
        this.deleteBlock({id: block.inputs[i]});
    }

    // Delete stack
    this._deleteStack(e.id);

    // Delete block
    delete this.blocks[e.id];
};

Runtime.prototype.runAllStacks = function () {
    // @todo
};

Runtime.prototype.runStack = function (e) {
    // @todo
    console.dir(e);
};

Runtime.prototype.stopAllStacks = function () {
    // @todo
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
    return this.blocks[id].inputs['SUBSTACK'];
};

module.exports = Runtime;
