var EventEmitter = require('events');
var util = require('util');

var Runtime = require('./engine/runtime');
var sb2import = require('./import/sb2import');

/**
 * Whether the environment is a WebWorker.
 * @const{boolean}
 */
var ENV_WORKER = typeof importScripts === 'function';

/**
 * Handles connections between blocks, stage, and extensions.
 *
 * @author Andrew Sliwinski <ascii@media.mit.edu>
 */
function VirtualMachine () {
    var instance = this;
    // Bind event emitter and runtime to VM instance
    EventEmitter.call(instance);
    /**
     * VM runtime, to store blocks, I/O devices, sprites/targets, etc.
     * @type {!Runtime}
     */
    instance.runtime = new Runtime();
    /**
     * The "currently editing"/selected target ID for the VM.
     * Block events from any Blockly workspace are routed to this target.
     * @type {!string}
     */
    instance.editingTarget = null;
    // Runtime emits are passed along as VM emits.
    instance.runtime.on(Runtime.SCRIPT_GLOW_ON, function (id) {
        instance.emit(Runtime.SCRIPT_GLOW_ON, {id: id});
    });
    instance.runtime.on(Runtime.SCRIPT_GLOW_OFF, function (id) {
        instance.emit(Runtime.SCRIPT_GLOW_OFF, {id: id});
    });
    instance.runtime.on(Runtime.BLOCK_GLOW_ON, function (id) {
        instance.emit(Runtime.BLOCK_GLOW_ON, {id: id});
    });
    instance.runtime.on(Runtime.BLOCK_GLOW_OFF, function (id) {
        instance.emit(Runtime.BLOCK_GLOW_OFF, {id: id});
    });
    instance.runtime.on(Runtime.VISUAL_REPORT, function (id, value) {
        instance.emit(Runtime.VISUAL_REPORT, {id: id, value: value});
    });
}

/**
 * Inherit from EventEmitter
 */
util.inherits(VirtualMachine, EventEmitter);

/**
 * Start running the VM - do this before anything else.
 */
VirtualMachine.prototype.start = function () {
    this.runtime.start();
};

/**
 * "Green flag" handler - start all threads starting with a green flag.
 */
VirtualMachine.prototype.greenFlag = function () {
    this.runtime.greenFlag();
};

/**
 * Stop all threads and running activities.
 */
VirtualMachine.prototype.stopAll = function () {
    this.runtime.stopAll();
};

/**
 * Get data for playground. Data comes back in an emitted event.
 */
VirtualMachine.prototype.getPlaygroundData = function () {
    this.emit('playgroundData', {
        blocks: this.editingTarget.blocks,
        threads: this.runtime.threads
    });
};

/**
 * Handle an animation frame.
 */
VirtualMachine.prototype.animationFrame = function () {
    this.runtime.animationFrame();
};

/**
 * Post I/O data to the virtual devices.
 * @param {?string} device Name of virtual I/O device.
 * @param {Object} data Any data object to post to the I/O device.
 */
VirtualMachine.prototype.postIOData = function (device, data) {
    if (this.runtime.ioDevices[device]) {
        this.runtime.ioDevices[device].postData(data);
    }
};

/**
 * Load a project from a Scratch 2.0 JSON representation.
 * @param {string} json JSON string representing the project.
 */
VirtualMachine.prototype.loadProject = function (json) {
    // @todo: Handle other formats, e.g., Scratch 1.4, Scratch 3.0.
    sb2import(json, this.runtime);
    // Select the first target for editing, e.g., the stage.
    this.editingTarget = this.runtime.targets[0];
    // Update the VM user's knowledge of targets and blocks on the workspace.
    this.emitTargetsUpdate();
    this.emitWorkspaceUpdate();
    this.runtime.setEditingTarget(this.editingTarget);
};

/**
 * Set an editing target. An editor UI can use this function to switch
 * between editing different targets, sprites, etc.
 * After switching the editing target, the VM may emit updates
 * to the list of targets and any attached workspace blocks
 * (see `emitTargetsUpdate` and `emitWorkspaceUpdate`).
 * @param {string} targetId Id of target to set as editing.
 */
VirtualMachine.prototype.setEditingTarget = function (targetId) {
    // Has the target id changed? If not, exit.
    if (targetId == this.editingTarget.id) {
        return;
    }
    var target = this.runtime.getTargetById(targetId);
    if (target) {
        this.editingTarget = target;
        // Emit appropriate UI updates.
        this.emitTargetsUpdate();
        this.emitWorkspaceUpdate();
        this.runtime.setEditingTarget(target);
    }
};

/**
 * Emit metadata about available targets.
 * An editor UI could use this to display a list of targets and show
 * the currently editing one.
 */
VirtualMachine.prototype.emitTargetsUpdate = function () {
    this.emit('targetsUpdate', {
        // [[target id, human readable target name], ...].
        targetList: this.runtime.targets.map(function(target) {
            return [target.id, target.getName()];
        }),
        // Currently editing target id.
        editingTarget: this.editingTarget.id
    });
};

/**
 * Emit an Blockly/scratch-blocks compatible XML representation
 * of the current editing target's blocks.
 */
VirtualMachine.prototype.emitWorkspaceUpdate = function () {
    this.emit('workspaceUpdate', {
        'xml': this.editingTarget.blocks.toXML()
    });
};

/*
 * Worker handlers: for all public methods available above,
 * we must also provide a message handler in case the VM is run
 * from a worker environment.
 */
if (ENV_WORKER) {
    self.importScripts(
        './node_modules/scratch-render/render-worker.js'
    );
    self.renderer = new self.RenderWebGLWorker();
    self.vmInstance = new VirtualMachine();
    self.onmessage = function (e) {
        var messageData = e.data;
        switch (messageData.method) {
        case 'start':
            self.vmInstance.runtime.start();
            break;
        case 'greenFlag':
            self.vmInstance.runtime.greenFlag();
            break;
        case 'stopAll':
            self.vmInstance.runtime.stopAll();
            break;
        case 'blockListener':
            if (self.vmInstance.editingTarget) {
                self.vmInstance.editingTarget.blocks.blocklyListen(
                    messageData.args,
                    false,
                    self.vmInstance.runtime
                );
            }
            break;
        case 'flyoutBlockListener':
            if (self.vmInstance.editingTarget) {
                self.vmInstance.editingTarget.blocks.blocklyListen(
                    messageData.args,
                    true,
                    self.vmInstance.runtime
                );
            }
            break;
        case 'getPlaygroundData':
            self.postMessage({
                method: 'playgroundData',
                blocks: self.vmInstance.editingTarget.blocks,
                threads: self.vmInstance.runtime.threads
            });
            break;
        case 'animationFrame':
            self.vmInstance.animationFrame();
            break;
        case 'postIOData':
            self.vmInstance.postIOData(messageData.device, messageData.data);
            break;
        case 'setEditingTarget':
            self.vmInstance.setEditingTarget(messageData.targetId);
            break;
        case 'loadProject':
            self.vmInstance.loadProject(messageData.json);
            break;
        default:
            if (e.data.id == 'RendererConnected') {
                //initRenderWorker();
            }
            self.renderer.onmessage(e);
            break;
        }
    };
    // Bind runtime's emitted events to postmessages.
    self.vmInstance.runtime.on(Runtime.SCRIPT_GLOW_ON, function (id) {
        self.postMessage({method: Runtime.SCRIPT_GLOW_ON, id: id});
    });
    self.vmInstance.runtime.on(Runtime.SCRIPT_GLOW_OFF, function (id) {
        self.postMessage({method: Runtime.SCRIPT_GLOW_OFF, id: id});
    });
    self.vmInstance.runtime.on(Runtime.BLOCK_GLOW_ON, function (id) {
        self.postMessage({method: Runtime.BLOCK_GLOW_ON, id: id});
    });
    self.vmInstance.runtime.on(Runtime.BLOCK_GLOW_OFF, function (id) {
        self.postMessage({method: Runtime.BLOCK_GLOW_OFF, id: id});
    });
    self.vmInstance.runtime.on(Runtime.VISUAL_REPORT, function (id, value) {
        self.postMessage({method: Runtime.VISUAL_REPORT, id: id, value: value});
    });
    self.vmInstance.on('workspaceUpdate', function(data) {
        self.postMessage({method: 'workspaceUpdate',
            xml: data.xml
        });
    });
    self.vmInstance.on('targetsUpdate', function(data) {
        self.postMessage({method: 'targetsUpdate',
            targetList: data.targetList,
            editingTarget: data.editingTarget
        });
    });
}

/**
 * Export and bind to `window`
 */
module.exports = VirtualMachine;
if (typeof window !== 'undefined') window.VirtualMachine = module.exports;
