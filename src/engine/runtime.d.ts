export = Runtime;
/**
 * Manages targets, scripts, and the sequencer.
 * @constructor
 */
declare class Runtime extends EventEmitter {
    /**
     * Width of the stage, in pixels.
     * @const {number}
     */
    static get STAGE_WIDTH(): number;
    /**
     * Height of the stage, in pixels.
     * @const {number}
     */
    static get STAGE_HEIGHT(): number;
    /**
     * Event name for glowing a script.
     * @const {string}
     */
    static get SCRIPT_GLOW_ON(): string;
    /**
     * Event name for unglowing a script.
     * @const {string}
     */
    static get SCRIPT_GLOW_OFF(): string;
    /**
     * Event name for glowing a block.
     * @const {string}
     */
    static get BLOCK_GLOW_ON(): string;
    /**
     * Event name for unglowing a block.
     * @const {string}
     */
    static get BLOCK_GLOW_OFF(): string;
    /**
     * Event name for a cloud data update
     * to this project.
     * @const {string}
     */
    static get HAS_CLOUD_DATA_UPDATE(): string;
    /**
     * Event name for turning on turbo mode.
     * @const {string}
     */
    static get TURBO_MODE_ON(): string;
    /**
     * Event name for turning off turbo mode.
     * @const {string}
     */
    static get TURBO_MODE_OFF(): string;
    /**
     * Event name for turning on turbo mode.
     * @const {string}
     */
    static get RECORDING_ON(): string;
    /**
     * Event name for turning off turbo mode.
     * @const {string}
     */
    static get RECORDING_OFF(): string;
    /**
     * Event name when the project is started (threads may not necessarily be
     * running).
     * @const {string}
     */
    static get PROJECT_START(): string;
    /**
     * Event name when threads start running.
     * Used by the UI to indicate running status.
     * @const {string}
     */
    static get PROJECT_RUN_START(): string;
    /**
     * Event name when threads stop running
     * Used by the UI to indicate not-running status.
     * @const {string}
     */
    static get PROJECT_RUN_STOP(): string;
    /**
     * Event name for project being stopped or restarted by the user.
     * Used by blocks that need to reset state.
     * @const {string}
     */
    static get PROJECT_STOP_ALL(): string;
    /**
     * Event name for target being stopped by a stop for target call.
     * Used by blocks that need to stop individual targets.
     * @const {string}
     */
    static get STOP_FOR_TARGET(): string;
    /**
     * Event name for visual value report.
     * @const {string}
     */
    static get VISUAL_REPORT(): string;
    /**
     * Event name for project loaded report.
     * @const {string}
     */
    static get PROJECT_LOADED(): string;
    /**
     * Event name for report that a change was made that can be saved
     * @const {string}
     */
    static get PROJECT_CHANGED(): string;
    /**
     * Event name for report that a change was made to an extension in the toolbox.
     * @const {string}
     */
    static get TOOLBOX_EXTENSIONS_NEED_UPDATE(): string;
    /**
     * Event name for targets update report.
     * @const {string}
     */
    static get TARGETS_UPDATE(): string;
    /**
     * Event name for monitors update.
     * @const {string}
     */
    static get MONITORS_UPDATE(): string;
    /**
     * Event name for block drag update.
     * @const {string}
     */
    static get BLOCK_DRAG_UPDATE(): string;
    /**
     * Event name for block drag end.
     * @const {string}
     */
    static get BLOCK_DRAG_END(): string;
    /**
     * Event name for reporting that an extension was added.
     * @const {string}
     */
    static get EXTENSION_ADDED(): string;
    /**
     * Event name for reporting that an extension as asked for a custom field to be added
     * @const {string}
     */
    static get EXTENSION_FIELD_ADDED(): string;
    /**
     * Event name for updating the available set of peripheral devices.
     * This causes the peripheral connection modal to update a list of
     * available peripherals.
     * @const {string}
     */
    static get PERIPHERAL_LIST_UPDATE(): string;
    /**
     * Event name for reporting that a peripheral has connected.
     * This causes the status button in the blocks menu to indicate 'connected'.
     * @const {string}
     */
    static get PERIPHERAL_CONNECTED(): string;
    /**
     * Event name for reporting that a peripheral has been intentionally disconnected.
     * This causes the status button in the blocks menu to indicate 'disconnected'.
     * @const {string}
     */
    static get PERIPHERAL_DISCONNECTED(): string;
    /**
     * Event name for reporting that a peripheral has encountered a request error.
     * This causes the peripheral connection modal to switch to an error state.
     * @const {string}
     */
    static get PERIPHERAL_REQUEST_ERROR(): string;
    /**
     * Event name for reporting that a peripheral connection has been lost.
     * This causes a 'peripheral connection lost' error alert to display.
     * @const {string}
     */
    static get PERIPHERAL_CONNECTION_LOST_ERROR(): string;
    /**
     * Event name for reporting that a peripheral has not been discovered.
     * This causes the peripheral connection modal to show a timeout state.
     * @const {string}
     */
    static get PERIPHERAL_SCAN_TIMEOUT(): string;
    /**
     * Event name to indicate that the microphone is being used to stream audio.
     * @const {string}
     */
    static get MIC_LISTENING(): string;
    /**
     * Event name for reporting that blocksInfo was updated.
     * @const {string}
     */
    static get BLOCKSINFO_UPDATE(): string;
    /**
     * Event name when the runtime tick loop has been started.
     * @const {string}
     */
    static get RUNTIME_STARTED(): string;
    /**
     * Event name when the runtime dispose has been called.
     * @const {string}
     */
    static get RUNTIME_DISPOSED(): string;
    /**
     * Event name for reporting that a block was updated and needs to be rerendered.
     * @const {string}
     */
    static get BLOCKS_NEED_UPDATE(): string;
    /**
     * How rapidly we try to step threads by default, in ms.
     */
    static get THREAD_STEP_INTERVAL(): number;
    /**
     * In compatibility mode, how rapidly we try to step threads, in ms.
     */
    static get THREAD_STEP_INTERVAL_COMPATIBILITY(): number;
    /**
     * How many clones can be created at a time.
     * @const {number}
     */
    static get MAX_CLONES(): number;
    constructor();
    /**
     * Target management and storage.
     * @type {Array.<!import("./target")>}
     */
    targets: Array<import("./target")>;
    /**
     * Targets in reverse order of execution. Shares its order with drawables.
     * @type {Array.<!import("./target")>}
     */
    executableTargets: Array<import("./target")>;
    /**
     * A list of threads that are currently running in the VM.
     * Threads are added when execution starts and pruned when execution ends.
     * @type {Array.<Thread>}
     */
    threads: Array<Thread>;
    /** @type {!Sequencer} */
    sequencer: Sequencer;
    /**
     * Storage container for flyout blocks.
     * These will execute on `_editingTarget.`
     * @type {!Blocks}
     */
    flyoutBlocks: Blocks;
    /**
     * Storage container for monitor blocks.
     * These will execute on a target maybe
     * @type {!Blocks}
     */
    monitorBlocks: Blocks;
    /**
     * Currently known editing target for the VM.
     * @type {?import("./target")}
     */
    _editingTarget: import("./target") | null;
    /**
     * Map to look up a block primitive's implementation function by its opcode.
     * This is a two-step lookup: package name first, then primitive name.
     * @type {Object.<string, Function>}
     */
    _primitives: {
        [x: string]: Function;
    };
    /**
     * Map to look up all block information by extended opcode.
     * @type {Array.<CategoryInfo>}
     * @private
     */
    private _blockInfo;
    /**
     * Map to look up hat blocks' metadata.
     * Keys are opcode for hat, values are metadata objects.
     * @type {Object.<string, Object>}
     */
    _hats: {
        [x: string]: any;
    };
    /**
     * A list of script block IDs that were glowing during the previous frame.
     * @type {!Array.<!string>}
     */
    _scriptGlowsPreviousFrame: Array<string>;
    /**
     * Number of non-monitor threads running during the previous frame.
     * @type {number}
     */
    _nonMonitorThreadCount: number;
    /**
     * All threads that finished running and were removed from this.threads
     * by behaviour in Sequencer.stepThreads.
     * @type {Array<Thread>}
     */
    _lastStepDoneThreads: Array<Thread>;
    /**
     * Currently known number of clones, used to enforce clone limit.
     * @type {number}
     */
    _cloneCounter: number;
    /**
     * Flag to emit a targets update at the end of a step. When target data
     * changes, this flag is set to true.
     * @type {boolean}
     */
    _refreshTargets: boolean;
    /**
     * Map to look up all monitor block information by opcode.
     * @type {object}
     * @private
     */
    private monitorBlockInfo;
    /**
     * Ordered map of all monitors, which are MonitorReporter objects.
     */
    _monitorState: OrderedMap<string, any>;
    /**
     * Monitor state from last tick
     */
    _prevMonitorState: OrderedMap<string, any>;
    /**
     * Whether the project is in "turbo mode."
     * @type {Boolean}
     */
    turboMode: boolean;
    /**
     * Whether the project is in "compatibility mode" (30 TPS).
     * @type {Boolean}
     */
    compatibilityMode: boolean;
    /**
     * A reference to the current runtime stepping interval, set
     * by a `setInterval`.
     * @type {!number}
     */
    _steppingInterval: number;
    /**
     * Current length of a step.
     * Changes as mode switches, and used by the sequencer to calculate
     * WORK_TIME.
     * @type {!number}
     */
    currentStepTime: number;
    /**
     * Whether any primitive has requested a redraw.
     * Affects whether `Sequencer.stepThreads` will yield
     * after stepping each thread.
     * Reset on every frame.
     * @type {boolean}
     */
    redrawRequested: boolean;
    /** @type {Object.<string, Object>} */
    ioDevices: {
        [x: string]: any;
    };
    /**
     * A list of extensions, used to manage hardware connection.
     */
    peripheralExtensions: {};
    /**
     * A runtime profiler that records timed events for later playback to
     * diagnose Scratch performance.
     * @type {Profiler}
     */
    profiler: Profiler;
    /**
     * Check wether the runtime has any cloud data.
     * @type {function}
     * @return {boolean} Whether or not the runtime currently has any
     * cloud variables.
     */
    hasCloudData: Function;
    /**
     * A function which checks whether a new cloud variable can be added
     * to the runtime.
     * @type {function}
     * @return {boolean} Whether or not a new cloud variable can be added
     * to the runtime.
     */
    canAddCloudVariable: Function;
    /**
     * A function that tracks a new cloud variable in the runtime,
     * updating the cloud variable limit. Calling this function will
     * emit a cloud data update event if this is the first cloud variable
     * being added.
     * @type {function}
     */
    addCloudVariable: Function;
    /**
     * A function which updates the runtime's cloud variable limit
     * when removing a cloud variable and emits a cloud update event
     * if the last of the cloud variables is being removed.
     * @type {function}
     */
    removeCloudVariable: Function;
    /**
     * A string representing the origin of the current project from outside of the
     * Scratch community, such as CSFirst.
     * @type {?string}
     */
    origin: string | null;
    _initializeAddCloudVariable(newCloudDataManager: any): () => void;
    _initializeRemoveCloudVariable(newCloudDataManager: any): () => void;
    /**
     * Register default block packages with this runtime.
     * @todo Prefix opcodes with package name.
     * @private
     */
    private _registerBlockPackages;
    getMonitorState(): OrderedMap<string, any>;
    /**
     * Generate an extension-specific menu ID.
     * @param {string} menuName - the name of the menu.
     * @param {string} extensionId - the ID of the extension hosting the menu.
     * @returns {string} - the constructed ID.
     * @private
     */
    private _makeExtensionMenuId;
    /**
     * Create a context ("args") object for use with `formatMessage` on messages which might be target-specific.
     * @param {import("./target")} [target] - the target to use as context. If a target is not provided, default to the current
     * editing target or the stage.
     */
    makeMessageContextForTarget(target?: import("./target")): void;
    /**
     * Register the primitives provided by an extension.
     * @param {ExtensionMetadata} extensionInfo - information about the extension (id, blocks, etc.)
     * @private
     */
    private _registerExtensionPrimitives;
    /**
     * Reregister the primitives for an extension
     * @param  {ExtensionMetadata} extensionInfo - new info (results of running getInfo) for an extension
     * @private
     */
    private _refreshExtensionPrimitives;
    /**
     * Read extension information, convert menus, blocks and custom field types
     * and store the results in the provided category object.
     * @param {CategoryInfo} categoryInfo - the category to be filled
     * @param {ExtensionMetadata} extensionInfo - the extension metadata to read
     * @private
     */
    private _fillExtensionCategory;
    /**
     * Convert the given extension menu items into the scratch-blocks style of list of pairs.
     * If the menu is dynamic (e.g. the passed in argument is a function), return the input unmodified.
     * @param {object} menuItems - an array of menu items or a function to retrieve such an array
     * @returns {object} - an array of 2 element arrays or the original input function
     * @private
     */
    private _convertMenuItems;
    /**
     * Build the scratch-blocks JSON for a menu. Note that scratch-blocks treats menus as a special kind of block.
     * @param {string} menuName - the name of the menu
     * @param {object} menuInfo - a description of this menu and its items
     * @property {*} items - an array of menu items or a function to retrieve such an array
     * @property {boolean} [acceptReporters] - if true, allow dropping reporters onto this menu
     * @param {CategoryInfo} categoryInfo - the category for this block
     * @returns {object} - a JSON-esque object ready for scratch-blocks' consumption
     * @private
     */
    private _buildMenuForScratchBlocks;
    _buildCustomFieldInfo(fieldName: any, fieldInfo: any, extensionId: any, categoryInfo: any): {
        fieldName: any;
        extendedName: string;
        argumentTypeInfo: {
            shadow: {
                type: string;
                fieldName: string;
            };
        };
        scratchBlocksDefinition: any;
        fieldImplementation: any;
    };
    /**
     * Build the scratch-blocks JSON needed for a fieldType.
     * Custom field types need to be namespaced to the extension so that extensions can't interfere with each other
     * @param  {string} fieldName - The name of the field
     * @param {string} output - The output of the field
     * @param {number} outputShape - Shape of the field (from ScratchBlocksConstants)
     * @param {object} categoryInfo - The category the field belongs to (Used to set its colors)
     * @returns {object} - Object to be inserted into scratch-blocks
     */
    _buildCustomFieldTypeForScratchBlocks(fieldName: string, output: string, outputShape: number, categoryInfo: object): object;
    /**
     * Convert ExtensionBlockMetadata into data ready for scratch-blocks.
     * @param {ExtensionBlockMetadata} blockInfo - the block info to convert
     * @param {CategoryInfo} categoryInfo - the category for this block
     * @returns {ConvertedBlockInfo} - the converted & original block information
     * @private
     */
    private _convertForScratchBlocks;
    /**
     * Convert ExtensionBlockMetadata into scratch-blocks JSON & XML, and generate a proxy function.
     * @param {ExtensionBlockMetadata} blockInfo - the block to convert
     * @param {CategoryInfo} categoryInfo - the category for this block
     * @returns {ConvertedBlockInfo} - the converted & original block information
     * @private
     */
    private _convertBlockForScratchBlocks;
    /**
     * Generate a separator between blocks categories or sub-categories.
     * @param {ExtensionBlockMetadata} blockInfo - the block to convert
     * @param {CategoryInfo} categoryInfo - the category for this block
     * @returns {ConvertedBlockInfo} - the converted & original block information
     * @private
     */
    private _convertSeparatorForScratchBlocks;
    /**
     * Convert a button for scratch-blocks. A button has no opcode but specifies a callback name in the `func` field.
     * @param {ExtensionBlockMetadata} buttonInfo - the button to convert
     * @property {string} func - the callback name
     * @param {CategoryInfo} categoryInfo - the category for this button
     * @returns {ConvertedBlockInfo} - the converted & original button information
     * @private
     */
    private _convertButtonForScratchBlocks;
    /**
     * Helper for _convertPlaceholdes which handles inline images which are a specialized case of block "arguments".
     * @param {object} argInfo Metadata about the inline image as specified by the extension
     * @return {object} JSON blob for a scratch-blocks image field.
     * @private
     */
    private _constructInlineImageJson;
    /**
     * Helper for _convertForScratchBlocks which handles linearization of argument placeholders. Called as a callback
     * from string#replace. In addition to the return value the JSON and XML items in the context will be filled.
     * @param {object} context - information shared with _convertForScratchBlocks about the block, etc.
     * @param {string} match - the overall string matched by the placeholder regex, including brackets: '[FOO]'.
     * @param {string} placeholder - the name of the placeholder being matched: 'FOO'.
     * @return {string} scratch-blocks placeholder for the argument: '%1'.
     * @private
     */
    private _convertPlaceholders;
    /**
     * @returns {Array.<object>} scratch-blocks XML for each category of extension blocks, in category order.
     * @param {?import("./target")} [target] - the active editing target (optional)
     * @property {string} id - the category / extension ID
     * @property {string} xml - the XML text for this category, starting with `<category>` and ending with `</category>`
     */
    getBlocksXML(target?: import("./target") | null): Array<object>;
    /**
     * @returns {Array.<string>} - an array containing the scratch-blocks JSON information for each dynamic block.
     */
    getBlocksJSON(): Array<string>;
    /**
     * One-time initialization for Scratch Link support.
     */
    _initScratchLink(): void;
    /**
     * Get a scratch link socket.
     * @param {string} type Either BLE or BT
     * @returns {import("../util/scratch-link-websocket")} The scratch link socket.
     */
    getScratchLinkSocket(type: string): import("../util/scratch-link-websocket");
    /**
     * Configure how ScratchLink sockets are created. Factory must consume a "type" parameter
     * either BT or BLE.
     * @param {Function} factory The new factory for creating ScratchLink sockets.
     */
    configureScratchLinkSocketFactory(factory: Function): void;
    _linkSocketFactory: Function;
    /**
     * The default scratch link socket creator, using websockets to the installed device manager.
     * @param {string} type Either BLE or BT
     * @returns {import("../util/scratch-link-websocket")} The new scratch link socket (a WebSocket object)
     */
    _defaultScratchLinkSocketFactory(type: string): import("../util/scratch-link-websocket");
    /**
     * Register an extension that communications with a hardware peripheral by id,
     * to have access to it and its peripheral functions in the future.
     * @param {string} extensionId - the id of the extension.
     * @param {object} extension - the extension to register.
     */
    registerPeripheralExtension(extensionId: string, extension: object): void;
    /**
     * Tell the specified extension to scan for a peripheral.
     * @param {string} extensionId - the id of the extension.
     */
    scanForPeripheral(extensionId: string): void;
    /**
     * Connect to the extension's specified peripheral.
     * @param {string} extensionId - the id of the extension.
     * @param {number} peripheralId - the id of the peripheral.
     */
    connectPeripheral(extensionId: string, peripheralId: number): void;
    /**
     * Disconnect from the extension's connected peripheral.
     * @param {string} extensionId - the id of the extension.
     */
    disconnectPeripheral(extensionId: string): void;
    /**
     * Returns whether the extension has a currently connected peripheral.
     * @param {string} extensionId - the id of the extension.
     * @return {boolean} - whether the extension has a connected peripheral.
     */
    getPeripheralIsConnected(extensionId: string): boolean;
    /**
     * Emit an event to indicate that the microphone is being used to stream audio.
     * @param {boolean} listening - true if the microphone is currently listening.
     */
    emitMicListening(listening: boolean): void;
    /**
     * Retrieve the function associated with the given opcode.
     * @param {!string} opcode The opcode to look up.
     * @return {Function} The function which implements the opcode.
     */
    getOpcodeFunction(opcode: string): Function;
    /**
     * Return whether an opcode represents a hat block.
     * @param {!string} opcode The opcode to look up.
     * @return {boolean} True if the op is known to be a hat.
     */
    getIsHat(opcode: string): boolean;
    /**
     * Return whether an opcode represents an edge-activated hat block.
     * @param {!string} opcode The opcode to look up.
     * @return {boolean} True if the op is known to be a edge-activated hat.
     */
    getIsEdgeActivatedHat(opcode: string): boolean;
    /**
     * Attach the audio engine
     * @param {!import("scratch-audio")} audioEngine The audio engine to attach
     */
    attachAudioEngine(audioEngine: any): void;
    audioEngine: any;
    /**
     * Attach the renderer
     * @param {!import("scratch-render")} renderer The renderer to attach (TODO: get typings for: ../scratch-render/src/index.js)
     */
    attachRenderer(renderer: any): void;
    renderer: any;
    /**
     * Set the svg adapter, which converts scratch 2 svgs to scratch 3 svgs
     * @param {!import('scratch-svg-renderer').SVGRenderer} svgAdapter The adapter to attach
     */
    attachV2SVGAdapter(svgAdapter: any): void;
    v2SvgAdapter: any;
    /**
     * Set the bitmap adapter for the VM/runtime, which converts scratch 2
     * bitmaps to scratch 3 bitmaps. (Scratch 3 bitmaps are all bitmap resolution 2)
     * @param {!function} bitmapAdapter The adapter to attach
     */
    attachV2BitmapAdapter(bitmapAdapter: Function): void;
    v2BitmapAdapter: Function;
    /**
     * Attach the storage module
     * @param {!import("scratch-storage")} storage The storage module to attach
     */
    attachStorage(storage: any): void;
    storage: any;
    /**
     * Create a thread and push it to the list of threads.
     * @param {!string} id ID of block that starts the stack.
     * @param {!import("./target")} target Target to run thread on.
     * @param {?object} opts optional arguments
     * @param {?boolean} opts.stackClick true if the script was activated by clicking on the stack
     * @param {?boolean} opts.updateMonitor true if the script should update a monitor value
     * @return {!Thread} The newly created thread.
     */
    _pushThread(id: string, target: import("./target"), opts: object | null): Thread;
    /**
     * Stop a thread: stop running it immediately, and remove it from the thread list later.
     * @param {!Thread} thread Thread object to remove from actives
     */
    _stopThread(thread: Thread): void;
    /**
     * Restart a thread in place, maintaining its position in the list of threads.
     * This is used by `startHats` to and is necessary to ensure 2.0-like execution order.
     * Test project: https://scratch.mit.edu/projects/130183108/
     * @param {!Thread} thread Thread object to restart.
     * @return {Thread} The restarted thread.
     */
    _restartThread(thread: Thread): Thread;
    /**
     * Return whether a thread is currently active/running.
     * @param {?Thread} thread Thread object to check.
     * @return {boolean} True if the thread is active/running.
     */
    isActiveThread(thread: Thread | null): boolean;
    /**
     * Return whether a thread is waiting for more information or done.
     * @param {?Thread} thread Thread object to check.
     * @return {boolean} True if the thread is waiting
     */
    isWaitingThread(thread: Thread | null): boolean;
    /**
     * Toggle a script.
     * @param {!string} topBlockId ID of block that starts the script.
     * @param {?object} opts optional arguments to toggle script
     * @param {?string} opts.target target ID for target to run script on. If not supplied, uses editing target.
     * @param {?boolean} opts.stackClick true if the user activated the stack by clicking, false if not. This
     *     determines whether we show a visual report when turning on the script.
     */
    toggleScript(topBlockId: string, opts: object | null): void;
    /**
     * Enqueue a script that when finished will update the monitor for the block.
     * @param {!string} topBlockId ID of block that starts the script.
     * @param {?import("./target")} optTarget target Target to run script on. If not supplied, uses editing target.
     */
    addMonitorScript(topBlockId: string, optTarget: import("./target") | null): void;
    /**
     * Run a function `f` for all scripts in a workspace.
     * `f` will be called with two parameters:
     *  - the top block ID of the script.
     *  - the target that owns the script.
     * @param {!Function} f Function to call for each script.
     * @param {import("./target")=} optTarget Optionally, a target to restrict to.
     */
    allScriptsDo(f: Function, optTarget?: import("./target") | undefined): void;
    allScriptsByOpcodeDo(opcode: any, f: any, optTarget: any): void;
    /**
     * Start all relevant hats.
     * @param {!string} requestedHatOpcode Opcode of hats to start.
     * @param {object=} optMatchFields Optionally, fields to match on the hat.
     * @param {import("./target")=} optTarget Optionally, a target to restrict to.
     * @return {Array.<Thread>} List of threads started by this function.
     */
    startHats(requestedHatOpcode: string, optMatchFields?: object | undefined, optTarget?: import("./target") | undefined): Array<Thread>;
    /**
     * Dispose all targets. Return to clean state.
     */
    dispose(): void;
    /**
     * Add a target to the runtime. This tracks the sprite pane
     * ordering of the target. The target still needs to be put
     * into the correct execution order after calling this function.
     * @param {import("./target")} target target to add
     */
    addTarget(target: import("./target")): void;
    /**
     * Move a target in the execution order by a relative amount.
     *
     * A positve number will make the target execute earlier. A negative number
     * will make the target execute later in the order.
     *
     * @param {import("./target")} executableTarget target to move
     * @param {number} delta number of positions to move target by
     * @returns {number} new position in execution order
     */
    moveExecutable(executableTarget: import("./target"), delta: number): number;
    /**
     * Set a target to execute at a specific position in the execution order.
     *
     * Infinity will set the target to execute first. 0 will set the target to
     * execute last (before the stage).
     *
     * @param {import("./target")} executableTarget target to move
     * @param {number} newIndex position in execution order to place the target
     * @returns {number} new position in the execution order
     */
    setExecutablePosition(executableTarget: import("./target"), newIndex: number): number;
    /**
     * Remove a target from the execution set.
     * @param {import("./target")} executableTarget target to remove
     */
    removeExecutable(executableTarget: import("./target")): void;
    /**
     * Dispose of a target.
     * @param {!import("./target")} disposingTarget Target to dispose of.
     */
    disposeTarget(disposingTarget: import("./target")): void;
    /**
     * Stop any threads acting on the target.
     * @param {!import("./target")} target Target to stop threads for.
     * @param {Thread=} optThreadException Optional thread to skip.
     */
    stopForTarget(target: import("./target"), optThreadException?: Thread | undefined): void;
    /**
     * Start all threads that start with the green flag.
     */
    greenFlag(): void;
    /**
     * Stop "everything."
     */
    stopAll(): void;
    /**
     * Repeatedly run `sequencer.stepThreads` and filter out
     * inactive threads after each iteration.
     */
    _step(): void;
    /**
     * Get the number of threads in the given array that are monitor threads (threads
     * that update monitor values, and don't count as running a script).
     * @param {!Array.<Thread>} threads The set of threads to look through.
     * @return {number} The number of monitor threads in threads.
     */
    _getMonitorThreadCount(threads: Array<Thread>): number;
    /**
     * Queue monitor blocks to sequencer to be run.
     */
    _pushMonitors(): void;
    /**
     * Set the current editing target known by the runtime.
     * @param {!import("./target")} editingTarget New editing target.
     */
    setEditingTarget(editingTarget: import("./target")): void;
    /**
     * Set whether we are in 30 TPS compatibility mode.
     * @param {boolean} compatibilityModeOn True iff in compatibility mode.
     */
    setCompatibilityMode(compatibilityModeOn: boolean): void;
    /**
     * Emit glows/glow clears for scripts after a single tick.
     * Looks at `this.threads` and notices which have turned on/off new glows.
     * @param {Array.<Thread>=} optExtraThreads Optional list of inactive threads.
     */
    _updateGlows(optExtraThreads?: Array<Thread> | undefined): void;
    /**
     * Emit run start/stop after each tick. Emits when `this.threads.length` goes
     * between non-zero and zero
     *
     * @param {number} nonMonitorThreadCount The new nonMonitorThreadCount
     */
    _emitProjectRunStatus(nonMonitorThreadCount: number): void;
    /**
     * "Quiet" a script's glow: stop the VM from generating glow/unglow events
     * about that script. Use when a script has just been deleted, but we may
     * still be tracking glow data about it.
     * @param {!string} scriptBlockId Id of top-level block in script to quiet.
     */
    quietGlow(scriptBlockId: string): void;
    /**
     * Emit feedback for block glowing (used in the sequencer).
     * @param {?string} blockId ID for the block to update glow
     * @param {boolean} isGlowing True to turn on glow; false to turn off.
     */
    glowBlock(blockId: string | null, isGlowing: boolean): void;
    /**
     * Emit feedback for script glowing.
     * @param {?string} topBlockId ID for the top block to update glow
     * @param {boolean} isGlowing True to turn on glow; false to turn off.
     */
    glowScript(topBlockId: string | null, isGlowing: boolean): void;
    /**
     * Emit whether blocks are being dragged over gui
     * @param {boolean} areBlocksOverGui True if blocks are dragged out of blocks workspace, false otherwise
     */
    emitBlockDragUpdate(areBlocksOverGui: boolean): void;
    /**
     * Emit event to indicate that the block drag has ended with the blocks outside the blocks workspace
     * @param {Array.<object>} blocks The set of blocks dragged to the GUI
     * @param {string} topBlockId The original id of the top block being dragged
     */
    emitBlockEndDrag(blocks: Array<object>, topBlockId: string): void;
    /**
     * Emit value for reporter to show in the blocks.
     * @param {string} blockId ID for the block.
     * @param {string} value Value to show associated with the block.
     */
    visualReport(blockId: string, value: string): void;
    /**
     * Add a monitor to the state. If the monitor already exists in the state,
     * updates those properties that are defined in the given monitor record.
     * @param {!import("./monitor-record")} monitor Monitor to add.
     */
    requestAddMonitor(monitor: import("immutable").Record.Class): void;
    /**
     * Update a monitor in the state and report success/failure of update.
     * @param {!Map} monitor Monitor values to update. Values on the monitor with overwrite
     *     values on the old monitor with the same ID. If a value isn't defined on the new monitor,
     *     the old monitor will keep its old value.
     * @return {boolean} true if monitor exists in the state and was updated, false if it did not exist.
     */
    requestUpdateMonitor(monitor: Map<any, any>): boolean;
    /**
     * Removes a monitor from the state. Does nothing if the monitor already does
     * not exist in the state.
     * @param {!string} monitorId ID of the monitor to remove.
     */
    requestRemoveMonitor(monitorId: string): void;
    /**
     * Hides a monitor and returns success/failure of action.
     * @param {!string} monitorId ID of the monitor to hide.
     * @return {boolean} true if monitor exists and was updated, false otherwise
     */
    requestHideMonitor(monitorId: string): boolean;
    /**
     * Shows a monitor and returns success/failure of action.
     * not exist in the state.
     * @param {!string} monitorId ID of the monitor to show.
     * @return {boolean} true if monitor exists and was updated, false otherwise
     */
    requestShowMonitor(monitorId: string): boolean;
    /**
     * Removes all monitors with the given target ID from the state. Does nothing if
     * the monitor already does not exist in the state.
     * @param {!string} targetId Remove all monitors with given target ID.
     */
    requestRemoveMonitorByTargetId(targetId: string): void;
    /**
     * Get a target by its id.
     * @param {string} targetId Id of target to find.
     * @return {?import("./target")} The target, if found.
     */
    getTargetById(targetId: string): import("./target") | null;
    /**
     * Get the first original (non-clone-block-created) sprite given a name.
     * @param {string} spriteName Name of sprite to look for.
     * @return {?import("./target")} Target representing a sprite of the given name.
     */
    getSpriteTargetByName(spriteName: string): import("./target") | null;
    /**
     * Get a target by its drawable id.
     * @param {number} drawableID drawable id of target to find
     * @return {?import("./target")} The target, if found
     */
    getTargetByDrawableId(drawableID: number): import("./target") | null;
    /**
     * Update the clone counter to track how many clones are created.
     * @param {number} changeAmount How many clones have been created/destroyed.
     */
    changeCloneCounter(changeAmount: number): void;
    /**
     * Return whether there are clones available.
     * @return {boolean} True until the number of clones hits Runtime.MAX_CLONES.
     */
    clonesAvailable(): boolean;
    /**
     * Report that the project has loaded in the Virtual Machine.
     */
    emitProjectLoaded(): void;
    /**
     * Report that the project has changed in a way that would affect serialization
     */
    emitProjectChanged(): void;
    /**
     * Report that a new target has been created, possibly by cloning an existing target.
     * @param {import("./target")} newTarget - the newly created target.
     * @param {import("./target")} [sourceTarget] - the target used as a source for the new clone, if any.
     * @fires Runtime#targetWasCreated
     */
    fireTargetWasCreated(newTarget: import("./target"), sourceTarget?: import("./target")): void;
    /**
     * Report that a clone target is being removed.
     * @param {import("./target")} target - the target being removed
     * @fires Runtime#targetWasRemoved
     */
    fireTargetWasRemoved(target: import("./target")): void;
    /**
     * Get a target representing the Scratch stage, if one exists.
     * @return {?import("./target")} The target, if found.
     */
    getTargetForStage(): import("./target") | null;
    /**
     * Get the editing target.
     * @return {?import("./target")} The editing target.
     */
    getEditingTarget(): import("./target") | null;
    getAllVarNamesOfType(varType: any): any[];
    /**
     * Get the label or label function for an opcode
     * @param {string} extendedOpcode - the opcode you want a label for
     * @return {object} - object with label and category
     * @property {string} category - the category for this opcode
     * @property {Function} [labelFn] - function to generate the label for this opcode
     * @property {string} [label] - the label for this opcode if `labelFn` is absent
     */
    getLabelForOpcode(extendedOpcode: string): object;
    /**
     * Create a new global variable avoiding conflicts with other variable names.
     * @param {string} variableName The desired variable name for the new global variable.
     * This can be turned into a fresh name as necessary.
     * @param {string} optVarId An optional ID to use for the variable. A new one will be generated
     * if a falsey value for this parameter is provided.
     * @param {string} optVarType The type of the variable to create. Defaults to Variable.SCALAR_TYPE.
     * @return {Variable} The new variable that was created.
     */
    createNewGlobalVariable(variableName: string, optVarId: string, optVarType: string): Variable;
    /**
     * Tell the runtime to request a redraw.
     * Use after a clone/sprite has completed some visible operation on the stage.
     */
    requestRedraw(): void;
    /**
     * Emit a targets update at the end of the step if the provided target is
     * the original sprite
     * @param {!import("./target")} target Target requesting the targets update
     */
    requestTargetsUpdate(target: import("./target")): void;
    /**
     * Emit an event that indicates that the blocks on the workspace need updating.
     */
    requestBlocksUpdate(): void;
    /**
     * Emit an event that indicates that the toolbox extension blocks need updating.
     */
    requestToolboxExtensionsUpdate(): void;
    /**
     * Set up timers to repeatedly step in a browser.
     */
    start(): void;
    /**
     * Quit the Runtime, clearing any handles which might keep the process alive.
     * Do not use the runtime after calling this method. This method is meant for test shutdown.
     */
    quit(): void;
    /**
     * Turn on profiling.
     * @param {Profiler/FrameCallback} onFrame A callback handle passed a
     * profiling frame when the profiler reports its collected data.
     */
    enableProfiling(onFrame: any): void;
    /**
     * Turn off profiling.
     */
    disableProfiling(): void;
    /**
     * Update a millisecond timestamp value that is saved on the Runtime.
     * This value is helpful in certain instances for compatibility with Scratch 2,
     * which sometimes uses a `currentMSecs` timestamp value in Interpreter.as
     */
    updateCurrentMSecs(): void;
    currentMSecs: number;
    /**
     * Get a refernce to the extension manager
     * @returns {import("../extension-support/extension-manager")}
     */
    getExtensionManager(): import("../extension-support/extension-manager");
    /**
     * Loads a costume asset in
     */
    addCostume(costume: any): Promise<any>;
}
declare namespace Runtime {
    export { CloudDataManager };
}
import EventEmitter = require("events");
import Thread = require("./thread");
import Sequencer = require("./sequencer");
import Blocks = require("./blocks");
import { OrderedMap } from "immutable";
import Profiler = require("./profiler");
import Variable = require("./variable");
/**
 * A pair of functions used to manage the cloud variable limit,
 * to be used when adding (or attempting to add) or removing a cloud variable.
 */
type CloudDataManager = {
    /**
     * A function to call to check that
     * a cloud variable can be added.
     */
    canAddCloudVariable: Function;
    /**
     * A function to call to track a new
     * cloud variable on the runtime.
     */
    addCloudVariable: Function;
    /**
     * A function to call when
     * removing an existing cloud variable.
     */
    removeCloudVariable: Function;
    /**
     * A function to call to check that
     * the runtime has any cloud variables.
     */
    hasCloudVariables: Function;
};
