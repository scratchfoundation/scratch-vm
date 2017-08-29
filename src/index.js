const VirtualMachine = require('./virtual-machine');

const CentralDispatch = require('./dispatch/central-dispatch');

global.Scratch = global.Scratch || {};
global.Scratch.dispatch = CentralDispatch;

module.exports = VirtualMachine;
