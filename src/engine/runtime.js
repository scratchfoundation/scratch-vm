const EventEmitter = require('events');
const Sequencer = require('./sequencer');
const Blocks = require('./blocks');
const Thread = require('./thread');
const {OrderedMap} = require('immutable');

// Virtual I/O devices.
const Clock = require('../io/clock');
const DeviceManager = require('../io/deviceManager');
const Keyboard = require('../io/keyboard');
const Mouse = require('../io/mouse');

const defaultBlockPackages = {
    scratch3_control: require('../blocks/scratch3_control'),
    scratch3_event: require('../blocks/scratch3_event'),
    scratch3_looks: require('../blocks/scratch3_looks'),
    scratch3_motion: require('../blocks/scratch3_motion'),
    scratch3_operators: require('../blocks/scratch3_operators'),
    scratch3_pen: require('../blocks/scratch3_pen'),
    scratch3_sound: require('../blocks/scratch3_sound'),
    scratch3_sensing: require('../blocks/scratch3_sensing'),
    scratch3_data: require('../blocks/scratch3_data'),
    scratch3_procedures: require('../blocks/scratch3_procedures'),
    scratch3_wedo2: require('../blocks/scratch3_wedo2')
};

/**
 * Manages targets, scripts, and the sequencer.
 * @constructor
 */
class Runtime extends EventEmitter {
    constructor () {
        super();

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
         * Storage container for monitor blocks.
         * These will execute on a target maybe
         * @type {!Blocks}
         */
        this.monitorBlocks = new Blocks();

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
         * Number of non-monitor threads running during the previous frame.
         * @type {number}
         */
        this._nonMonitorThreadCount = 0;

        /**
         * Currently known number of clones, used to enforce clone limit.
         * @type {number}
         */
        this._cloneCounter = 0;

        /**
         * Flag to emit a targets update at the end of a step. When target data
         * changes, this flag is set to true.
         * @type {boolean}
         */
        this._refreshTargets = false;

        /**
         * Ordered map of all monitors, which are MonitorReporter objects.
         */
        this._monitorState = OrderedMap({});

        /**
         * Monitor state from last tick
         */
        this._prevMonitorState = OrderedMap({});

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
            deviceManager: new DeviceManager(),
            keyboard: new Keyboard(this),
            mouse: new Mouse(this)
        };
    }

    /**
     * Width of the stage, in pixels.
     * @const {number}
     */
    static get STAGE_WIDTH () {
        return 480;
    }

    /**
     * Height of the stage, in pixels.
     * @const {number}
     */
    static get STAGE_HEIGHT () {
        return 360;
    }

    /**
     * Event name for glowing a script.
     * @const {string}
     */
    static get SCRIPT_GLOW_ON () {
        return 'SCRIPT_GLOW_ON';
    }

    /**
     * Event name for unglowing a script.
     * @const {string}
     */
    static get SCRIPT_GLOW_OFF () {
        return 'SCRIPT_GLOW_OFF';
    }

    /**
     * Event name for glowing a block.
     * @const {string}
     */
    static get BLOCK_GLOW_ON () {
        return 'BLOCK_GLOW_ON';
    }

    /**
     * Event name for unglowing a block.
     * @const {string}
     */
    static get BLOCK_GLOW_OFF () {
        return 'BLOCK_GLOW_OFF';
    }

    /**
     * Event name for glowing the green flag
     * @const {string}
     */
    static get PROJECT_RUN_START () {
        return 'PROJECT_RUN_START';
    }

    /**
     * Event name for unglowing the green flag
     * @const {string}
     */
    static get PROJECT_RUN_STOP () {
        return 'PROJECT_RUN_STOP';
    }

    /**
     * Event name for visual value report.
     * @const {string}
     */
    static get VISUAL_REPORT () {
        return 'VISUAL_REPORT';
    }

    /**
     * Event name for targets update report.
     * @const {string}
     */
    static get TARGETS_UPDATE () {
        return 'TARGETS_UPDATE';
    }

    /**
     * Event name for monitors update.
     * @const {string}
     */
    static get MONITORS_UPDATE () {
        return 'MONITORS_UPDATE';
    }

    /**
     * How rapidly we try to step threads by default, in ms.
     */
    static get THREAD_STEP_INTERVAL () {
        return 1000 / 60;
    }

    /**
     * In compatibility mode, how rapidly we try to step threads, in ms.
     */
    static get THREAD_STEP_INTERVAL_COMPATIBILITY () {
        return 1000 / 30;
    }

    /**
     * How many clones can be created at a time.
     * @const {number}
     */
    static get MAX_CLONES () {
        return 300;
    }

    // -----------------------------------------------------------------------------
    // -----------------------------------------------------------------------------

    /**
     * Register default block packages with this runtime.
     * @todo Prefix opcodes with package name.
     * @private
     */
    _registerBlockPackages () {
        for (const packageName in defaultBlockPackages) {
            if (defaultBlockPackages.hasOwnProperty(packageName)) {
                // @todo pass a different runtime depending on package privilege?
                const packageObject = new (defaultBlockPackages[packageName])(this);
                // Collect primitives from package.
                if (packageObject.getPrimitives) {
                    const packagePrimitives = packageObject.getPrimitives();
                    for (const op in packagePrimitives) {
                        if (packagePrimitives.hasOwnProperty(op)) {
                            this._primitives[op] =
                                packagePrimitives[op].bind(packageObject);
                        }
                    }
                }
                // Collect hat metadata from package.
                if (packageObject.getHats) {
                    const packageHats = packageObject.getHats();
                    for (const hatName in packageHats) {
                        if (packageHats.hasOwnProperty(hatName)) {
                            this._hats[hatName] = packageHats[hatName];
                        }
                    }
                }
            }
        }
    }

    /**
     * Retrieve the function associated with the given opcode.
     * @param {!string} opcode The opcode to look up.
     * @return {Function} The function which implements the opcode.
     */
    getOpcodeFunction (opcode) {
        return this._primitives[opcode];
    }

    /**
     * Return whether an opcode represents a hat block.
     * @param {!string} opcode The opcode to look up.
     * @return {boolean} True if the op is known to be a hat.
     */
    getIsHat (opcode) {
        return this._hats.hasOwnProperty(opcode);
    }

    /**
     * Return whether an opcode represents an edge-activated hat block.
     * @param {!string} opcode The opcode to look up.
     * @return {boolean} True if the op is known to be a edge-activated hat.
     */
    getIsEdgeActivatedHat (opcode) {
        return this._hats.hasOwnProperty(opcode) &&
            this._hats[opcode].edgeActivated;
    }

    /**
     * Update an edge-activated hat block value.
     * @param {!string} blockId ID of hat to store value for.
     * @param {*} newValue Value to store for edge-activated hat.
     * @return {*} The old value for the edge-activated hat.
     */
    updateEdgeActivatedValue (blockId, newValue) {
        const oldValue = this._edgeActivatedHatValues[blockId];
        this._edgeActivatedHatValues[blockId] = newValue;
        return oldValue;
    }

    /**
     * Clear all edge-activaed hat values.
     */
    clearEdgeActivatedValues () {
        this._edgeActivatedHatValues = {};
    }

    /**
     * Attach the audio engine
     * @param {!AudioEngine} audioEngine The audio engine to attach
     */
    attachAudioEngine (audioEngine) {
        this.audioEngine = audioEngine;
    }

    /**
     * Attach the renderer
     * @param {!RenderWebGL} renderer The renderer to attach
     */
    attachRenderer (renderer) {
        this.renderer = renderer;
    }

    /**
     * Attach the storage module
     * @param {!ScratchStorage} storage The storage module to attach
     */
    attachStorage (storage) {
        this.storage = storage;
    }

    // -----------------------------------------------------------------------------
    // -----------------------------------------------------------------------------

    /**
     * Create a thread and push it to the list of threads.
     * @param {!string} id ID of block that starts the stack.
     * @param {!Target} target Target to run thread on.
     * @param {?object} opts optional arguments
     * @param {?boolean} opts.showVisualReport true if the script should show speech bubble for its value
     * @param {?boolean} opts.updateMonitor true if the script should update a monitor value
     * @return {!Thread} The newly created thread.
     */
    _pushThread (id, target, opts) {
        opts = Object.assign({
            showVisualReport: false,
            updateMonitor: false
        }, opts);

        const thread = new Thread(id);
        thread.target = target;
        thread.showVisualReport = opts.showVisualReport;
        thread.updateMonitor = opts.updateMonitor;

        thread.pushStack(id);
        this.threads.push(thread);
        return thread;
    }

    /**
     * Remove a thread from the list of threads.
     * @param {?Thread} thread Thread object to remove from actives
     */
    _removeThread (thread) {
        // Inform sequencer to stop executing that thread.
        this.sequencer.retireThread(thread);
        // Remove from the list.
        const i = this.threads.indexOf(thread);
        if (i > -1) {
            this.threads.splice(i, 1);
        }
    }

    /**
     * Restart a thread in place, maintaining its position in the list of threads.
     * This is used by `startHats` to and is necessary to ensure 2.0-like execution order.
     * Test project: https://scratch.mit.edu/projects/130183108/
     * @param {!Thread} thread Thread object to restart.
     */
    _restartThread (thread) {
        const newThread = new Thread(thread.topBlock);
        newThread.target = thread.target;
        newThread.showVisualReport = thread.showVisualReport;
        newThread.updateMonitor = thread.updateMonitor;
        newThread.pushStack(thread.topBlock);
        const i = this.threads.indexOf(thread);
        if (i > -1) {
            this.threads[i] = newThread;
        } else {
            this.threads.push(thread);
        }
    }

    /**
     * Return whether a thread is currently active/running.
     * @param {?Thread} thread Thread object to check.
     * @return {boolean} True if the thread is active/running.
     */
    isActiveThread (thread) {
        return this.threads.indexOf(thread) > -1;
    }

    /**
     * Toggle a script.
     * @param {!string} topBlockId ID of block that starts the script.
     * @param {?object} opts optional arguments to toggle script
     * @param {?string} opts.target target ID for target to run script on. If not supplied, uses editing target.
     * @param {?boolean} opts.showVisualReport true if the speech bubble should pop up on the block, false if not.
     * @param {?boolean} opts.updateMonitor true if the monitor for this block should get updated.
     */
    toggleScript (topBlockId, opts) {
        opts = Object.assign({
            target: this._editingTarget,
            showVisualReport: false,
            updateMonitor: false
        }, opts);
        // Remove any existing thread.
        for (let i = 0; i < this.threads.length; i++) {
            if (this.threads[i].topBlock === topBlockId) {
                this._removeThread(this.threads[i]);
                return;
            }
        }
        // Otherwise add it.
        this._pushThread(topBlockId, opts.target, opts);
    }

    /**
     * Run a function `f` for all scripts in a workspace.
     * `f` will be called with two parameters:
     *  - the top block ID of the script.
     *  - the target that owns the script.
     * @param {!Function} f Function to call for each script.
     * @param {Target=} optTarget Optionally, a target to restrict to.
     */
    allScriptsDo (f, optTarget) {
        let targets = this.targets;
        if (optTarget) {
            targets = [optTarget];
        }
        for (let t = targets.length - 1; t >= 0; t--) {
            const target = targets[t];
            const scripts = target.blocks.getScripts();
            for (let j = 0; j < scripts.length; j++) {
                const topBlockId = scripts[j];
                f(topBlockId, target);
            }
        }
    }

    /**
     * Start all relevant hats.
     * @param {!string} requestedHatOpcode Opcode of hats to start.
     * @param {object=} optMatchFields Optionally, fields to match on the hat.
     * @param {Target=} optTarget Optionally, a target to restrict to.
     * @return {Array.<Thread>} List of threads started by this function.
     */
    startHats (requestedHatOpcode,
        optMatchFields, optTarget) {
        if (!this._hats.hasOwnProperty(requestedHatOpcode)) {
            // No known hat with this opcode.
            return;
        }
        const instance = this;
        const newThreads = [];

        for (const opts in optMatchFields) {
            if (!optMatchFields.hasOwnProperty(opts)) continue;
            optMatchFields[opts] = optMatchFields[opts].toUpperCase();
        }

        // Consider all scripts, looking for hats with opcode `requestedHatOpcode`.
        this.allScriptsDo((topBlockId, target) => {
            const blocks = target.blocks;
            const block = blocks.getBlock(topBlockId);
            const potentialHatOpcode = block.opcode;
            if (potentialHatOpcode !== requestedHatOpcode) {
                // Not the right hat.
                return;
            }

            // Match any requested fields.
            // For example: ensures that broadcasts match.
            // This needs to happen before the block is evaluated
            // (i.e., before the predicate can be run) because "broadcast and wait"
            // needs to have a precise collection of started threads.
            let hatFields = blocks.getFields(block);

            // If no fields are present, check inputs (horizontal blocks)
            if (Object.keys(hatFields).length === 0) {
                const hatInputs = blocks.getInputs(block);
                for (const input in hatInputs) {
                    if (!hatInputs.hasOwnProperty(input)) continue;
                    const id = hatInputs[input].block;
                    const inpBlock = blocks.getBlock(id);
                    const fields = blocks.getFields(inpBlock);
                    hatFields = Object.assign(fields, hatFields);
                }
            }

            if (optMatchFields) {
                for (const matchField in optMatchFields) {
                    if (hatFields[matchField].value.toUpperCase() !==
                        optMatchFields[matchField]) {
                        // Field mismatch.
                        return;
                    }
                }
            }

            // Look up metadata for the relevant hat.
            const hatMeta = instance._hats[requestedHatOpcode];
            if (hatMeta.restartExistingThreads) {
                // If `restartExistingThreads` is true, we should stop
                // any existing threads starting with the top block.
                for (let i = 0; i < instance.threads.length; i++) {
                    if (instance.threads[i].topBlock === topBlockId &&
                        instance.threads[i].target === target) {
                        instance._restartThread(instance.threads[i]);
                        return;
                    }
                }
            } else {
                // If `restartExistingThreads` is false, we should
                // give up if any threads with the top block are running.
                for (let j = 0; j < instance.threads.length; j++) {
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
    }

    /**
     * Dispose all targets. Return to clean state.
     */
    dispose () {
        this.stopAll();
        this.targets.map(this.disposeTarget, this);
    }

    /**
     * Dispose of a target.
     * @param {!Target} disposingTarget Target to dispose of.
     */
    disposeTarget (disposingTarget) {
        this.targets = this.targets.filter(target => {
            if (disposingTarget !== target) return true;
            // Allow target to do dispose actions.
            target.dispose();
            // Remove from list of targets.
            return false;
        });
    }

    /**
     * Stop any threads acting on the target.
     * @param {!Target} target Target to stop threads for.
     * @param {Thread=} optThreadException Optional thread to skip.
     */
    stopForTarget (target, optThreadException) {
        // Stop any threads on the target.
        for (let i = 0; i < this.threads.length; i++) {
            if (this.threads[i] === optThreadException) {
                continue;
            }
            if (this.threads[i].target === target) {
                this._removeThread(this.threads[i]);
            }
        }
    }

    /**
     * Start all threads that start with the green flag.
     */
    greenFlag () {
        this.stopAll();
        this.ioDevices.clock.resetProjectTimer();
        this.clearEdgeActivatedValues();
        // Inform all targets of the green flag.
        for (let i = 0; i < this.targets.length; i++) {
            this.targets[i].onGreenFlag();
        }
        this.startHats('event_whenflagclicked');
    }

    /**
     * Stop "everything."
     */
    stopAll () {
        // Dispose all clones.
        const newTargets = [];
        for (let i = 0; i < this.targets.length; i++) {
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
        const threadsCopy = this.threads.slice();
        while (threadsCopy.length > 0) {
            const poppedThread = threadsCopy.pop();
            this._removeThread(poppedThread);
        }
    }

    /**
     * Repeatedly run `sequencer.stepThreads` and filter out
     * inactive threads after each iteration.
     */
    _step () {
        // Find all edge-activated hats, and add them to threads to be evaluated.
        for (const hatType in this._hats) {
            if (!this._hats.hasOwnProperty(hatType)) continue;
            const hat = this._hats[hatType];
            if (hat.edgeActivated) {
                this.startHats(hatType);
            }
        }
        this.redrawRequested = false;
        this._pushMonitors();
        const doneThreads = this.sequencer.stepThreads();
        this._updateGlows(doneThreads);
        // Add done threads so that even if a thread finishes within 1 frame, the green
        // flag will still indicate that a script ran.
        this._emitProjectRunStatus(
            this.threads.length + doneThreads.length -
                this._getMonitorThreadCount([...this.threads, ...doneThreads]));
        if (this.renderer) {
            // @todo: Only render when this.redrawRequested or clones rendered.
            this.renderer.draw();
        }

        if (this._refreshTargets) {
            this.emit(Runtime.TARGETS_UPDATE);
            this._refreshTargets = false;
        }

        if (!this._prevMonitorState.equals(this._monitorState)) {
            this.emit(Runtime.MONITORS_UPDATE, this._monitorState);
            this._prevMonitorState = this._monitorState;
        }
    }

    /**
     * Get the number of threads in the given array that are monitor threads (threads
     * that update monitor values, and don't count as running a script).
     * @param {!Array.<Thread>} threads The set of threads to look through.
     * @return {number} The number of monitor threads in threads.
     */
    _getMonitorThreadCount (threads) {
        let count = 0;
        threads.forEach(thread => {
            if (thread.updateMonitor) count++;
        });
        return count;
    }

    /**
     * Queue monitor blocks to sequencer to be run.
     */
    _pushMonitors () {
        this.monitorBlocks.runAllMonitored(this);
    }

    /**
     * Set the current editing target known by the runtime.
     * @param {!Target} editingTarget New editing target.
     */
    setEditingTarget (editingTarget) {
        this._editingTarget = editingTarget;
        // Script glows must be cleared.
        this._scriptGlowsPreviousFrame = [];
        this._updateGlows();
        this.requestTargetsUpdate(editingTarget);
    }

    /**
     * Set whether we are in 30 TPS compatibility mode.
     * @param {boolean} compatibilityModeOn True iff in compatibility mode.
     */
    setCompatibilityMode (compatibilityModeOn) {
        this.compatibilityMode = compatibilityModeOn;
        if (this._steppingInterval) {
            clearInterval(this._steppingInterval);
            this.start();
        }
    }

    /**
     * Emit glows/glow clears for scripts after a single tick.
     * Looks at `this.threads` and notices which have turned on/off new glows.
     * @param {Array.<Thread>=} optExtraThreads Optional list of inactive threads.
     */
    _updateGlows (optExtraThreads) {
        const searchThreads = [];
        searchThreads.push.apply(searchThreads, this.threads);
        if (optExtraThreads) {
            searchThreads.push.apply(searchThreads, optExtraThreads);
        }
        // Set of scripts that request a glow this frame.
        const requestedGlowsThisFrame = [];
        // Final set of scripts glowing during this frame.
        const finalScriptGlows = [];
        // Find all scripts that should be glowing.
        for (let i = 0; i < searchThreads.length; i++) {
            const thread = searchThreads[i];
            const target = thread.target;
            if (target === this._editingTarget) {
                const blockForThread = thread.blockGlowInFrame;
                if (thread.requestScriptGlowInFrame) {
                    let script = target.blocks.getTopLevelScript(blockForThread);
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
        for (let j = 0; j < this._scriptGlowsPreviousFrame.length; j++) {
            const previousFrameGlow = this._scriptGlowsPreviousFrame[j];
            if (requestedGlowsThisFrame.indexOf(previousFrameGlow) < 0) {
                // Glow turned off.
                this.glowScript(previousFrameGlow, false);
            } else {
                // Still glowing.
                finalScriptGlows.push(previousFrameGlow);
            }
        }
        for (let k = 0; k < requestedGlowsThisFrame.length; k++) {
            const currentFrameGlow = requestedGlowsThisFrame[k];
            if (this._scriptGlowsPreviousFrame.indexOf(currentFrameGlow) < 0) {
                // Glow turned on.
                this.glowScript(currentFrameGlow, true);
                finalScriptGlows.push(currentFrameGlow);
            }
        }
        this._scriptGlowsPreviousFrame = finalScriptGlows;
    }

    /**
     * Emit run start/stop after each tick. Emits when `this.threads.length` goes
     * between non-zero and zero
     *
     * @param {number} nonMonitorThreadCount The new nonMonitorThreadCount
     */
    _emitProjectRunStatus (nonMonitorThreadCount) {
        if (this._nonMonitorThreadCount === 0 && nonMonitorThreadCount > 0) {
            this.emit(Runtime.PROJECT_RUN_START);
        }
        if (this._nonMonitorThreadCount > 0 && nonMonitorThreadCount === 0) {
            this.emit(Runtime.PROJECT_RUN_STOP);
        }
        this._nonMonitorThreadCount = nonMonitorThreadCount;
    }

    /**
     * "Quiet" a script's glow: stop the VM from generating glow/unglow events
     * about that script. Use when a script has just been deleted, but we may
     * still be tracking glow data about it.
     * @param {!string} scriptBlockId Id of top-level block in script to quiet.
     */
    quietGlow (scriptBlockId) {
        const index = this._scriptGlowsPreviousFrame.indexOf(scriptBlockId);
        if (index > -1) {
            this._scriptGlowsPreviousFrame.splice(index, 1);
        }
    }

    /**
     * Emit feedback for block glowing (used in the sequencer).
     * @param {?string} blockId ID for the block to update glow
     * @param {boolean} isGlowing True to turn on glow; false to turn off.
     */
    glowBlock (blockId, isGlowing) {
        if (isGlowing) {
            this.emit(Runtime.BLOCK_GLOW_ON, {id: blockId});
        } else {
            this.emit(Runtime.BLOCK_GLOW_OFF, {id: blockId});
        }
    }

    /**
     * Emit feedback for script glowing.
     * @param {?string} topBlockId ID for the top block to update glow
     * @param {boolean} isGlowing True to turn on glow; false to turn off.
     */
    glowScript (topBlockId, isGlowing) {
        if (isGlowing) {
            this.emit(Runtime.SCRIPT_GLOW_ON, {id: topBlockId});
        } else {
            this.emit(Runtime.SCRIPT_GLOW_OFF, {id: topBlockId});
        }
    }

    /**
     * Emit value for reporter to show in the blocks.
     * @param {string} blockId ID for the block.
     * @param {string} value Value to show associated with the block.
     */
    visualReport (blockId, value) {
        this.emit(Runtime.VISUAL_REPORT, {id: blockId, value: String(value)});
    }

    /**
     * Add a monitor to the state. If the monitor already exists in the state,
     * overwrites it.
     * @param {!MonitorRecord} monitor Monitor to add.
     */
    requestAddMonitor (monitor) {
        this._monitorState = this._monitorState.set(monitor.id, monitor);
    }

    /**
     * Update a monitor in the state. Does nothing if the monitor does not already
     * exist in the state.
     * @param {!Map} monitor Monitor values to update. Values on the monitor with overwrite
     *     values on the old monitor with the same ID. If a value isn't defined on the new monitor,
     *     the old monitor will keep its old value.
     */
    requestUpdateMonitor (monitor) {
        if (this._monitorState.has(monitor.get('id'))) {
            this._monitorState =
                this._monitorState.set(monitor.get('id'), this._monitorState.get(monitor.get('id')).merge(monitor));
        }
    }

    /**
     * Removes a monitor from the state. Does nothing if the monitor already does
     * not exist in the state.
     * @param {!string} monitorId ID of the monitor to remove.
     */
    requestRemoveMonitor (monitorId) {
        this._monitorState = this._monitorState.delete(monitorId);
    }

    /**
     * Get a target by its id.
     * @param {string} targetId Id of target to find.
     * @return {?Target} The target, if found.
     */
    getTargetById (targetId) {
        for (let i = 0; i < this.targets.length; i++) {
            const target = this.targets[i];
            if (target.id === targetId) {
                return target;
            }
        }
    }

    /**
     * Get the first original (non-clone-block-created) sprite given a name.
     * @param {string} spriteName Name of sprite to look for.
     * @return {?Target} Target representing a sprite of the given name.
     */
    getSpriteTargetByName (spriteName) {
        for (let i = 0; i < this.targets.length; i++) {
            const target = this.targets[i];
            if (target.sprite && target.sprite.name === spriteName) {
                return target;
            }
        }
    }

    /**
     * Get a target by its drawable id.
     * @param {number} drawableID drawable id of target to find
     * @return {?Target} The target, if found
     */
    getTargetByDrawableId (drawableID) {
        for (let i = 0; i < this.targets.length; i++) {
            const target = this.targets[i];
            if (target.drawableID === drawableID) return target;
        }
    }

    /**
     * Update the clone counter to track how many clones are created.
     * @param {number} changeAmount How many clones have been created/destroyed.
     */
    changeCloneCounter (changeAmount) {
        this._cloneCounter += changeAmount;
    }

    /**
     * Return whether there are clones available.
     * @return {boolean} True until the number of clones hits Runtime.MAX_CLONES.
     */
    clonesAvailable () {
        return this._cloneCounter < Runtime.MAX_CLONES;
    }

    /**
     * Report that a new target has been created, possibly by cloning an existing target.
     * @param {Target} newTarget - the newly created target.
     * @param {Target} [sourceTarget] - the target used as a source for the new clone, if any.
     * @fires Runtime#targetWasCreated
     */
    fireTargetWasCreated (newTarget, sourceTarget) {
        this.emit('targetWasCreated', newTarget, sourceTarget);
    }

    /**
     * Get a target representing the Scratch stage, if one exists.
     * @return {?Target} The target, if found.
     */
    getTargetForStage () {
        for (let i = 0; i < this.targets.length; i++) {
            const target = this.targets[i];
            if (target.isStage) {
                return target;
            }
        }
    }

    /**
     * Get the editing target.
     * @return {?Target} The editing target.
     */
    getEditingTarget () {
        return this._editingTarget;
    }

    /**
     * Tell the runtime to request a redraw.
     * Use after a clone/sprite has completed some visible operation on the stage.
     */
    requestRedraw () {
        this.redrawRequested = true;
    }

    /**
     * Emit a targets update at the end of the step if the provided target is
     * the original sprite
     * @param {!Target} target Target requesting the targets update
     */
    requestTargetsUpdate (target) {
        if (!target.isOriginal) return;
        this._refreshTargets = true;
    }

    /**
     * Set up timers to repeatedly step in a browser.
     */
    start () {
        let interval = Runtime.THREAD_STEP_INTERVAL;
        if (this.compatibilityMode) {
            interval = Runtime.THREAD_STEP_INTERVAL_COMPATIBILITY;
        }
        this.currentStepTime = interval;
        this._steppingInterval = setInterval(() => {
            this._step();
        }, interval);
    }
}

/**
 * Event fired after a new target has been created, possibly by cloning an existing target.
 *
 * @event Runtime#targetWasCreated
 * @param {Target} newTarget - the newly created target.
 * @param {Target} [sourceTarget] - the target used as a source for the new clone, if any.
 */

module.exports = Runtime;
