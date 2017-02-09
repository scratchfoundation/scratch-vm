var EventEmitter = require('events');
var Sequencer = require('./sequencer');
var Blocks = require('./blocks');
var Thread = require('./thread');
var util = require('util');

// Virtual I/O devices.
var Clock = require('../io/clock');
var Keyboard = require('../io/keyboard');
var Mouse = require('../io/mouse');

var defaultBlockPackages = {
    scratch3_control: require('../blocks/scratch3_control'),
    scratch3_event: require('../blocks/scratch3_event'),
    scratch3_looks: require('../blocks/scratch3_looks'),
    scratch3_motion: require('../blocks/scratch3_motion'),
    scratch3_operators: require('../blocks/scratch3_operators'),
    scratch3_pen: require('../blocks/scratch3_pen'),
    scratch3_sound: require('../blocks/scratch3_sound'),
    scratch3_sensing: require('../blocks/scratch3_sensing'),
    scratch3_data: require('../blocks/scratch3_data'),
    scratch3_procedures: require('../blocks/scratch3_procedures')
};

/**
 * Manages targets, scripts, and the sequencer.
 * @constructor
 */
var Runtime = function () {
    // Bind event emitter
    EventEmitter.call(this);

    /**
     * Target management and storage.
     * @type {Array.<!Target>}
     */
    this.targets = [];

    /**
     * A list of threads that are currently running in the VM.
     * Threads are added when execution starts and pruned when execution ends.
     * @type {Array.<Thread>}
     */
    this.threads = [];

    /** @type {!Sequencer} */
    this.sequencer = new Sequencer(this);

    /**
     * Storage container for flyout blocks.
     * These will execute on `_editingTarget.`
     * @type {!Blocks}
     */
    this.flyoutBlocks = new Blocks();

    /**
     * Currently known editing target for the VM.
     * @type {?Target}
     */
    this._editingTarget = null;

    /**
     * Map to look up a block primitive's implementation function by its opcode.
     * This is a two-step lookup: package name first, then primitive name.
     * @type {Object.<string, Function>}
     */
    this._primitives = {};

    /**
     * Map to look up hat blocks' metadata.
     * Keys are opcode for hat, values are metadata objects.
     * @type {Object.<string, Object>}
     */
    this._hats = {};

    /**
     * Currently known values for edge-activated hats.
     * Keys are block ID for the hat; values are the currently known values.
     * @type {Object.<string, *>}
     */
    this._edgeActivatedHatValues = {};

    /**
     * A list of script block IDs that were glowing during the previous frame.
     * @type {!Array.<!string>}
     */
    this._scriptGlowsPreviousFrame = [];

    /**
     * Number of threads running during the previous frame
     * @type {number}
     */
    this._threadCount = 0;

    /**
     * Currently known number of clones, used to enforce clone limit.
     * @type {number}
     */
    this._cloneCounter = 0;

    /**
     * Whether the project is in "turbo mode."
     * @type {Boolean}
     */
    this.turboMode = false;

    /**
     * Whether the project is in "compatibility mode" (30 TPS).
     * @type {Boolean}
     */
    this.compatibilityMode = false;

    /**
     * A reference to the current runtime stepping interval, set
     * by a `setInterval`.
     * @type {!number}
     */
    this._steppingInterval = null;

    /**
     * Current length of a step.
     * Changes as mode switches, and used by the sequencer to calculate
     * WORK_TIME.
     * @type {!number}
     */
    this.currentStepTime = null;

    /**
     * Whether any primitive has requested a redraw.
     * Affects whether `Sequencer.stepThreads` will yield
     * after stepping each thread.
     * Reset on every frame.
     * @type {boolean}
     */
    this.redrawRequested = false;

    // Register all given block packages.
    this._registerBlockPackages();

    // Register and initialize "IO devices", containers for processing
    // I/O related data.
    /** @type {Object.<string, Object>} */
    this.ioDevices = {
        clock: new Clock(),
        keyboard: new Keyboard(this),
        mouse: new Mouse(this)
    };
};

/**
 * Inherit from EventEmitter
 */
util.inherits(Runtime, EventEmitter);

/**
 * Width of the stage, in pixels.
 * @const {number}
 */
Runtime.STAGE_WIDTH = 480;

/**
 * Height of the stage, in pixels.
 * @const {number}
 */
Runtime.STAGE_HEIGHT = 360;

/**
 * Event name for glowing a script.
 * @const {string}
 */
Runtime.SCRIPT_GLOW_ON = 'SCRIPT_GLOW_ON';

/**
 * Event name for unglowing a script.
 * @const {string}
 */
Runtime.SCRIPT_GLOW_OFF = 'SCRIPT_GLOW_OFF';

/**
 * Event name for glowing a block.
 * @const {string}
 */
Runtime.BLOCK_GLOW_ON = 'BLOCK_GLOW_ON';

/**
 * Event name for unglowing a block.
 * @const {string}
 */
Runtime.BLOCK_GLOW_OFF = 'BLOCK_GLOW_OFF';

/**
 * Event name for glowing the green flag
 * @const {string}
 */
Runtime.PROJECT_RUN_START = 'PROJECT_RUN_START';

/**
 * Event name for unglowing the green flag
 * @const {string}
 */
Runtime.PROJECT_RUN_STOP = 'PROJECT_RUN_STOP';

/**
 * Event name for visual value report.
 * @const {string}
 */
Runtime.VISUAL_REPORT = 'VISUAL_REPORT';

/**
 * Event name for sprite info report.
 * @const {string}
 */
Runtime.SPRITE_INFO_REPORT = 'SPRITE_INFO_REPORT';

/**
 * How rapidly we try to step threads by default, in ms.
 */
Runtime.THREAD_STEP_INTERVAL = 1000 / 60;

/**
 * In compatibility mode, how rapidly we try to step threads, in ms.
 */
Runtime.THREAD_STEP_INTERVAL_COMPATIBILITY = 1000 / 30;

/**
 * How many clones can be created at a time.
 * @const {number}
 */
Runtime.MAX_CLONES = 300;

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

/**
 * Register default block packages with this runtime.
 * @todo Prefix opcodes with package name.
 * @private
 */
Runtime.prototype._registerBlockPackages = function () {
    for (var packageName in defaultBlockPackages) {
        if (defaultBlockPackages.hasOwnProperty(packageName)) {
            // @todo pass a different runtime depending on package privilege?
            var packageObject = new (defaultBlockPackages[packageName])(this);
            // Collect primitives from package.
            if (packageObject.getPrimitives) {
                var packagePrimitives = packageObject.getPrimitives();
                for (var op in packagePrimitives) {
                    if (packagePrimitives.hasOwnProperty(op)) {
                        this._primitives[op] =
                            packagePrimitives[op].bind(packageObject);
                    }
                }
            }
            // Collect hat metadata from package.
            if (packageObject.getHats) {
                var packageHats = packageObject.getHats();
                for (var hatName in packageHats) {
                    if (packageHats.hasOwnProperty(hatName)) {
                        this._hats[hatName] = packageHats[hatName];
                    }
                }
            }
        }
    }
};

/**
 * Retrieve the function associated with the given opcode.
 * @param {!string} opcode The opcode to look up.
 * @return {Function} The function which implements the opcode.
 */
Runtime.prototype.getOpcodeFunction = function (opcode) {
    return this._primitives[opcode];
};

/**
 * Return whether an opcode represents a hat block.
 * @param {!string} opcode The opcode to look up.
 * @return {boolean} True if the op is known to be a hat.
 */
Runtime.prototype.getIsHat = function (opcode) {
    return this._hats.hasOwnProperty(opcode);
};

/**
 * Return whether an opcode represents an edge-activated hat block.
 * @param {!string} opcode The opcode to look up.
 * @return {boolean} True if the op is known to be a edge-activated hat.
 */
Runtime.prototype.getIsEdgeActivatedHat = function (opcode) {
    return this._hats.hasOwnProperty(opcode) &&
        this._hats[opcode].edgeActivated;
};

/**
 * Update an edge-activated hat block value.
 * @param {!string} blockId ID of hat to store value for.
 * @param {*} newValue Value to store for edge-activated hat.
 * @return {*} The old value for the edge-activated hat.
 */
Runtime.prototype.updateEdgeActivatedValue = function (blockId, newValue) {
    var oldValue = this._edgeActivatedHatValues[blockId];
    this._edgeActivatedHatValues[blockId] = newValue;
    return oldValue;
};

/**
 * Clear all edge-activaed hat values.
 */
Runtime.prototype.clearEdgeActivatedValues = function () {
    this._edgeActivatedHatValues = {};
};

/**
 * Attach the renderer
 * @param {!RenderWebGL} renderer The renderer to attach
 */
Runtime.prototype.attachRenderer = function (renderer) {
    this.renderer = renderer;
};

/**
 * Attach the audio engine
 * @param {!AudioEngine} audioEngine The audio engine to attach
 */
Runtime.prototype.attachAudioEngine = function (audioEngine) {
    this.audioEngine = audioEngine;
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

/**
 * Create a thread and push it to the list of threads.
 * @param {!string} id ID of block that starts the stack.
 * @param {!Target} target Target to run thread on.
 * @return {!Thread} The newly created thread.
 */
Runtime.prototype._pushThread = function (id, target) {
    var thread = new Thread(id);
    thread.target = target;
    thread.pushStack(id);
    this.threads.push(thread);
    return thread;
};

/**
 * Remove a thread from the list of threads.
 * @param {?Thread} thread Thread object to remove from actives
 */
Runtime.prototype._removeThread = function (thread) {
    // Inform sequencer to stop executing that thread.
    this.sequencer.retireThread(thread);
    // Remove from the list.
    var i = this.threads.indexOf(thread);
    if (i > -1) {
        this.threads.splice(i, 1);
    }
};

/**
 * Restart a thread in place, maintaining its position in the list of threads.
 * This is used by `startHats` to and is necessary to ensure 2.0-like execution order.
 * Test project: https://scratch.mit.edu/projects/130183108/
 * @param {!Thread} thread Thread object to restart.
 */
Runtime.prototype._restartThread = function (thread) {
    var newThread = new Thread(thread.topBlock);
    newThread.target = thread.target;
    newThread.pushStack(thread.topBlock);
    var i = this.threads.indexOf(thread);
    if (i > -1) {
        this.threads[i] = newThread;
    } else {
        this.threads.push(thread);
    }
};

/**
 * Return whether a thread is currently active/running.
 * @param {?Thread} thread Thread object to check.
 * @return {boolean} True if the thread is active/running.
 */
Runtime.prototype.isActiveThread = function (thread) {
    return this.threads.indexOf(thread) > -1;
};

/**
 * Toggle a script.
 * @param {!string} topBlockId ID of block that starts the script.
 */
Runtime.prototype.toggleScript = function (topBlockId) {
    // Remove any existing thread.
    for (var i = 0; i < this.threads.length; i++) {
        if (this.threads[i].topBlock === topBlockId) {
            this._removeThread(this.threads[i]);
            return;
        }
    }
    // Otherwise add it.
    this._pushThread(topBlockId, this._editingTarget);
};

/**
 * Run a function `f` for all scripts in a workspace.
 * `f` will be called with two parameters:
 *  - the top block ID of the script.
 *  - the target that owns the script.
 * @param {!Function} f Function to call for each script.
 * @param {Target=} optTarget Optionally, a target to restrict to.
 */
Runtime.prototype.allScriptsDo = function (f, optTarget) {
    var targets = this.targets;
    if (optTarget) {
        targets = [optTarget];
    }
    for (var t = 0; t < targets.length; t++) {
        var target = targets[t];
        var scripts = target.blocks.getScripts();
        for (var j = 0; j < scripts.length; j++) {
            var topBlockId = scripts[j];
            f(topBlockId, target);
        }
    }
};

/**
 * Start all relevant hats.
 * @param {!string} requestedHatOpcode Opcode of hats to start.
 * @param {object=} optMatchFields Optionally, fields to match on the hat.
 * @param {Target=} optTarget Optionally, a target to restrict to.
 * @return {Array.<Thread>} List of threads started by this function.
 */
Runtime.prototype.startHats = function (requestedHatOpcode,
    optMatchFields, optTarget) {
    if (!this._hats.hasOwnProperty(requestedHatOpcode)) {
        // No known hat with this opcode.
        return;
    }
    var instance = this;
    var newThreads = [];

    for (var opts in optMatchFields) {
        optMatchFields[opts] = optMatchFields[opts].toUpperCase();
    }

    // Consider all scripts, looking for hats with opcode `requestedHatOpcode`.
    this.allScriptsDo(function (topBlockId, target) {
        var potentialHatOpcode = target.blocks.getBlock(topBlockId).opcode;
        if (potentialHatOpcode !== requestedHatOpcode) {
            // Not the right hat.
            return;
        }

        // Match any requested fields.
        // For example: ensures that broadcasts match.
        // This needs to happen before the block is evaluated
        // (i.e., before the predicate can be run) because "broadcast and wait"
        // needs to have a precise collection of started threads.
        var hatFields = target.blocks.getFields(topBlockId);

        // If no fields are present, check inputs (horizontal blocks)
        if (Object.keys(hatFields).length === 0) {
            var hatInputs = target.blocks.getInputs(topBlockId);
            for (var input in hatInputs) {
                var id = hatInputs[input].block;
                var fields = target.blocks.getFields(id);
                hatFields = Object.assign(fields, hatFields);
            }
        }

        if (optMatchFields) {
            for (var matchField in optMatchFields) {
                if (hatFields[matchField].value.toUpperCase() !==
                    optMatchFields[matchField]) {
                    // Field mismatch.
                    return;
                }
            }
        }

        // Look up metadata for the relevant hat.
        var hatMeta = instance._hats[requestedHatOpcode];
        if (hatMeta.restartExistingThreads) {
            // If `restartExistingThreads` is true, we should stop
            // any existing threads starting with the top block.
            for (var i = 0; i < instance.threads.length; i++) {
                if (instance.threads[i].topBlock === topBlockId &&
                    instance.threads[i].target === target) {
                    instance._restartThread(instance.threads[i]);
                    return;
                }
            }
        } else {
            // If `restartExistingThreads` is false, we should
            // give up if any threads with the top block are running.
            for (var j = 0; j < instance.threads.length; j++) {
                if (instance.threads[j].topBlock === topBlockId &&
                    instance.threads[j].target === target) {
                    // Some thread is already running.
                    return;
                }
            }
        }
        // Start the thread with this top block.
        newThreads.push(instance._pushThread(topBlockId, target));
    }, optTarget);
    return newThreads;
};

/**
 * Dispose all targets. Return to clean state.
 */
Runtime.prototype.dispose = function () {
    this.stopAll();
    this.targets.map(this.disposeTarget, this);
};

/**
 * Dispose of a target.
 * @param {!Target} disposingTarget Target to dispose of.
 */
Runtime.prototype.disposeTarget = function (disposingTarget) {
    this.targets = this.targets.filter(function (target) {
        if (disposingTarget !== target) return true;
        // Allow target to do dispose actions.
        target.dispose();
        // Remove from list of targets.
        return false;
    });
};

/**
 * Stop any threads acting on the target.
 * @param {!Target} target Target to stop threads for.
 * @param {Thread=} optThreadException Optional thread to skip.
 */
Runtime.prototype.stopForTarget = function (target, optThreadException) {
    // Stop any threads on the target.
    for (var i = 0; i < this.threads.length; i++) {
        if (this.threads[i] === optThreadException) {
            continue;
        }
        if (this.threads[i].target === target) {
            this._removeThread(this.threads[i]);
        }
    }
};

/**
 * Start all threads that start with the green flag.
 */
Runtime.prototype.greenFlag = function () {
    this.stopAll();
    this.ioDevices.clock.resetProjectTimer();
    this.clearEdgeActivatedValues();
    // Inform all targets of the green flag.
    for (var i = 0; i < this.targets.length; i++) {
        this.targets[i].onGreenFlag();
    }
    this.startHats('event_whenflagclicked');
};

/**
 * Stop "everything."
 */
Runtime.prototype.stopAll = function () {
    // Dispose all clones.
    var newTargets = [];
    for (var i = 0; i < this.targets.length; i++) {
        this.targets[i].onStopAll();
        if (this.targets[i].hasOwnProperty('isOriginal') &&
            !this.targets[i].isOriginal) {
            this.targets[i].dispose();
        } else {
            newTargets.push(this.targets[i]);
        }
    }
    this.targets = newTargets;
    // Dispose all threads.
    var threadsCopy = this.threads.slice();
    while (threadsCopy.length > 0) {
        var poppedThread = threadsCopy.pop();
        this._removeThread(poppedThread);
    }
};

/**
 * Repeatedly run `sequencer.stepThreads` and filter out
 * inactive threads after each iteration.
 */
Runtime.prototype._step = function () {
    // Find all edge-activated hats, and add them to threads to be evaluated.
    for (var hatType in this._hats) {
        var hat = this._hats[hatType];
        if (hat.edgeActivated) {
            this.startHats(hatType);
        }
    }
    this.redrawRequested = false;
    var doneThreads = this.sequencer.stepThreads();
    this._updateGlows(doneThreads);
    this._setThreadCount(this.threads.length + doneThreads.length);
    if (this.renderer) {
        // @todo: Only render when this.redrawRequested or clones rendered.
        this.renderer.draw();
    }
};

/**
 * Set the current editing target known by the runtime.
 * @param {!Target} editingTarget New editing target.
 */
Runtime.prototype.setEditingTarget = function (editingTarget) {
    this._editingTarget = editingTarget;
    // Script glows must be cleared.
    this._scriptGlowsPreviousFrame = [];
    this._updateGlows();
    this.spriteInfoReport(editingTarget);
};

/**
 * Set whether we are in 30 TPS compatibility mode.
 * @param {boolean} compatibilityModeOn True iff in compatibility mode.
 */
Runtime.prototype.setCompatibilityMode = function (compatibilityModeOn) {
    this.compatibilityMode = compatibilityModeOn;
    if (this._steppingInterval) {
        clearInterval(this._steppingInterval);
        this.start();
    }
};

/**
 * Emit glows/glow clears for scripts after a single tick.
 * Looks at `this.threads` and notices which have turned on/off new glows.
 * @param {Array.<Thread>=} optExtraThreads Optional list of inactive threads.
 */
Runtime.prototype._updateGlows = function (optExtraThreads) {
    var searchThreads = [];
    searchThreads.push.apply(searchThreads, this.threads);
    if (optExtraThreads) {
        searchThreads.push.apply(searchThreads, optExtraThreads);
    }
    // Set of scripts that request a glow this frame.
    var requestedGlowsThisFrame = [];
    // Final set of scripts glowing during this frame.
    var finalScriptGlows = [];
    // Find all scripts that should be glowing.
    for (var i = 0; i < searchThreads.length; i++) {
        var thread = searchThreads[i];
        var target = thread.target;
        if (target === this._editingTarget) {
            var blockForThread = thread.blockGlowInFrame;
            if (thread.requestScriptGlowInFrame) {
                var script = target.blocks.getTopLevelScript(blockForThread);
                if (!script) {
                    // Attempt to find in flyout blocks.
                    script = this.flyoutBlocks.getTopLevelScript(
                        blockForThread
                    );
                }
                if (script) {
                    requestedGlowsThisFrame.push(script);
                }
            }
        }
    }
    // Compare to previous frame.
    for (var j = 0; j < this._scriptGlowsPreviousFrame.length; j++) {
        var previousFrameGlow = this._scriptGlowsPreviousFrame[j];
        if (requestedGlowsThisFrame.indexOf(previousFrameGlow) < 0) {
            // Glow turned off.
            this.glowScript(previousFrameGlow, false);
        } else {
            // Still glowing.
            finalScriptGlows.push(previousFrameGlow);
        }
    }
    for (var k = 0; k < requestedGlowsThisFrame.length; k++) {
        var currentFrameGlow = requestedGlowsThisFrame[k];
        if (this._scriptGlowsPreviousFrame.indexOf(currentFrameGlow) < 0) {
            // Glow turned on.
            this.glowScript(currentFrameGlow, true);
            finalScriptGlows.push(currentFrameGlow);
        }
    }
    this._scriptGlowsPreviousFrame = finalScriptGlows;
};

/**
 * Emit run start/stop after each tick. Emits when `this.threads.length` goes
 * between non-zero and zero
 *
 * @param {number} threadCount The new threadCount
 */
Runtime.prototype._setThreadCount = function (threadCount) {
    if (this._threadCount === 0 && threadCount > 0) {
        this.emit(Runtime.PROJECT_RUN_START);
    }
    if (this._threadCount > 0 && threadCount === 0) {
        this.emit(Runtime.PROJECT_RUN_STOP);
    }
    this._threadCount = threadCount;
};

/**
 * "Quiet" a script's glow: stop the VM from generating glow/unglow events
 * about that script. Use when a script has just been deleted, but we may
 * still be tracking glow data about it.
 * @param {!string} scriptBlockId Id of top-level block in script to quiet.
 */
Runtime.prototype.quietGlow = function (scriptBlockId) {
    var index = this._scriptGlowsPreviousFrame.indexOf(scriptBlockId);
    if (index > -1) {
        this._scriptGlowsPreviousFrame.splice(index, 1);
    }
};

/**
 * Emit feedback for block glowing (used in the sequencer).
 * @param {?string} blockId ID for the block to update glow
 * @param {boolean} isGlowing True to turn on glow; false to turn off.
 */
Runtime.prototype.glowBlock = function (blockId, isGlowing) {
    if (isGlowing) {
        this.emit(Runtime.BLOCK_GLOW_ON, {id: blockId});
    } else {
        this.emit(Runtime.BLOCK_GLOW_OFF, {id: blockId});
    }
};

/**
 * Emit feedback for script glowing.
 * @param {?string} topBlockId ID for the top block to update glow
 * @param {boolean} isGlowing True to turn on glow; false to turn off.
 */
Runtime.prototype.glowScript = function (topBlockId, isGlowing) {
    if (isGlowing) {
        this.emit(Runtime.SCRIPT_GLOW_ON, {id: topBlockId});
    } else {
        this.emit(Runtime.SCRIPT_GLOW_OFF, {id: topBlockId});
    }
};

/**
 * Emit value for reporter to show in the blocks.
 * @param {string} blockId ID for the block.
 * @param {string} value Value to show associated with the block.
 */
Runtime.prototype.visualReport = function (blockId, value) {
    this.emit(Runtime.VISUAL_REPORT, {id: blockId, value: String(value)});
};

/**
 * Emit a sprite info report if the provided target is the original sprite
 * @param {!Target} target Target to report sprite info for.
 */
Runtime.prototype.spriteInfoReport = function (target) {
    if (!target.isOriginal) return;

    this.emit(Runtime.SPRITE_INFO_REPORT, target.toJSON());
};

/**
 * Get a target by its id.
 * @param {string} targetId Id of target to find.
 * @return {?Target} The target, if found.
 */
Runtime.prototype.getTargetById = function (targetId) {
    for (var i = 0; i < this.targets.length; i++) {
        var target = this.targets[i];
        if (target.id === targetId) {
            return target;
        }
    }
};

/**
 * Get the first original (non-clone-block-created) sprite given a name.
 * @param {string} spriteName Name of sprite to look for.
 * @return {?Target} Target representing a sprite of the given name.
 */
Runtime.prototype.getSpriteTargetByName = function (spriteName) {
    for (var i = 0; i < this.targets.length; i++) {
        var target = this.targets[i];
        if (target.sprite && target.sprite.name === spriteName) {
            return target;
        }
    }
};

/**
 * Update the clone counter to track how many clones are created.
 * @param {number} changeAmount How many clones have been created/destroyed.
 */
Runtime.prototype.changeCloneCounter = function (changeAmount) {
    this._cloneCounter += changeAmount;
};

/**
 * Return whether there are clones available.
 * @return {boolean} True until the number of clones hits Runtime.MAX_CLONES.
 */
Runtime.prototype.clonesAvailable = function () {
    return this._cloneCounter < Runtime.MAX_CLONES;
};

/**
 * Get a target representing the Scratch stage, if one exists.
 * @return {?Target} The target, if found.
 */
Runtime.prototype.getTargetForStage = function () {
    for (var i = 0; i < this.targets.length; i++) {
        var target = this.targets[i];
        if (target.isStage) {
            return target;
        }
    }
};

/**
 * Tell the runtime to request a redraw.
 * Use after a clone/sprite has completed some visible operation on the stage.
 */
Runtime.prototype.requestRedraw = function () {
    this.redrawRequested = true;
};

/**
 * Set up timers to repeatedly step in a browser.
 */
Runtime.prototype.start = function () {
    var interval = Runtime.THREAD_STEP_INTERVAL;
    if (this.compatibilityMode) {
        interval = Runtime.THREAD_STEP_INTERVAL_COMPATIBILITY;
    }
    this.currentStepTime = interval;
    this._steppingInterval = setInterval(function () {
        this._step();
    }.bind(this), interval);
};

module.exports = Runtime;
