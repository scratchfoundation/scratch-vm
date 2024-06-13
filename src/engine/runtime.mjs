import EventEmitter from "events";
import _ from "lodash";

import StageLayering from "./stage-layering.mjs";

import scratch3EventBlocks from "../blocks/scratch3_event.mjs";
import scratch3LooksBlocks from "../blocks/scratch3_looks.mjs";
import scratch3MotionBlocks from "../blocks/scratch3_motion.mjs";
import scratch3SensingBlocks from "../blocks/scratch3_sensing.mjs";
import scratch3SoundBlocks from "../blocks/scratch3_sound.mjs";
import scratch3ControlBlocks from "../blocks/scratch3_control.mjs";
import scratch3PenBlocks from "../blocks/scratch3_ext_pen.mjs";
import patchCoreBlocks from "../blocks/patch_core.mjs";

import Thread from "./thread.mjs";
import safeUid from "../util/safe-uid.mjs";
import StringUtil from "../util/string-util.mjs";
import PyatchWorker from "../worker/pyatch-worker.mjs";
import WorkerMessages from "../worker/worker-messages.mjs";
import PyatchLinker from "../linker/pyatch-linker.mjs";

import Clock from "../io/clock.mjs";
import Keyboard from "../io/keyboard.mjs";
import Mouse from "../io/mouse.mjs";
import MouseWheel from "../io/mouseWheel.mjs";

const defaultBlockPackages = {
    scratch3_control: scratch3ControlBlocks,
    scratch3_event: scratch3EventBlocks,
    scratch3_looks: scratch3LooksBlocks,
    scratch3_motion: scratch3MotionBlocks,
    // scratch3_operators: require('../blocks/scratch3_operators'),
    scratch3_sound: scratch3SoundBlocks,
    scratch3_sensing: scratch3SensingBlocks,
    // scratch3_data: require('../blocks/scratch3_data'),
    // scratch3_procedures: require('../blocks/scratch3_procedures')
    scratch3_ext_pen: scratch3PenBlocks,
    patch_core: patchCoreBlocks,
};

/**
 * Manages targets, scripts, and the sequencer.
 * @constructor
 */
export default class Runtime extends EventEmitter {
    constructor() {
        super();

        /**
         * Target management and storage.
         * @type {Array.<!Target>}
         */
        this.targets = [];

        /**
         * Targets in reverse order of execution. Shares its order with drawables.
         * @type {Array.<!Target>}
         */
        this.executableTargets = [];

        /**
         * Map to look up a block primitive's implementation function by its opcode.
         * This is a two-step lookup: package name first, then primitive name.
         * @type {Object.<string, Function>}
         */
        this._primitives = {};

        /**
         * Map to look up all block information by extended opcode.
         * @type {Array.<CategoryInfo>}
         * @private
         */
        this._blockInfo = [];

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
         * A reference to the current runtime stepping interval, set
         * by a `setInterval`.
         * @type {!number}
         */
        this._steppingInterval = null;

        /**
         * Map to look up hat blocks' metadata.
         * Keys are opcode for hat, values are metadata objects.
         * @type {Object.<string, Object>}
         */
        this._hats = {};

        /**
         * A dictionary of all threads running no the Patch vm. Dict keys
         * are thread id.
         * @type {Dictionary.<String, Thread>}
         */
        this._threads = {};

        /**
         * A dictionary of all global variabls
         * @type {Dictionary.<String, String|Number>}
         */
        this._globalVariables = {};

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
            clock: new Clock(this),
            keyboard: new Keyboard(this),
            mouse: new Mouse(this),
            mouseWheel: new MouseWheel(this),
        };

        this.runtimeErrors = [];
        this.compileTimeErrors = [];
        this.pyatchWorker = new PyatchWorker((threadId, message, lineNumber, type) => {
            if (type === "RuntimeError") {
                this.runtimeErrors.push({ threadId, message, lineNumber, type });
                this.emit("RUNTIME ERROR", { threadId, message, lineNumber, type });
            } else if (type === "CompileTimeError") {
                this.compileTimeErrors.push({ threadId, message, lineNumber, type });
                this.emit("COMPILE TIME ERROR", { threadId, message, lineNumber, type });
            }
        });
        this.workerLoaded = false;
        this.workerLoadPromise = this.pyatchWorker.loadWorker().then(() => {
            this.workerLoaded = true;
            this.emit("WORKER READY");
        });

        this.pyatchLinker = new PyatchLinker();

        this.targetCodeMapGLB = null;
    }

    /**
     * Width of the stage, in pixels.
     * @const {number}
     */
    static get STAGE_WIDTH() {
        return 480;
    }

    /**
     * Height of the stage, in pixels.
     * @const {number}
     */
    static get STAGE_HEIGHT() {
        return 360;
    }

    /**
     * Event name when the project is started (threads may not necessarily be
     * running).
     * @const {string}
     */
    static get PROJECT_START() {
        return "PROJECT_START";
    }

    /**
     * Event name for project being stopped or restarted by the user.
     * Used by blocks that need to reset state.
     * @const {string}
     */
    static get PROJECT_STOP_ALL() {
        return "PROJECT_STOP_ALL";
    }

    /**
     * Event name for target being stopped by a stop for target call.
     * Used by blocks that need to stop individual targets.
     * @const {string}
     */
    static get STOP_FOR_TARGET() {
        return "STOP_FOR_TARGET";
    }

    /**
     * Event name for project loaded report.
     * @const {string}
     */
    static get PROJECT_LOADED() {
        return "PROJECT_LOADED";
    }

    /**
     * Event name for report that a change was made that can be saved
     * @const {string}
     */
    static get PROJECT_CHANGED() {
        return "PROJECT_CHANGED";
    }

    /**
     * Event name for targets update report.
     * @const {string}
     */
    static get TARGETS_UPDATE() {
        return "TARGETS_UPDATE";
    }

    /**
     * Event name for monitors update.
     * @const {string}
     */
    static get MONITORS_UPDATE() {
        return "MONITORS_UPDATE";
    }

    /**
     * Event name for reporting that blocksInfo was updated.
     * @const {string}
     */
    static get BLOCKSINFO_UPDATE() {
        return "BLOCKSINFO_UPDATE";
    }

    /**
     * Event name when the runtime tick loop has been started.
     * @const {string}
     */
    static get RUNTIME_STARTED() {
        return "RUNTIME_STARTED";
    }

    /**
     * Event name when the runtime dispose has been called.
     * @const {string}
     */
    static get RUNTIME_DISPOSED() {
        return "RUNTIME_DISPOSED";
    }

    /**
     * How many clones can be created at a time.
     * @const {number}
     */
    static get MAX_CLONES() {
        return 50;
    }

    /**
     * How rapidly we try to step threads by default, in ms.
     */
    static get RENDER_INTERVAL() {
        return 1000 / 60;
    }

    // -----------------------------------------------------------------------------
    // -----------------------------------------------------------------------------

    /**
     * Register default block packages with this runtime.
     * @todo Prefix opcodes with package name.
     * @private
     */
    _registerBlockPackages() {
        // eslint-disable-next-line no-restricted-syntax
        for (const packageName in defaultBlockPackages) {
            if (defaultBlockPackages.hasOwnProperty(packageName)) {
                // @todo pass a different runtime depending on package privilege?
                const packageObject = new defaultBlockPackages[packageName](this);
                // Collect primitives from package.
                if (packageObject.getPrimitives) {
                    const packagePrimitives = packageObject.getPrimitives();
                    // eslint-disable-next-line no-restricted-syntax
                    for (const op in packagePrimitives) {
                        if (packagePrimitives.hasOwnProperty(op)) {
                            this._primitives[op] = packagePrimitives[op].bind(packageObject);
                        }
                    }
                }

                if (packageObject.getHats) {
                    const packageHats = packageObject.getHats();
                    // eslint-disable-next-line no-restricted-syntax
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
    getOpcodeFunction(opcode) {
        return this._primitives[opcode];
    }

    /**
     * Retrieve metadata associtated with a specific hat.
     */
    getHatMetadata(hatOpcode) {
        return this._hats[hatOpcode];
    }

    /**
     * Attach the audio engine
     * @param {!AudioEngine} audioEngine The audio engine to attach
     */
    attachAudioEngine(audioEngine) {
        this.audioEngine = audioEngine;
    }

    /**
     * Attach the renderer
     * @param {!RenderWebGL} renderer The renderer to attach
     */
    attachRenderer(renderer) {
        this.renderer = renderer;
        this.renderer.setLayerGroupOrdering(StageLayering.LAYER_GROUPS);
    }

    /**
     * Set the bitmap adapter for the VM/runtime, which converts scratch 2
     * bitmaps to scratch 3 bitmaps. (Scratch 3 bitmaps are all bitmap resolution 2)
     * @param {!function} bitmapAdapter The adapter to attach
     */
    attachV2BitmapAdapter(bitmapAdapter) {
        this.v2BitmapAdapter = bitmapAdapter;
    }

    /**
     * Attach the storage module
     * @param {!ScratchStorage} storage The storage module to attach
     */
    attachStorage(storage) {
        this.storage = storage;
    }

    /**
     * Move a target in the execution order by a relative amount.
     *
     * A positve number will make the target execute earlier. A negative number
     * will make the target execute later in the order.
     *
     * @param {Target} executableTarget target to move
     * @param {number} delta number of positions to move target by
     * @returns {number} new position in execution order
     */
    moveExecutable (executableTarget, delta) {
        const oldIndex = this.executableTargets.indexOf(executableTarget);
        this.executableTargets.splice(oldIndex, 1);
        let newIndex = oldIndex + delta;
        if (newIndex > this.executableTargets.length) {
            newIndex = this.executableTargets.length;
        }
        if (newIndex <= 0) {
            if (this.executableTargets.length > 0 && this.executableTargets[0].isStage) {
                newIndex = 1;
            } else {
                newIndex = 0;
            }
        }
        this.executableTargets.splice(newIndex, 0, executableTarget);
        return newIndex;
    }
    
    /**
     * Set a target to execute at a specific position in the execution order.
     *
     * Infinity will set the target to execute first. 0 will set the target to
     * execute last (before the stage).
     *
     * @param {Target} executableTarget target to move
     * @param {number} newIndex position in execution order to place the target
     * @returns {number} new position in the execution order
     */
    setExecutablePosition (executableTarget, newIndex) {
        const oldIndex = this.executableTargets.indexOf(executableTarget);
        return this.moveExecutable(executableTarget, newIndex - oldIndex);
    }

    // -----------------------------------------------------------------------------
    // -----------------------------------------------------------------------------
    /**
     * Remove a target from the execution set.
     * @param {Target} executableTarget target to remove
     */
    removeExecutable(executableTarget) {
        const oldIndex = this.executableTargets.indexOf(executableTarget);
        if (oldIndex > -1) {
            this.executableTargets.splice(oldIndex, 1);
        }
    }

    /**
     * Dispose all targets. Return to clean state.
     */
    dispose() {
        // this.stopAll();
        // Deleting each target's variable's monitors.
        /* this.targets.forEach((target) => {
            if (target.isOriginal) target.deleteMonitors();
        }); */

        this.targets.map(this.disposeTarget, this);
        this.emit(Runtime.RUNTIME_DISPOSED);
        // this.ioDevices.clock.resetProjectTimer();
        // @todo clear out extensions? turboMode? etc.
    }

    /**
     * Add a target to the runtime. This tracks the sprite pane
     * ordering of the target. The target still needs to be put
     * into the correct execution order after calling this function.
     * @param {Target} target target to add
     */
    addTarget(target) {
        this.targets.push(target);
        this.executableTargets.push(target);
    }

    /**
     * Dispose of a target.
     * @param {!Target} disposingTarget Target to dispose of.
     */
    disposeTarget(disposingTarget) {
        this.targets = this.targets.filter((target) => {
            if (disposingTarget !== target) return true;
            // Allow target to do dispose actions.
            target.dispose();
            // Remove from list of targets.
            return false;
        });
    }

    /**
     * Start all threads that start with the green flag.
     */
    async greenFlag() {
        await this.stopAll();
        // this.emit(Runtime.PROJECT_START);
        // this.targets.forEach((target) => target.clearEdgeActivatedValues());
        // Inform all targets of the green flag.
        this.startHats("event_whenflagclicked");
    }

    /**
     * Stop "everything."
     */
    async stopAll() {
        // Emit stop event to allow blocks to clean up any state.
        this.emit(Runtime.PROJECT_STOP_ALL);

        // Dispose all clones.
        const newTargets = [];
        const threadStopPromises = [];
        for (let i = 0; i < this.targets.length; i++) {
            threadStopPromises.push(this.targets[i].stopAllThreads());
            if (this.targets[i].hasOwnProperty("isOriginal") && !this.targets[i].isOriginal) {
                this.targets[i].dispose();
            } else {
                newTargets.push(this.targets[i]);
            }
        }
        this.targets = newTargets;

        // Make sure all threads have actually stopped execution before continuing.
        await Promise.all(threadStopPromises);
    }

    /**
     * Stops all threads associated with a specifed target other than the thread id specified
     * @param {Number} targetId id of target containing the threads to stop
     */
    async stopOtherTargetThreads(targetId, threadId) {
        const target = this.getTargetById(targetId);
        if (!target) return;
        target.stopAllThreads([threadId]);
    }

    /**
     * Stop specified thread's execution
     * @param {Number} threadId thread id to stop
     */
    async stopThread(threadId) {
        await this.pyatchWorker.stopThread(threadId);
    }

    /**
     * Repeatedly run `sequencer.stepThreads` and filter out
     * inactive threads after each iteration.
     */
    _step() {
        this.draw();
    }

    /**
     * Emit run start/stop after each tick. Emits when `this.threads.length` goes
     * between non-zero and zero
     *
     * @param {number} nonMonitorThreadCount The new nonMonitorThreadCount
     */
    _emitProjectRunStatus(nonMonitorThreadCount) {}

    /**
     * Get a target by its id.
     * @param {string} targetId Id of target to find.
     * @return {?Target} The target, if found.
     */
    getTargetById(targetId) {
        for (let i = 0; i < this.targets.length; i++) {
            const target = this.targets[i];
            if (target.id === targetId) {
                return target;
            }
        }
        return null;
    }

    /**
     * Get the first original (non-clone-block-created) sprite given a name.
     * @param {string} spriteName Name of sprite to look for.
     * @return {?Target} Target representing a sprite of the given name.
     */
    getSpriteTargetByName(spriteName) {
        for (let i = 0; i < this.targets.length; i++) {
            const target = this.targets[i];
            if (target.isStage) {
                // eslint-disable-next-line no-continue
                continue;
            }
            if (target.sprite && target.sprite.name === spriteName) {
                return target;
            }
        }
        return null;
    }

    /**
     * Get a target by its drawable id.
     * @param {number} drawableID drawable id of target to find
     * @return {?Target} The target, if found
     */
    getTargetByDrawableId(drawableID) {
        for (let i = 0; i < this.targets.length; i++) {
            const target = this.targets[i];
            if (target.drawableID === drawableID) return target;
        }
        return null;
    }

    /**
     * Update the clone counter to track how many clones are created.
     * @param {number} changeAmount How many clones have been created/destroyed.
     */
    changeCloneCounter(changeAmount) {
        this._cloneCounter += changeAmount;
    }

    /**
     * Return whether there are clones available.
     * @return {boolean} True until the number of clones hits Runtime.MAX_CLONES.
     */
    clonesAvailable() {
        return this._cloneCounter < Runtime.MAX_CLONES;
    }

    /**
     * Report that the project has loaded in the Virtual Machine.
     */
    emitProjectLoaded() {
        this.emit(Runtime.PROJECT_LOADED);
    }

    /**
     * Report that the project has changed in a way that would affect serialization
     */
    emitProjectChanged() {
        this.emit(Runtime.PROJECT_CHANGED);
    }

    /**
     * Report that a new target has been created, possibly by cloning an existing target.
     * @param {Target} newTarget - the newly created target.
     * @param {Target} [sourceTarget] - the target used as a source for the new clone, if any.
     * @fires Runtime#targetWasCreated
     */
    fireTargetWasCreated(newTarget, sourceTarget) {
        this.emit("targetWasCreated", newTarget, sourceTarget);
    }

    /**
     * Report that a clone target is being removed.
     * @param {Target} target - the target being removed
     * @fires Runtime#targetWasRemoved
     */
    fireTargetWasRemoved(target) {
        this.emit("targetWasRemoved", target);
    }

    /**
     * Set the current editing target known by the runtime.
     * @param {!Target} editingTarget New editing target.
     */
    setEditingTarget(editingTarget) {
        const oldEditingTarget = this._editingTarget;
        this._editingTarget = editingTarget;

        if (oldEditingTarget !== this._editingTarget) {
            this.requestToolboxExtensionsUpdate();
        }
    }

    /**
     * Get a target representing the Scratch stage, if one exists.
     * @return {?Target} The target, if found.
     */
    getTargetForStage() {
        for (let i = 0; i < this.targets.length; i++) {
            const target = this.targets[i];
            if (target.isStage) {
                return target;
            }
        }
        return null;
    }

    /**
     * Get the editing target.
     * @return {?Target} The editing target.
     */
    getEditingTarget() {
        return this._editingTarget;
    }

    /**
     * Get the label or label function for an opcode
     * @param {string} extendedOpcode - the opcode you want a label for
     * @return {object} - object with label and category
     * @property {string} category - the category for this opcode
     * @property {Function} [labelFn] - function to generate the label for this opcode
     * @property {string} [label] - the label for this opcode if `labelFn` is absent
     */
    getLabelForOpcode(extendedOpcode) {
        const [category, opcode] = StringUtil.splitFirst(extendedOpcode, "_");
        if (!(category && opcode)) return;

        const categoryInfo = this._blockInfo.find((ci) => ci.id === category);
        if (!categoryInfo) return;

        const block = categoryInfo.blocks.find((b) => b.info.opcode === opcode);
        if (!block) return;

        // TODO: we may want to format the label in a locale-specific way.
        // eslint-disable-next-line consistent-return
        return {
            category: "extension", // This assumes that all extensions have the same monitor color.
            label: `${categoryInfo.name}: ${block.info.text}`,
        };
    }

    /**
     * Draw all targets.
     */
    draw() {
        if (this.renderer) {
            this.renderer.draw();
        }
    }

    /**
     * Tell the runtime to request a redraw.
     * Use after a clone/sprite has completed some visible operation on the stage.
     */
    requestRedraw() {
        this.redrawRequested = true;
    }

    /**
     * Emit a targets update at the end of the step if the provided target is
     * the original sprite
     * @param {!Target} target Target requesting the targets update
     */
    requestTargetsUpdate(target) {
        if (!target.isOriginal) return;
        this._refreshTargets = true;
    }

    /**
     * Emit an event that indicates that the blocks on the workspace need updating.
     */
    requestBlocksUpdate() {
        this.emit(Runtime.BLOCKS_NEED_UPDATE);
    }

    /**
     * Emit an event that indicates that the toolbox extension blocks need updating.
     */
    requestToolboxExtensionsUpdate() {
        this.emit(Runtime.TOOLBOX_EXTENSIONS_NEED_UPDATE);
    }

    /**
     * Start listening for events from python
     */
    start() {
        // Do not start if we are already running
        if (this._steppingInterval) return;

        const interval = Runtime.RENDER_INTERVAL;
        this.currentStepTime = interval;
        this._steppingInterval = setInterval(() => {
            this.draw();
        }, interval);
        this.emit(Runtime.RUNTIME_STARTED);
    }

    /**
     * Quit the Runtime, clearing any handles which might keep the process alive.
     * Do not use the runtime after calling this method. This method is meant for test shutdown.
     */
    quit() {
        clearInterval(this._steppingInterval);
        this._steppingInterval = null;
        this._threads = {};
    }

    // -----------------------------------------------------------------------------
    // -----------------------------------------------------------------------------

    /**
     * Start all relevant hats.
     * @param {Array.<string>} requestedHatOpcode Opcode of hats to start.
     * @param {object=} optMatchFields Optionally, fields to match on the hat.
     * @param {Target=} optTarget Optionally, a target to restrict to.
     * @return {Array.<Thread>} List of threads started by this function.
     */
    async startHats(hat, option) {
        const executionPromises = [];
        this.targets.forEach((target) => {
            executionPromises.push(target.startHat(hat, option));
        });
        await Promise.all(executionPromises);
    }

    getThreadById(threadId) {
        let foundThread = null;
        this.targets.forEach((target) => {
            if (target.hasThread(threadId)) {
                foundThread = target.getThread(threadId);
            }
        });
        return foundThread;
    }

    updateThreadScript(threadId, script) {
        const thread = this.getThreadById(threadId);
        thread.updateThreadScript(script);
    }

    updateThreadTriggerEvent(threadId, eventTrigger) {
        const thread = this.getThreadById(threadId);
        thread.updateThreadTriggerEvent(eventTrigger);
    }

    updateThreadTriggerEventOption(threadId, eventTriggerOption) {
        const thread = this.getThreadById(threadId);
        thread.updateThreadTriggerEventOption(eventTriggerOption);
    }

    async addThread(targetId, script, triggerEventId, option, displayName) {
        const target = this.getTargetById(targetId);
        const newThreadId = await target.addThread(script, triggerEventId, option, displayName);
        return newThreadId;
    }

    getTargetByThreadId(threadId) {
        const thread = this.getThreadById(threadId);
        return thread.target;
    }

    deleteThread(threadId) {
        const target = this.getTargetByThreadId(threadId);
        target.deleteThread(threadId);
    }

    getThreadsForTarget(targetId) {
        const target = this.getTargetById(targetId);
        return target.threads;
    }

    updateGlobalVariable(name, value) {
        this._globalVariables[String(name)] = value;
        this.pyatchWorker.loadGlobalVariable(String(name), value);
    }

    removeGlobalVariable(name) {
        delete this._globalVariables[String(name)];
    }

    getGlobalVariables() {
        return Object.keys(this._globalVariables).map((name) => ({ name, value: this._globalVariables[name] }));
    }
}
