var events = require('events');
var util = require('util');

/**
 * Simulates event emitter / listener patterns from Scratch Blocks.
 *
 * @author Andrew Sliwinski <ascii@media.mit.edu>
 */
function Blocks () {

}

/**
 * Inherit from EventEmitter to enable messaging.
 */
util.inherits(VirtualMachine, events.EventEmitter);

Blocks.prototype.spaghetti = function () {
    this.emit('');
};

Blocks.prototype.spam = function () {
    this.emit('');
};

module.exports = Blocks;
