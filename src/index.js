const VirtualMachine = require('./virtual-machine');

const CentralDispatch = require('./dispatch/central-dispatch');
const ExtensionManager = require('./extension-support/extension-manager');

global.Scratch = global.Scratch || {};
global.Scratch.dispatch = CentralDispatch;
global.Scratch.extensions = new ExtensionManager();

module.exports = VirtualMachine;
