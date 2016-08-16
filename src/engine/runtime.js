var EventEmitter = require('events');
var Sequencer = require('./sequencer');
var Thread = require('./thread');
var util = require('util');

// Virtual I/O devices.
var Clock = require('../io/clock');
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
 * @param {!Array.<Target>} targets List of targets for this runtime.
 */
function Runtime (targets) {
    // Bind event emitter
    EventEmitter.call(this);

    // State for the runtime

    /**
     * Target management and storage.
     */
    this.targets = targets;

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
    this._registerBlockPackages();

    this.ioDevices = {
        'clock': new Clock(),
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
            var packageContents = packageObject.getPrimitives();
            for (var op in packageContents) {
                if (packageContents.hasOwnProperty(op)) {
                    this._primitives[op] =
                        packageContents[op].bind(packageObject);
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
 * Create a thread and push it to the list of threads.
 * @param {!string} id ID of block that starts the stack
 */
Runtime.prototype._pushThread = function (id) {
    this.emit(Runtime.STACK_GLOW_ON, id);
    var thread = new Thread(id);
    thread.pushStack(id);
    this.threads.push(thread);
};

/**
 * Remove a thread from the list of threads.
 * @param {?Thread} thread Thread object to remove from actives
 */
Runtime.prototype._removeThread = function (thread) {
    var i = this.threads.indexOf(thread);
    if (i > -1) {
        this.emit(Runtime.STACK_GLOW_OFF, thread.topBlock);
        this.threads.splice(i, 1);
    }
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
 * Green flag, which stops currently running threads
 * and adds all top-level scripts that start with the green flag
 */
Runtime.prototype.greenFlag = function () {
    // Remove all existing threads
    for (var i = 0; i < this.threads.length; i++) {
        this._removeThread(this.threads[i]);
    }
    // Add all top scripts with green flag
    for (var t = 0; t < this.targets.length; t++) {
        var target = this.targets[t];
        var scripts = target.blocks.getScripts();
        for (var j = 0; j < scripts.length; j++) {
            var topBlock = scripts[j];
            if (target.blocks.getBlock(topBlock).opcode ===
                'event_whenflagclicked') {
                this._pushThread(scripts[j]);
            }
        }
    }
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
