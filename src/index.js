var EventEmitter = require('events');
var util = require('util');

var Runtime = require('./engine/runtime');
var sb2import = require('./import/sb2import');
var Sprite = require('./sprites/sprite');
var Blocks = require('./engine/blocks');

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

    this.blockListener = this.blockListener.bind(this);
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
 * @param {?string} json JSON string representing the project.
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
 * Temporary way to make an empty project, in case the desired project
 * cannot be loaded from the online server.
 */
VirtualMachine.prototype.createEmptyProject = function () {
    // Stage.
    var blocks2 = new Blocks();
    var stage = new Sprite(blocks2);
    stage.name = 'Stage';
    stage.costumes.push({
        skin: '/assets/stage.png',
        name: 'backdrop1',
        bitmapResolution: 1,
        rotationCenterX: 240,
        rotationCenterY: 180
    });
    var target2 = stage.createClone();
    this.runtime.targets.push(target2);
    target2.x = 0;
    target2.y = 0;
    target2.direction = 90;
    target2.size = 200;
    target2.visible = true;
    target2.isStage = true;
    // Sprite1 (cat).
    var blocks1 = new Blocks();
    var sprite = new Sprite(blocks1);
    sprite.name = 'Sprite1';
    sprite.costumes.push({
        skin: '/assets/scratch_cat.svg',
        name: 'costume1',
        bitmapResolution: 1,
        rotationCenterX: 47,
        rotationCenterY: 55
    });
    var target1 = sprite.createClone();
    this.runtime.targets.push(target1);
    target1.x = 0;
    target1.y = 0;
    target1.direction = 90;
    target1.size = 100;
    target1.visible = true;
    this.editingTarget = this.runtime.targets[0];
    this.emitTargetsUpdate();
    this.emitWorkspaceUpdate();
};

VirtualMachine.prototype.SpriteSave = function () {
    this.blocks = '';
    this.scripts = '';
    this.name = '';
    this.costumes = [];
    this.x = 0;
    this.y = 0;
    this.direction = 0;
    this.size = 0;
    this.visible = false;
    this.isStage = false;
    this.currentCostume = 0;
};

VirtualMachine.prototype.toJSON = function () {
    var Project = [];
    for (i = 0; i < this.runtime.targets.length; i++) {
        var SpriteSave = new this.SpriteSave();
        SpriteSave.blocks = this.runtime.targets[i].sprite.blocks._blocks;
        SpriteSave.scripts = this.runtime.targets[i].sprite.blocks._scripts;
        SpriteSave.name = this.runtime.targets[i].sprite.name;
        SpriteSave.costumes = this.runtime.targets[i].sprite.costumes;
        SpriteSave.x = this.runtime.targets[i].x;
        SpriteSave.y = this.runtime.targets[i].y;
        SpriteSave.isStage = this.runtime.targets[i].isStage;
        SpriteSave.direction = this.runtime.targets[i].direction;
        SpriteSave.size = this.runtime.targets[i].size;
        SpriteSave.visible = this.runtime.targets[i].visible;
        SpriteSave.currentCostume = this.runtime.targets[i].currentCostume;
        Project.push(SpriteSave);
    }
    return JSON.stringify(Project);
};

VirtualMachine.prototype.fromJSON = function (json) {
    var Project = JSON.parse(json);
    var targets = [];
    for (i = 0; i < Project.length; i++) {
        var blocks = new Blocks();
        blocks._blocks = Project[i].blocks;
        blocks._scripts = Project[i].scripts;
        var sprite = new Sprite(blocks);
        sprite.name = Project[i].name;
        sprite.costumes = Project[i].costumes;
        var target = sprite.createClone();
        target.x = Project[i].x;
        target.y = Project[i].y;
        target.direction = Project[i].direction;
        target.size = Project[i].size;
        target.visible = Project[i].visible;
        targets.push(target);
    }
    this.runtime.targets = targets;
    this.editingTarget = this.runtime.targets[0];
    this.emitTargetsUpdate();
    this.emitWorkspaceUpdate();
};

/**
 * Handle a Blockly event for the current editing target.
 * @param {!Blockly.Event} e Any Blockly event.
 */
VirtualMachine.prototype.blockListener = function (e) {
    if (this.editingTarget) {
        this.editingTarget.blocks.blocklyListen(
            e,
            false,
            this.runtime
        );
    }
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
/**
 * Export and bind to `window`
 */
module.exports = VirtualMachine;
if (typeof window !== 'undefined') window.VirtualMachine = module.exports;
