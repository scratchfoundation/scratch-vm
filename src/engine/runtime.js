var EventEmitter = require('events');
var Sequencer = require('./sequencer');
var Thread = require('./thread');
var util = require('util');

// Virtual I/O devices.
var Clock = require('../io/clock');
var Keyboard = require('../io/keyboard');
var Mouse = require('../io/mouse');

var defaultBlockPackages = {
    'scratch3_control': require('../blocks/scratch3_control'),
    'scratch3_event': require('../blocks/scratch3_event'),
    'scratch3_looks': require('../blocks/scratch3_looks'),
    'scratch3_motion': require('../blocks/scratch3_motion'),
    'scratch3_operators': require('../blocks/scratch3_operators'),
    'scratch3_sensing': require('../blocks/scratch3_sensing')
};

/**
 * Manages targets, scripts, and the sequencer.
 */
function Runtime () {
    // Bind event emitter
    EventEmitter.call(this);

    // State for the runtime

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
     * Map to look up a block primitive's implementation function by its opcode.
     * This is a two-step lookup: package name first, then primitive name.
     * @type {Object.<string, Function>}
     */
    this._primitives = {};
    this._hats = {};
    this._edgeActivatedHatValues = {};
    this._registerBlockPackages();

    this.ioDevices = {
        'clock': new Clock(),
        'keyboard': new Keyboard(this),
        'mouse': new Mouse()
    };
}

/**
 * Event name for glowing a stack
 * @const {string}
 */
Runtime.STACK_GLOW_ON = 'STACK_GLOW_ON';

/**
 * Event name for unglowing a stack
 * @const {string}
 */
Runtime.STACK_GLOW_OFF = 'STACK_GLOW_OFF';

/**
 * Event name for glowing a block
 * @const {string}
 */
Runtime.BLOCK_GLOW_ON = 'BLOCK_GLOW_ON';

/**
 * Event name for unglowing a block
 * @const {string}
 */
Runtime.BLOCK_GLOW_OFF = 'BLOCK_GLOW_OFF';

/**
 * Event name for visual value report.
 * @const {string}
 */
Runtime.VISUAL_REPORT = 'VISUAL_REPORT';

/**
 * Inherit from EventEmitter
 */
util.inherits(Runtime, EventEmitter);

/**
 * How rapidly we try to step threads, in ms.
 */
Runtime.THREAD_STEP_INTERVAL = 1000 / 60;


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

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

/**
 * Return whether an opcode represents a hat block.
 * @param {!string} opcode The opcode to look up.
 * @return {Boolean} True if the op is known to be a hat.
 */
Runtime.prototype.getIsHat = function (opcode) {
    return this._hats.hasOwnProperty(opcode);
};

/**
 * Return whether an opcode represents an edge-activated hat block.
 * @param {!string} opcode The opcode to look up.
 * @return {Boolean} True if the op is known to be a edge-activated hat.
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

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

/**
 * Create a thread and push it to the list of threads.
 * @param {!string} id ID of block that starts the stack
 * @return {!Thread} The newly created thread.
 */
Runtime.prototype._pushThread = function (id) {
    var thread = new Thread(id);
    this.glowScript(id, true);
    thread.pushStack(id);
    this.threads.push(thread);
    return thread;
};

/**
 * Remove a thread from the list of threads.
 * @param {?Thread} thread Thread object to remove from actives
 */
Runtime.prototype._removeThread = function (thread) {
    var i = this.threads.indexOf(thread);
    if (i > -1) {
        this.glowScript(thread.topBlock, false);
        this.threads.splice(i, 1);
    }
};

/**
 * Return whether a thread is currently active/running.
 * @param {?Thread} thread Thread object to check.
 * @return {Boolean} True if the thread is active/running.
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
        if (this.threads[i].topBlock == topBlockId) {
            this._removeThread(this.threads[i]);
            return;
        }
    }
    // Otherwise add it.
    this._pushThread(topBlockId);
};

/**
 * Run a function `f` for all scripts in a workspace.
 * `f` will be called with two parameters:
 *  - the top block ID of the script.
 *  - the target that owns the script.
 * @param {!Function} f Function to call for each script.
 * @param {Target=} opt_target Optionally, a target to restrict to.
 */
Runtime.prototype.allScriptsDo = function (f, opt_target) {
    var targets = this.targets;
    if (opt_target) {
        targets = [opt_target];
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
 * @param {Object=} opt_matchFields Optionally, fields to match on the hat.
 * @param {Target=} opt_target Optionally, a target to restrict to.
 * @return {Array.<Thread>} List of threads started by this function.
 */
Runtime.prototype.startHats = function (requestedHatOpcode,
    opt_matchFields, opt_target) {
    if (!this._hats.hasOwnProperty(requestedHatOpcode)) {
        // No known hat with this opcode.
        return;
    }
    var instance = this;
    var newThreads = [];
    // Consider all scripts, looking for hats with opcode `requestedHatOpcode`.
    this.allScriptsDo(function(topBlockId, target) {
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
        if (opt_matchFields) {
            for (var matchField in opt_matchFields) {
                if (hatFields[matchField].value !==
                    opt_matchFields[matchField]) {
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
                if (instance.threads[i].topBlock === topBlockId) {
                    instance._removeThread(instance.threads[i]);
                }
            }
        } else {
            // If `restartExistingThreads` is false, we should
            // give up if any threads with the top block are running.
            for (var j = 0; j < instance.threads.length; j++) {
                if (instance.threads[j].topBlock === topBlockId) {
                    // Some thread is already running.
                    return;
                }
            }
        }
        // Start the thread with this top block.
        newThreads.push(instance._pushThread(topBlockId));
    }, opt_target);
    return newThreads;
};

/**
 * Start all threads that start with the green flag.
 */
Runtime.prototype.greenFlag = function () {
    this.ioDevices.clock.resetProjectTimer();
    this.clearEdgeActivatedValues();
    this.startHats('event_whenflagclicked');
};

/**
 * Stop "everything"
 */
Runtime.prototype.stopAll = function () {
    var threadsCopy = this.threads.slice();
    while (threadsCopy.length > 0) {
        var poppedThread = threadsCopy.pop();
        // Unglow any blocks on this thread's stack.
        for (var i = 0; i < poppedThread.stack.length; i++) {
            this.glowBlock(poppedThread.stack[i], false);
        }
        // Actually remove the thread.
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
    var inactiveThreads = this.sequencer.stepThreads(this.threads);
    for (var i = 0; i < inactiveThreads.length; i++) {
        this._removeThread(inactiveThreads[i]);
    }
};

/**
 * Emit feedback for block glowing (used in the sequencer).
 * @param {?string} blockId ID for the block to update glow
 * @param {boolean} isGlowing True to turn on glow; false to turn off.
 */
Runtime.prototype.glowBlock = function (blockId, isGlowing) {
    if (isGlowing) {
        this.emit(Runtime.BLOCK_GLOW_ON, blockId);
    } else {
        this.emit(Runtime.BLOCK_GLOW_OFF, blockId);
    }
};

/**
 * Emit feedback for script glowing.
 * @param {?string} topBlockId ID for the top block to update glow
 * @param {boolean} isGlowing True to turn on glow; false to turn off.
 */
Runtime.prototype.glowScript = function (topBlockId, isGlowing) {
    if (isGlowing) {
        this.emit(Runtime.STACK_GLOW_ON, topBlockId);
    } else {
        this.emit(Runtime.STACK_GLOW_OFF, topBlockId);
    }
};

/**
 * Emit value for reporter to show in the blocks.
 * @param {string} blockId ID for the block.
 * @param {string} value Value to show associated with the block.
 */
Runtime.prototype.visualReport = function (blockId, value) {
    this.emit(Runtime.VISUAL_REPORT, blockId, String(value));
};

/**
 * Return the Target for a particular thread.
 * @param {!Thread} thread Thread to determine target for.
 * @return {?Target} Target object, if one exists.
 */
Runtime.prototype.targetForThread = function (thread) {
    // @todo This is a messy solution,
    // but prevents having circular data references.
    // Have a map or some other way to associate target with threads.
    for (var t = 0; t < this.targets.length; t++) {
        var target = this.targets[t];
        if (target.blocks.getBlock(thread.topBlock)) {
            return target;
        }
    }
};

/**
 * Get a target by its id.
 * @param {string} targetId Id of target to find.
 * @return {?Target} The target, if found.
 */
Runtime.prototype.getTargetById = function (targetId) {
    for (var i = 0; i < this.targets.length; i++) {
        var target = this.targets[i];
        if (target.id == targetId) {
            return target;
        }
    }
};

/**
 * Handle an animation frame from the main thread.
 */
Runtime.prototype.animationFrame = function () {
    if (self.renderer) {
        self.renderer.draw();
    }
};

/**
 * Set up timers to repeatedly step in a browser
 */
Runtime.prototype.start = function () {
    self.setInterval(function() {
        this._step();
    }.bind(this), Runtime.THREAD_STEP_INTERVAL);
};

module.exports = Runtime;
