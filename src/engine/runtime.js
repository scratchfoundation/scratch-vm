const EventEmitter = require('events');
const {OrderedMap} = require('immutable');
const escapeHtml = require('escape-html');

const ArgumentType = require('../extension-support/argument-type');
const Blocks = require('./blocks');
const BlockType = require('../extension-support/block-type');
const Profiler = require('./profiler');
const Sequencer = require('./sequencer');
const ScratchBlocksConstants = require('./scratch-blocks-constants');
const TargetType = require('../extension-support/target-type');
const Thread = require('./thread');
const log = require('../util/log');
const maybeFormatMessage = require('../util/maybe-format-message');
const StageLayering = require('./stage-layering');
const Variable = require('./variable');

// Virtual I/O devices.
const Clock = require('../io/clock');
const Cloud = require('../io/cloud');
const DeviceManager = require('../io/deviceManager');
const Keyboard = require('../io/keyboard');
const Mouse = require('../io/mouse');
const MouseWheel = require('../io/mouseWheel');
const UserData = require('../io/userData');
const Video = require('../io/video');

const StringUtil = require('../util/string-util');
const uid = require('../util/uid');

const defaultBlockPackages = {
    scratch3_control: require('../blocks/scratch3_control'),
    scratch3_event: require('../blocks/scratch3_event'),
    scratch3_looks: require('../blocks/scratch3_looks'),
    scratch3_motion: require('../blocks/scratch3_motion'),
    scratch3_operators: require('../blocks/scratch3_operators'),
    scratch3_sound: require('../blocks/scratch3_sound'),
    scratch3_sensing: require('../blocks/scratch3_sensing'),
    scratch3_data: require('../blocks/scratch3_data'),
    scratch3_procedures: require('../blocks/scratch3_procedures')
};

/**
 * Information used for converting Scratch argument types into scratch-blocks data.
 * @type {object.<ArgumentType, {shadowType: string, fieldType: string}>}
 */
const ArgumentTypeMap = (() => {
    const map = {};
    map[ArgumentType.ANGLE] = {
        shadowType: 'math_angle',
        fieldType: 'NUM'
    };
    map[ArgumentType.COLOR] = {
        shadowType: 'colour_picker'
    };
    map[ArgumentType.NUMBER] = {
        shadowType: 'math_number',
        fieldType: 'NUM'
    };
    map[ArgumentType.STRING] = {
        shadowType: 'text',
        fieldType: 'TEXT'
    };
    map[ArgumentType.BOOLEAN] = {
        check: 'Boolean'
    };
    map[ArgumentType.MATRIX] = {
        shadowType: 'matrix',
        fieldType: 'MATRIX'
    };
    return map;
})();

/**
 * Predefined "Converted block info" for a separator between blocks in a block category
 * @type {ConvertedBlockInfo}
 */
const ConvertedSeparator = {
    info: {},
    json: null,
    xml: '<sep gap="36"/>'
};

/**
 * Numeric ID for Runtime._step in Profiler instances.
 * @type {number}
 */
let stepProfilerId = -1;

/**
 * Numeric ID for Sequencer.stepThreads in Profiler instances.
 * @type {number}
 */
let stepThreadsProfilerId = -1;

/**
 * Numeric ID for RenderWebGL.draw in Profiler instances.
 * @type {number}
 */
let rendererDrawProfilerId = -1;

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
         * Targets in reverse order of execution. Shares its order with drawables.
         * @type {Array.<!Target>}
         */
        this.executableTargets = [];

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
        this.flyoutBlocks = new Blocks(true /* force no glow */);

        /**
         * Storage container for monitor blocks.
         * These will execute on a target maybe
         * @type {!Blocks}
         */
        this.monitorBlocks = new Blocks(true /* force no glow */);

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
         * Map to look up all block information by extended opcode.
         * @type {Array.<CategoryInfo>}
         * @private
         */
        this._blockInfo = [];

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
         * Map to look up all monitor block information by opcode.
         * @type {object}
         * @private
         */
        this.monitorBlockInfo = {};

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
            cloud: new Cloud(),
            deviceManager: new DeviceManager(),
            keyboard: new Keyboard(this),
            mouse: new Mouse(this),
            mouseWheel: new MouseWheel(this),
            userData: new UserData(),
            video: new Video(this)
        };

        /**
         * A list of extensions, used to manage hardware connection.
         */
        this.peripheralExtensions = {};

        /**
         * A runtime profiler that records timed events for later playback to
         * diagnose Scratch performance.
         * @type {Profiler}
         */
        this.profiler = null;
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
     * Event name for turning on turbo mode.
     * @const {string}
     */
    static get TURBO_MODE_ON () {
        return 'TURBO_MODE_ON';
    }

    /**
     * Event name for turning off turbo mode.
     * @const {string}
     */
    static get TURBO_MODE_OFF () {
        return 'TURBO_MODE_OFF';
    }

    /**
     * Event name when the project is started (threads may not necessarily be
     * running).
     * @const {string}
     */
    static get PROJECT_START () {
        return 'PROJECT_START';
    }

    /**
     * Event name when threads start running.
     * Used by the UI to indicate running status.
     * @const {string}
     */
    static get PROJECT_RUN_START () {
        return 'PROJECT_RUN_START';
    }

    /**
     * Event name when threads stop running
     * Used by the UI to indicate not-running status.
     * @const {string}
     */
    static get PROJECT_RUN_STOP () {
        return 'PROJECT_RUN_STOP';
    }

    /**
     * Event name for project being stopped or restarted by the user.
     * Used by blocks that need to reset state.
     * @const {string}
     */
    static get PROJECT_STOP_ALL () {
        return 'PROJECT_STOP_ALL';
    }

    /**
     * Event name for target being stopped by a stop for target call.
     * Used by blocks that need to stop individual targets.
     * @const {string}
     */
    static get STOP_FOR_TARGET () {
        return 'STOP_FOR_TARGET';
    }

    /**
     * Event name for visual value report.
     * @const {string}
     */
    static get VISUAL_REPORT () {
        return 'VISUAL_REPORT';
    }

    /**
     * Event name for project loaded report.
     * @const {string}
     */
    static get PROJECT_LOADED () {
        return 'PROJECT_LOADED';
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
     * Event name for block drag update.
     * @const {string}
     */
    static get BLOCK_DRAG_UPDATE () {
        return 'BLOCK_DRAG_UPDATE';
    }

    /**
     * Event name for block drag end.
     * @const {string}
     */
    static get BLOCK_DRAG_END () {
        return 'BLOCK_DRAG_END';
    }

    /**
     * Event name for reporting that an extension was added.
     * @const {string}
     */
    static get EXTENSION_ADDED () {
        return 'EXTENSION_ADDED';
    }

    /**
     * Event name for updating the available set of peripheral devices.
     * @const {string}
     */
    static get PERIPHERAL_LIST_UPDATE () {
        return 'PERIPHERAL_LIST_UPDATE';
    }

    /**
     * Event name for reporting that a peripheral has connected.
     * @const {string}
     */
    static get PERIPHERAL_CONNECTED () {
        return 'PERIPHERAL_CONNECTED';
    }

    /**
     * Event name for reporting that a peripheral has encountered a request error.
     * @const {string}
     */
    static get PERIPHERAL_REQUEST_ERROR () {
        return 'PERIPHERAL_REQUEST_ERROR';
    }

    /**
     * Event name for reporting that a peripheral has encountered a disconnect error.
     * @const {string}
     */
    static get PERIPHERAL_DISCONNECT_ERROR () {
        return 'PERIPHERAL_DISCONNECT_ERROR';
    }

    /**
     * Event name for reporting that a peripheral has not been discovered.
     * @const {string}
     */
    static get PERIPHERAL_SCAN_TIMEOUT () {
        return 'PERIPHERAL_SCAN_TIMEOUT';
    }

    /**
     * Event name to indicate that the microphone is being used to stream audio.
     * @const {string}
     */
    static get MIC_LISTENING () {
        return 'MIC_LISTENING';
    }

    /**
     * Event name for reporting that blocksInfo was updated.
     * @const {string}
     */
    static get BLOCKSINFO_UPDATE () {
        return 'BLOCKSINFO_UPDATE';
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
                // Collect monitored from package.
                if (packageObject.getMonitored) {
                    this.monitorBlockInfo = Object.assign({}, this.monitorBlockInfo, packageObject.getMonitored());
                }
            }
        }
    }

    /**
     * Generate an extension-specific menu ID.
     * @param {string} menuName - the name of the menu.
     * @param {string} extensionId - the ID of the extension hosting the menu.
     * @returns {string} - the constructed ID.
     * @private
     */
    _makeExtensionMenuId (menuName, extensionId) {
        return `${extensionId}_menu_${escapeHtml(menuName)}`;
    }

    /**
     * Create a context ("args") object for use with `formatMessage` on messages which might be target-specific.
     * @param {Target} [target] - the target to use as context. If a target is not provided, default to the current
     * editing target or the stage.
     */
    makeMessageContextForTarget (target) {
        const context = {};
        target = target || this.getEditingTarget() || this.getTargetForStage();
        if (target) {
            context.targetType = (target.isStage ? TargetType.STAGE : TargetType.SPRITE);
        }
    }

    /**
     * Register the primitives provided by an extension.
     * @param {ExtensionMetadata} extensionInfo - information about the extension (id, blocks, etc.)
     * @private
     */
    _registerExtensionPrimitives (extensionInfo) {
        const categoryInfo = {
            id: extensionInfo.id,
            name: maybeFormatMessage(extensionInfo.name),
            showStatusButton: extensionInfo.showStatusButton,
            blockIconURI: extensionInfo.blockIconURI,
            menuIconURI: extensionInfo.menuIconURI,
            color1: extensionInfo.colour || '#0FBD8C',
            color2: extensionInfo.colourSecondary || '#0DA57A',
            color3: extensionInfo.colourTertiary || '#0B8E69',
            blocks: [],
            menus: []
        };

        this._blockInfo.push(categoryInfo);

        this._fillExtensionCategory(categoryInfo, extensionInfo);

        this.emit(Runtime.EXTENSION_ADDED, categoryInfo.blocks.concat(categoryInfo.menus));
    }

    /**
     * Reregister the primitives for an extension
     * @param  {ExtensionMetadata} extensionInfo - new info (results of running getInfo) for an extension
     * @private
     */
    _refreshExtensionPrimitives (extensionInfo) {
        let extensionBlocks = [];
        for (const categoryInfo of this._blockInfo) {
            if (extensionInfo.id === categoryInfo.id) {
                categoryInfo.name = maybeFormatMessage(extensionInfo.name);
                categoryInfo.blocks = [];
                categoryInfo.menus = [];
                this._fillExtensionCategory(categoryInfo, extensionInfo);
                extensionBlocks = extensionBlocks.concat(categoryInfo.blocks, categoryInfo.menus);
            }
        }

        this.emit(Runtime.BLOCKSINFO_UPDATE, extensionBlocks);
    }

    /**
     * Read extension information, convert menus and blocks, and store the results in the provided category object.
     * @param {CategoryInfo} categoryInfo - the category to be filled
     * @param {ExtensionMetadata} extensionInfo - the extension metadata to read
     * @private
     */
    _fillExtensionCategory (categoryInfo, extensionInfo) {
        for (const menuName in extensionInfo.menus) {
            if (extensionInfo.menus.hasOwnProperty(menuName)) {
                const menuItems = extensionInfo.menus[menuName];
                const convertedMenu = this._buildMenuForScratchBlocks(menuName, menuItems, categoryInfo);
                categoryInfo.menus.push(convertedMenu);
            }
        }

        for (const blockInfo of extensionInfo.blocks) {
            if (blockInfo === '---') {
                categoryInfo.blocks.push(ConvertedSeparator);
                continue;
            }
            try {
                const convertedBlock = this._convertForScratchBlocks(blockInfo, categoryInfo);
                const opcode = convertedBlock.json.type;
                categoryInfo.blocks.push(convertedBlock);
                if (blockInfo.blockType !== BlockType.EVENT) {
                    this._primitives[opcode] = convertedBlock.info.func;
                }
                if (blockInfo.blockType === BlockType.EVENT || blockInfo.blockType === BlockType.HAT) {
                    this._hats[opcode] = {
                        edgeActivated: blockInfo.isEdgeActivated,
                        restartExistingThreads: blockInfo.shouldRestartExistingThreads
                    };
                }
            } catch (e) {
                log.error('Error parsing block: ', {block: blockInfo, error: e});
            }
        }
    }

    /**
     * Build the scratch-blocks JSON for a menu. Note that scratch-blocks treats menus as a special kind of block.
     * @param {string} menuName - the name of the menu
     * @param {array} menuItems - the list of items for this menu
     * @param {CategoryInfo} categoryInfo - the category for this block
     * @returns {object} - a JSON-esque object ready for scratch-blocks' consumption
     * @private
     */
    _buildMenuForScratchBlocks (menuName, menuItems, categoryInfo) {
        const menuId = this._makeExtensionMenuId(menuName, categoryInfo.id);
        let options = null;
        if (typeof menuItems === 'function') {
            options = menuItems;
        } else {
            const extensionMessageContext = this.makeMessageContextForTarget();
            options = menuItems.map(item => {
                const formattedItem = maybeFormatMessage(item, extensionMessageContext);
                switch (typeof formattedItem) {
                case 'string':
                    return [formattedItem, formattedItem];
                case 'object':
                    return [maybeFormatMessage(item.text, extensionMessageContext), item.value];
                default:
                    throw new Error(`Can't interpret menu item: ${JSON.stringify(item)}`);
                }
            });
        }
        return {
            json: {
                message0: '%1',
                type: menuId,
                inputsInline: true,
                output: 'String',
                colour: categoryInfo.color1,
                colourSecondary: categoryInfo.color2,
                colourTertiary: categoryInfo.color3,
                outputShape: ScratchBlocksConstants.OUTPUT_SHAPE_ROUND,
                args0: [
                    {
                        type: 'field_dropdown',
                        name: menuName,
                        options: options
                    }
                ]
            }
        };
    }

    /**
     * Convert ExtensionBlockMetadata into scratch-blocks JSON & XML, and generate a proxy function.
     * @param {ExtensionBlockMetadata} blockInfo - the block to convert
     * @param {CategoryInfo} categoryInfo - the category for this block
     * @returns {ConvertedBlockInfo} - the converted & original block information
     * @private
     */
    _convertForScratchBlocks (blockInfo, categoryInfo) {
        const extendedOpcode = `${categoryInfo.id}_${blockInfo.opcode}`;

        const blockJSON = {
            type: extendedOpcode,
            inputsInline: true,
            category: categoryInfo.name,
            colour: categoryInfo.color1,
            colourSecondary: categoryInfo.color2,
            colourTertiary: categoryInfo.color3,
            extensions: ['scratch_extension']
        };
        const context = {
            // TODO: store this somewhere so that we can map args appropriately after translation.
            // This maps an arg name to its relative position in the original (usually English) block text.
            // When displaying a block in another language we'll need to run a `replace` action similar to the one
            // below, but each `[ARG]` will need to be replaced with the number in this map.
            argsMap: {},
            blockJSON,
            categoryInfo,
            blockInfo,
            inputList: []
        };

        // If an icon for the extension exists, prepend it to each block, with a vertical separator.
        // We can overspecify an icon for each block, but if no icon exists on a block, fall back to
        // the category block icon.
        const iconURI = blockInfo.blockIconURI || categoryInfo.blockIconURI;

        if (iconURI) {
            blockJSON.message0 = '%1 %2';
            const iconJSON = {
                type: 'field_image',
                src: iconURI,
                width: 40,
                height: 40
            };
            const separatorJSON = {
                type: 'field_vertical_separator'
            };
            blockJSON.args0 = [
                iconJSON,
                separatorJSON
            ];
        }

        switch (blockInfo.blockType) {
        case BlockType.COMMAND:
            blockJSON.outputShape = ScratchBlocksConstants.OUTPUT_SHAPE_SQUARE;
            blockJSON.previousStatement = null; // null = available connection; undefined = hat
            if (!blockInfo.isTerminal) {
                blockJSON.nextStatement = null; // null = available connection; undefined = terminal
            }
            break;
        case BlockType.REPORTER:
            blockJSON.output = 'String'; // TODO: distinguish number & string here?
            blockJSON.outputShape = ScratchBlocksConstants.OUTPUT_SHAPE_ROUND;
            break;
        case BlockType.BOOLEAN:
            blockJSON.output = 'Boolean';
            blockJSON.outputShape = ScratchBlocksConstants.OUTPUT_SHAPE_HEXAGONAL;
            break;
        case BlockType.HAT:
        case BlockType.EVENT:
            if (!blockInfo.hasOwnProperty('isEdgeActivated')) {
                // if absent, this property defaults to true
                blockInfo.isEdgeActivated = true;
            }
            blockJSON.outputShape = ScratchBlocksConstants.OUTPUT_SHAPE_SQUARE;
            blockJSON.nextStatement = null; // null = available connection; undefined = terminal
            break;
        case BlockType.CONDITIONAL:
        case BlockType.LOOP:
            blockInfo.branchCount = blockInfo.branchCount || 1;
            blockJSON.outputShape = ScratchBlocksConstants.OUTPUT_SHAPE_SQUARE;
            blockJSON.previousStatement = null; // null = available connection; undefined = hat
            if (!blockInfo.isTerminal) {
                blockJSON.nextStatement = null; // null = available connection; undefined = terminal
            }
            break;
        }

        const blockText = Array.isArray(blockInfo.text) ? blockInfo.text : [blockInfo.text];
        let inTextNum = 0; // text for the next block "arm" is blockText[inTextNum]
        let inBranchNum = 0; // how many branches have we placed into the JSON so far?
        let outLineNum = 0; // used for scratch-blocks `message${outLineNum}` and `args${outLineNum}`
        const convertPlaceholders = this._convertPlaceholders.bind(this, context);
        const extensionMessageContext = this.makeMessageContextForTarget();

        // alternate between a block "arm" with text on it and an open slot for a substack
        while (inTextNum < blockText.length || inBranchNum < blockInfo.branchCount) {
            if (inTextNum < blockText.length) {
                context.outLineNum = outLineNum;
                const lineText = maybeFormatMessage(blockText[inTextNum], extensionMessageContext);
                const convertedText = lineText.replace(/\[(.+?)]/g, convertPlaceholders);
                if (blockJSON[`message${outLineNum}`]) {
                    blockJSON[`message${outLineNum}`] += convertedText;
                } else {
                    blockJSON[`message${outLineNum}`] = convertedText;
                }
                ++inTextNum;
                ++outLineNum;
            }
            if (inBranchNum < blockInfo.branchCount) {
                blockJSON[`message${outLineNum}`] = '%1';
                blockJSON[`args${outLineNum}`] = [{
                    type: 'input_statement',
                    name: `SUBSTACK${inBranchNum > 0 ? inBranchNum + 1 : ''}`
                }];
                ++inBranchNum;
                ++outLineNum;
            }
        }

        if (blockInfo.blockType === BlockType.REPORTER) {
            if (!blockInfo.disableMonitor && context.inputList.length === 0) {
                blockJSON.checkboxInFlyout = true;
            }
        } else if (blockInfo.blockType === BlockType.LOOP) {
            // Add icon to the bottom right of a loop block
            blockJSON[`lastDummyAlign${outLineNum}`] = 'RIGHT';
            blockJSON[`message${outLineNum}`] = '%1';
            blockJSON[`args${outLineNum}`] = [{
                type: 'field_image',
                src: './static/blocks-media/repeat.svg', // TODO: use a constant or make this configurable?
                width: 24,
                height: 24,
                alt: '*',
                flip_rtl: true
            }];
            ++outLineNum;
        }

        const blockXML = `<block type="${extendedOpcode}">${context.inputList.join('')}</block>`;

        return {
            info: context.blockInfo,
            json: context.blockJSON,
            xml: blockXML
        };
    }

    /**
     * Helper for _convertForScratchBlocks which handles linearization of argument placeholders. Called as a callback
     * from string#replace. In addition to the return value the JSON and XML items in the context will be filled.
     * @param {object} context - information shared with _convertForScratchBlocks about the block, etc.
     * @param {string} match - the overall string matched by the placeholder regex, including brackets: '[FOO]'.
     * @param {string} placeholder - the name of the placeholder being matched: 'FOO'.
     * @return {string} scratch-blocks placeholder for the argument: '%1'.
     * @private
     */
    _convertPlaceholders (context, match, placeholder) {
        // Sanitize the placeholder to ensure valid XML
        placeholder = placeholder.replace(/[<"&]/, '_');

        const argJSON = {
            type: 'input_value',
            name: placeholder
        };

        const argInfo = context.blockInfo.arguments[placeholder] || {};
        const argTypeInfo = ArgumentTypeMap[argInfo.type] || {};
        const defaultValue = (typeof argInfo.defaultValue === 'undefined' ?
            '' :
            escapeHtml(maybeFormatMessage(argInfo.defaultValue, this.makeMessageContextForTarget()).toString()));

        if (argTypeInfo.check) {
            argJSON.check = argTypeInfo.check;
        }

        const shadowType = (argInfo.menu ?
            this._makeExtensionMenuId(argInfo.menu, context.categoryInfo.id) :
            argTypeInfo.shadowType);
        const fieldType = argInfo.menu || argTypeInfo.fieldType;

        // <value> is the ScratchBlocks name for a block input.
        context.inputList.push(`<value name="${placeholder}">`);

        // The <shadow> is a placeholder for a reporter and is visible when there's no reporter in this input.
        // Boolean inputs don't need to specify a shadow in the XML.
        if (shadowType) {
            context.inputList.push(`<shadow type="${shadowType}">`);

            // <field> is a text field that the user can type into. Some shadows, like the color picker, don't allow
            // text input and therefore don't need a field element.
            if (fieldType) {
                context.inputList.push(`<field name="${fieldType}">${defaultValue}</field>`);
            }

            context.inputList.push('</shadow>');
        }

        context.inputList.push('</value>');

        const argsName = `args${context.outLineNum}`;
        const blockArgs = (context.blockJSON[argsName] = context.blockJSON[argsName] || []);
        blockArgs.push(argJSON);
        const argNum = blockArgs.length;
        context.argsMap[placeholder] = argNum;
        return `%${argNum}`;
    }

    /**
     * @returns {string} scratch-blocks XML description for all dynamic blocks, wrapped in <category> elements.
     */
    getBlocksXML () {
        const xmlParts = [];
        for (const categoryInfo of this._blockInfo) {
            const {name, color1, color2} = categoryInfo;
            const paletteBlocks = categoryInfo.blocks.filter(block => !block.info.hideFromPalette);
            const colorXML = `colour="${color1}" secondaryColour="${color2}"`;

            // Use a menu icon if there is one. Otherwise, use the block icon. If there's no icon,
            // the category menu will show its default colored circle.
            let menuIconURI = '';
            if (categoryInfo.menuIconURI) {
                menuIconURI = categoryInfo.menuIconURI;
            } else if (categoryInfo.blockIconURI) {
                menuIconURI = categoryInfo.blockIconURI;
            }
            const menuIconXML = menuIconURI ?
                `iconURI="${menuIconURI}"` : '';

            let statusButtonXML = '';
            if (categoryInfo.showStatusButton) {
                statusButtonXML = 'showStatusButton="true"';
            }

            xmlParts.push(`<category name="${name}" id="${categoryInfo.id}"
                ${statusButtonXML} ${colorXML} ${menuIconXML}>`);
            xmlParts.push.apply(xmlParts, paletteBlocks.map(block => block.xml));
            xmlParts.push('</category>');
        }
        return xmlParts.join('\n');
    }

    /**
     * @returns {Array.<string>} - an array containing the scratch-blocks JSON information for each dynamic block.
     */
    getBlocksJSON () {
        return this._blockInfo.reduce(
            (result, categoryInfo) => result.concat(categoryInfo.blocks.map(blockInfo => blockInfo.json)), []);
    }

    /**
     * Register an extension that communications with a hardware peripheral by id,
     * to have access to it and its peripheral functions in the future.
     * @param {string} extensionId - the id of the extension.
     * @param {object} extension - the extension to register.
     */
    registerPeripheralExtension (extensionId, extension) {
        this.peripheralExtensions[extensionId] = extension;
    }

    /**
     * Tell the specified extension to scan for a peripheral.
     * @param {string} extensionId - the id of the extension.
     */
    scanForPeripheral (extensionId) {
        if (this.peripheralExtensions[extensionId]) {
            this.peripheralExtensions[extensionId].scan();
        }
    }

    /**
     * Connect to the extension's specified peripheral.
     * @param {string} extensionId - the id of the extension.
     * @param {number} peripheralId - the id of the peripheral.
     */
    connectPeripheral (extensionId, peripheralId) {
        if (this.peripheralExtensions[extensionId]) {
            this.peripheralExtensions[extensionId].connect(peripheralId);
        }
    }

    /**
     * Disconnect from the extension's connected peripheral.
     * @param {string} extensionId - the id of the extension.
     */
    disconnectPeripheral (extensionId) {
        if (this.peripheralExtensions[extensionId]) {
            this.peripheralExtensions[extensionId].disconnect();
        }
    }

    /**
     * Returns whether the extension has a currently connected peripheral.
     * @param {string} extensionId - the id of the extension.
     * @return {boolean} - whether the extension has a connected peripheral.
     */
    getPeripheralIsConnected (extensionId) {
        let isConnected = false;
        if (this.peripheralExtensions[extensionId]) {
            isConnected = this.peripheralExtensions[extensionId].isConnected();
        }
        return isConnected;
    }

    /**
     * Emit an event to indicate that the microphone is being used to stream audio.
     * @param {boolean} listening - true if the microphone is currently listening.
     */
    emitMicListening (listening) {
        this.emit(Runtime.MIC_LISTENING, listening);
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
        this.renderer.setLayerGroupOrdering(StageLayering.LAYER_GROUPS);
    }

    /**
     * Set the svg adapter, which converts scratch 2 svgs to scratch 3 svgs
     * @param {!SvgRenderer} svgAdapter The adapter to attach
     */
    attachV2SVGAdapter (svgAdapter) {
        this.v2SvgAdapter = svgAdapter;
    }

    /**
     * Set the bitmap adapter for the VM/runtime, which converts scratch 2
     * bitmaps to scratch 3 bitmaps. (Scratch 3 bitmaps are all bitmap resolution 2)
     * @param {!function} bitmapAdapter The adapter to attach
     */
    attachV2BitmapAdapter (bitmapAdapter) {
        this.v2BitmapAdapter = bitmapAdapter;
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
     * @param {?boolean} opts.stackClick true if the script was activated by clicking on the stack
     * @param {?boolean} opts.updateMonitor true if the script should update a monitor value
     * @return {!Thread} The newly created thread.
     */
    _pushThread (id, target, opts) {
        opts = Object.assign({
            stackClick: false,
            updateMonitor: false
        }, opts);

        const thread = new Thread(id);
        thread.target = target;
        thread.stackClick = opts.stackClick;
        thread.updateMonitor = opts.updateMonitor;
        thread.blockContainer = opts.updateMonitor ?
            this.monitorBlocks :
            target.blocks;

        thread.pushStack(id);
        this.threads.push(thread);
        return thread;
    }

    /**
     * Stop a thread: stop running it immediately, and remove it from the thread list later.
     * @param {!Thread} thread Thread object to remove from actives
     */
    _stopThread (thread) {
        // Mark the thread for later removal
        thread.isKilled = true;
        // Inform sequencer to stop executing that thread.
        this.sequencer.retireThread(thread);
    }

    /**
     * Restart a thread in place, maintaining its position in the list of threads.
     * This is used by `startHats` to and is necessary to ensure 2.0-like execution order.
     * Test project: https://scratch.mit.edu/projects/130183108/
     * @param {!Thread} thread Thread object to restart.
     * @return {Thread} The restarted thread.
     */
    _restartThread (thread) {
        const newThread = new Thread(thread.topBlock);
        newThread.target = thread.target;
        newThread.stackClick = thread.stackClick;
        newThread.updateMonitor = thread.updateMonitor;
        newThread.blockContainer = thread.blockContainer;
        newThread.pushStack(thread.topBlock);
        const i = this.threads.indexOf(thread);
        if (i > -1) {
            this.threads[i] = newThread;
            return newThread;
        }
        this.threads.push(thread);
        return thread;
    }

    /**
     * Return whether a thread is currently active/running.
     * @param {?Thread} thread Thread object to check.
     * @return {boolean} True if the thread is active/running.
     */
    isActiveThread (thread) {
        return (
            (
                thread.stack.length > 0 &&
                thread.status !== Thread.STATUS_DONE) &&
            this.threads.indexOf(thread) > -1);
    }

    /**
     * Return whether a thread is waiting for more information or done.
     * @param {?Thread} thread Thread object to check.
     * @return {boolean} True if the thread is waiting
     */
    isWaitingThread (thread) {
        return (
            thread.status === Thread.STATUS_PROMISE_WAIT ||
            thread.status === Thread.STATUS_YIELD_TICK ||
            !this.isActiveThread(thread)
        );
    }

    /**
     * Toggle a script.
     * @param {!string} topBlockId ID of block that starts the script.
     * @param {?object} opts optional arguments to toggle script
     * @param {?string} opts.target target ID for target to run script on. If not supplied, uses editing target.
     * @param {?boolean} opts.stackClick true if the user activated the stack by clicking, false if not. This
     *     determines whether we show a visual report when turning on the script.
     */
    toggleScript (topBlockId, opts) {
        opts = Object.assign({
            target: this._editingTarget,
            stackClick: false
        }, opts);
        // Remove any existing thread.
        for (let i = 0; i < this.threads.length; i++) {
            // Toggling a script that's already running turns it off
            if (this.threads[i].topBlock === topBlockId && this.threads[i].status !== Thread.STATUS_DONE) {
                const blockContainer = opts.target.blocks;
                const opcode = blockContainer.getOpcode(blockContainer.getBlock(topBlockId));

                if (this.getIsEdgeActivatedHat(opcode) && this.threads[i].stackClick !== opts.stackClick) {
                    // Allow edge activated hat thread stack click to coexist with
                    // edge activated hat thread that runs every frame
                    continue;
                }
                this._stopThread(this.threads[i]);
                return;
            }
        }
        // Otherwise add it.
        this._pushThread(topBlockId, opts.target, opts);
    }

    /**
     * Enqueue a script that when finished will update the monitor for the block.
     * @param {!string} topBlockId ID of block that starts the script.
     * @param {?Target} optTarget target Target to run script on. If not supplied, uses editing target.
     */
    addMonitorScript (topBlockId, optTarget) {
        if (!optTarget) optTarget = this._editingTarget;
        for (let i = 0; i < this.threads.length; i++) {
            // Don't re-add the script if it's already running
            if (this.threads[i].topBlock === topBlockId && this.threads[i].status !== Thread.STATUS_DONE &&
                    this.threads[i].updateMonitor) {
                return;
            }
        }
        // Otherwise add it.
        this._pushThread(topBlockId, optTarget, {updateMonitor: true});
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
        let targets = this.executableTargets;
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
                hatFields = {}; // don't overwrite the block's actual fields list
                const hatInputs = blocks.getInputs(block);
                for (const input in hatInputs) {
                    if (!hatInputs.hasOwnProperty(input)) continue;
                    const id = hatInputs[input].block;
                    const inpBlock = blocks.getBlock(id);
                    const fields = blocks.getFields(inpBlock);
                    Object.assign(hatFields, fields);
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
                        !instance.threads[i].stackClick && // stack click threads and hat threads can coexist
                        instance.threads[i].target === target) {
                        newThreads.push(instance._restartThread(instance.threads[i]));
                        return;
                    }
                }
            } else {
                // If `restartExistingThreads` is false, we should
                // give up if any threads with the top block are running.
                for (let j = 0; j < instance.threads.length; j++) {
                    if (instance.threads[j].topBlock === topBlockId &&
                        instance.threads[j].target === target &&
                        !instance.threads[j].stackClick && // stack click threads and hat threads can coexist
                        instance.threads[j].status !== Thread.STATUS_DONE) {
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
        this._monitorState = OrderedMap({});
        // @todo clear out extensions? turboMode? etc.
        this.ioDevices.cloud.clear();
    }

    /**
     * Add a target to the execution order.
     * @param {Target} executableTarget target to add
     */
    addExecutable (executableTarget) {
        this.executableTargets.push(executableTarget);
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

    /**
     * Remove a target from the execution set.
     * @param {Target} executableTarget target to remove
     */
    removeExecutable (executableTarget) {
        const oldIndex = this.executableTargets.indexOf(executableTarget);
        if (oldIndex > -1) {
            this.executableTargets.splice(oldIndex, 1);
        }
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
        // Emit stop event to allow blocks to clean up any state.
        this.emit(Runtime.STOP_FOR_TARGET, target, optThreadException);

        // Stop any threads on the target.
        for (let i = 0; i < this.threads.length; i++) {
            if (this.threads[i] === optThreadException) {
                continue;
            }
            if (this.threads[i].target === target) {
                this._stopThread(this.threads[i]);
            }
        }
    }

    /**
     * Start all threads that start with the green flag.
     */
    greenFlag () {
        this.stopAll();
        this.emit(Runtime.PROJECT_START);
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
        // Emit stop event to allow blocks to clean up any state.
        this.emit(Runtime.PROJECT_STOP_ALL);

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
        this.threads.forEach(thread => this._stopThread(thread));
    }

    /**
     * Repeatedly run `sequencer.stepThreads` and filter out
     * inactive threads after each iteration.
     */
    _step () {
        if (this.profiler !== null) {
            if (stepProfilerId === -1) {
                stepProfilerId = this.profiler.idByName('Runtime._step');
            }
            this.profiler.start(stepProfilerId);
        }

        // Clean up threads that were told to stop during or since the last step
        this.threads = this.threads.filter(thread => !thread.isKilled);

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
        if (this.profiler !== null) {
            if (stepThreadsProfilerId === -1) {
                stepThreadsProfilerId = this.profiler.idByName('Sequencer.stepThreads');
            }
            this.profiler.start(stepThreadsProfilerId);
        }
        const doneThreads = this.sequencer.stepThreads();
        if (this.profiler !== null) {
            this.profiler.stop();
        }
        this._updateGlows(doneThreads);
        // Add done threads so that even if a thread finishes within 1 frame, the green
        // flag will still indicate that a script ran.
        this._emitProjectRunStatus(
            this.threads.length + doneThreads.length -
                this._getMonitorThreadCount([...this.threads, ...doneThreads]));
        if (this.renderer) {
            // @todo: Only render when this.redrawRequested or clones rendered.
            if (this.profiler !== null) {
                if (rendererDrawProfilerId === -1) {
                    rendererDrawProfilerId = this.profiler.idByName('RenderWebGL.draw');
                }
                this.profiler.start(rendererDrawProfilerId);
            }
            this.renderer.draw();
            if (this.profiler !== null) {
                this.profiler.stop();
            }
        }

        if (this._refreshTargets) {
            this.emit(Runtime.TARGETS_UPDATE);
            this._refreshTargets = false;
        }

        if (!this._prevMonitorState.equals(this._monitorState)) {
            this.emit(Runtime.MONITORS_UPDATE, this._monitorState);
            this._prevMonitorState = this._monitorState;
        }

        if (this.profiler !== null) {
            this.profiler.stop();
            this.profiler.reportFrames();
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
                if (thread.requestScriptGlowInFrame || thread.stackClick) {
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
     * Emit whether blocks are being dragged over gui
     * @param {boolean} areBlocksOverGui True if blocks are dragged out of blocks workspace, false otherwise
     */
    emitBlockDragUpdate (areBlocksOverGui) {
        this.emit(Runtime.BLOCK_DRAG_UPDATE, areBlocksOverGui);
    }

    /**
     * Emit event to indicate that the block drag has ended with the blocks outside the blocks workspace
     * @param {Array.<object>} blocks The set of blocks dragged to the GUI
     */
    emitBlockEndDrag (blocks) {
        this.emit(Runtime.BLOCK_DRAG_END, blocks);
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
     * updates those properties that are defined in the given monitor record.
     * @param {!MonitorRecord} monitor Monitor to add.
     */
    requestAddMonitor (monitor) {
        const id = monitor.get('id');
        if (!this.requestUpdateMonitor(monitor)) { // update monitor if it exists in the state
            // if the monitor did not exist in the state, add it
            this._monitorState = this._monitorState.set(id, monitor);
        }
    }

    /**
     * Update a monitor in the state and report success/failure of update.
     * @param {!Map} monitor Monitor values to update. Values on the monitor with overwrite
     *     values on the old monitor with the same ID. If a value isn't defined on the new monitor,
     *     the old monitor will keep its old value.
     * @return {boolean} true if monitor exists in the state and was updated, false if it did not exist.
     */
    requestUpdateMonitor (monitor) {
        const id = monitor.get('id');
        if (this._monitorState.has(id)) {
            this._monitorState =
                // Use mergeWith here to prevent undefined values from overwriting existing ones
                this._monitorState.set(id, this._monitorState.get(id).mergeWith((prev, next) => {
                    if (typeof next === 'undefined' || next === null) {
                        return prev;
                    }
                    return next;
                }, monitor));
            return true;
        }
        return false;
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
     * Hides a monitor and returns success/failure of action.
     * @param {!string} monitorId ID of the monitor to hide.
     * @return {boolean} true if monitor exists and was updated, false otherwise
     */
    requestHideMonitor (monitorId) {
        return this.requestUpdateMonitor(new Map([
            ['id', monitorId],
            ['visible', false]
        ]));
    }

    /**
     * Shows a monitor and returns success/failure of action.
     * not exist in the state.
     * @param {!string} monitorId ID of the monitor to show.
     * @return {boolean} true if monitor exists and was updated, false otherwise
     */
    requestShowMonitor (monitorId) {
        return this.requestUpdateMonitor(new Map([
            ['id', monitorId],
            ['visible', true]
        ]));
    }

    /**
     * Removes all monitors with the given target ID from the state. Does nothing if
     * the monitor already does not exist in the state.
     * @param {!string} targetId Remove all monitors with given target ID.
     */
    requestRemoveMonitorByTargetId (targetId) {
        this._monitorState = this._monitorState.filterNot(value => value.targetId === targetId);
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
            if (target.isStage) {
                continue;
            }
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
     * Report that the project has loaded in the Virtual Machine.
     */
    emitProjectLoaded () {
        this.emit(Runtime.PROJECT_LOADED);
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
     * Report that a clone target is being removed.
     * @param {Target} target - the target being removed
     * @fires Runtime#targetWasRemoved
     */
    fireTargetWasRemoved (target) {
        this.emit('targetWasRemoved', target);
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

    getAllVarNamesOfType (varType) {
        let varNames = [];
        for (const target of this.targets) {
            const targetVarNames = target.getAllVariableNamesInScopeByType(varType, true);
            varNames = varNames.concat(targetVarNames);
        }
        return varNames;
    }

    /**
     * Get the label or label function for an opcode
     * @param {string} extendedOpcode - the opcode you want a label for
     * @return {object} - object with label and category
     * @property {string} category - the category for this opcode
     * @property {Function} [labelFn] - function to generate the label for this opcode
     * @property {string} [label] - the label for this opcode if `labelFn` is absent
     */
    getLabelForOpcode (extendedOpcode) {
        const [category, opcode] = StringUtil.splitFirst(extendedOpcode, '_');
        if (!(category && opcode)) return;

        const categoryInfo = this._blockInfo.find(ci => ci.id === category);
        if (!categoryInfo) return;

        const block = categoryInfo.blocks.find(b => b.info.opcode === opcode);
        if (!block) return;

        // TODO: should this use some other category? Also, we may want to format the label in a locale-specific way.
        return {
            category: 'data',
            label: `${categoryInfo.name}: ${block.info.text}`
        };
    }

    /**
     * Create a new global variable avoiding conflicts with other variable names.
     * @param {string} variableName The desired variable name for the new global variable.
     * This can be turned into a fresh name as necessary.
     * @param {string} optVarId An optional ID to use for the variable. A new one will be generated
     * if a falsey value for this parameter is provided.
     * @param {string} optVarType The type of the variable to create. Defaults to Variable.SCALAR_TYPE.
     * @return {Variable} The new variable that was created.
     */
    createNewGlobalVariable (variableName, optVarId, optVarType) {
        const varType = (typeof optVarType === 'string') ? optVarType : Variable.SCALAR_TYPE;
        const allVariableNames = this.getAllVarNamesOfType(varType);
        const newName = StringUtil.unusedName(variableName, allVariableNames);
        const variable = new Variable(optVarId || uid(), newName, varType);
        const stage = this.getTargetForStage();
        stage.variables[variable.id] = variable;
        return variable;
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

    /**
     * Turn on profiling.
     * @param {Profiler/FrameCallback} onFrame A callback handle passed a
     * profiling frame when the profiler reports its collected data.
     */
    enableProfiling (onFrame) {
        if (Profiler.available()) {
            this.profiler = new Profiler(onFrame);
        }
    }

    /**
     * Turn off profiling.
     */
    disableProfiling () {
        this.profiler = null;
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
