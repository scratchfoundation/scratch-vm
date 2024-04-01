export = ExtensionManager;
/**
 * @typedef {object} ArgumentInfo - Information about an extension block argument
 * @property {ArgumentType} type - the type of value this argument can take
 * @property {*|undefined} default - the default value of this argument (default: blank)
 */
/**
 * @typedef {object} ConvertedBlockInfo - Raw extension block data paired with processed data ready for scratch-blocks
 * @property {ExtensionBlockMetadata} info - the raw block info
 * @property {object} json - the scratch-blocks JSON definition for this block
 * @property {string} xml - the scratch-blocks XML definition for this block
 */
/**
 * @typedef {object} CategoryInfo - Information about a block category
 * @property {string} id - the unique ID of this category
 * @property {string} name - the human-readable name of this category
 * @property {string|undefined} blockIconURI - optional URI for the block icon image
 * @property {string} color1 - the primary color for this category, in '#rrggbb' format
 * @property {string} color2 - the secondary color for this category, in '#rrggbb' format
 * @property {string} color3 - the tertiary color for this category, in '#rrggbb' format
 * @property {Array.<ConvertedBlockInfo>} blocks - the blocks, separators, etc. in this category
 * @property {Array.<object>} menus - the menus provided by this category
 */
/**
 * @typedef {object} PendingExtensionWorker - Information about an extension worker still initializing
 * @property {string} extensionURL - the URL of the extension to be loaded by this worker
 * @property {Function} resolve - function to call on successful worker startup
 * @property {Function} reject - function to call on failed worker startup
 */
declare class ExtensionManager {
    constructor(runtime: any);
    /**
     * The ID number to provide to the next extension worker.
     * @type {int}
     */
    nextExtensionWorker: int;
    /**
     * FIFO queue of extensions which have been requested but not yet loaded in a worker,
     * along with promise resolution functions to call once the worker is ready or failed.
     *
     * @type {Array.<PendingExtensionWorker>}
     */
    pendingExtensions: Array<PendingExtensionWorker>;
    /**
     * Map of worker ID to workers which have been allocated but have not yet finished initialization.
     * @type {Array.<PendingExtensionWorker>}
     */
    pendingWorkers: Array<PendingExtensionWorker>;
    /**
     * Map of loaded extension URLs/IDs (equivalent for built-in extensions) to service name.
     * @type {Map.<string,string>}
     * @private
     */
    private _loadedExtensions;
    /**
     * Keep a reference to the runtime so we can construct internal extension objects.
     * TODO: remove this in favor of extensions accessing the runtime as a service.
     * @type {Runtime}
     */
    runtime: Runtime;
    /**
     * Check whether an extension is registered or is in the process of loading. This is intended to control loading or
     * adding extensions so it may return `true` before the extension is ready to be used. Use the promise returned by
     * `loadExtensionURL` if you need to wait until the extension is truly ready.
     * @param {string} extensionID - the ID of the extension.
     * @returns {boolean} - true if loaded, false otherwise.
     */
    isExtensionLoaded(extensionID: string): boolean;
    /**
     * Synchronously load an internal extension (core or non-core) by ID. This call will
     * fail if the provided id is not does not match an internal extension.
     * @param {string} extensionId - the ID of an internal extension
     */
    loadExtensionIdSync(extensionId: string): Promise<any>;
    /**
     * Load an extension by URL or internal extension ID
     * @param {string} extensionURL - the URL for the extension to load OR the ID of an internal extension
     * @returns {Promise} resolved once the extension is loaded and initialized or rejected on failure
     */
    loadExtensionURL(extensionURL: string): Promise<any>;
    /** Begin PRG Additions */
    getLoadedExtensionIDs(): string[];
    getExtensionInstance(id: any): any;
    getAuxiliaryObject(extensionID: any, name: any): any;
    /** END PRG Additions */
    /**
     * Regenerate blockinfo for any loaded extensions
     * @returns {Promise} resolved once all the extensions have been reinitialized
     */
    refreshBlocks(): Promise<any>;
    allocateWorker(): (string | number)[];
    /**
     * Synchronously collect extension metadata from the specified service and begin the extension registration process.
     * @param {string} serviceName - the name of the service hosting the extension.
     */
    registerExtensionServiceSync(serviceName: string): void;
    /**
     * Collect extension metadata from the specified service and begin the extension registration process.
     * @param {string} serviceName - the name of the service hosting the extension.
     */
    registerExtensionService(serviceName: string): void;
    /**
     * Called by an extension worker to indicate that the worker has finished initialization.
     * @param {int} id - the worker ID.
     * @param {*?} e - the error encountered during initialization, if any.
     */
    onWorkerInit(id: int, e: any | null): void;
    /**
     * Register an internal (non-Worker) extension object
     * @param {object} extensionObject - the extension object to register
     * @returns {string} The name of the registered extension service
     */
    _registerInternalExtension(extensionObject: object): string;
    /**
     * Sanitize extension info then register its primitives with the VM.
     * @param {string} serviceName - the name of the service hosting the extension
     * @param {ExtensionInfo} extensionInfo - the extension's metadata
     * @private
     */
    private _registerExtensionInfo;
    /**
     * Modify the provided text as necessary to ensure that it may be used as an attribute value in valid XML.
     * @param {string} text - the text to be sanitized
     * @returns {string} - the sanitized text
     * @private
     */
    private _sanitizeID;
    /**
     * Apply minor cleanup and defaults for optional extension fields.
     * TODO: make the ID unique in cases where two copies of the same extension are loaded.
     * @param {string} serviceName - the name of the service hosting this extension block
     * @param {ExtensionInfo} extensionInfo - the extension info to be sanitized
     * @returns {ExtensionInfo} - a new extension info object with cleaned-up values
     * @private
     */
    private _prepareExtensionInfo;
    /**
     * Prepare extension menus. e.g. setup binding for dynamic menu functions.
     * @param {string} serviceName - the name of the service hosting this extension block
     * @param {Array.<MenuInfo>} menus - the menu defined by the extension.
     * @returns {Array.<MenuInfo>} - a menuInfo object with all preprocessing done.
     * @private
     */
    private _prepareMenuInfo;
    /**
     * Fetch the items for a particular extension menu, providing the target ID for context.
     * @param {object} extensionObject - the extension object providing the menu.
     * @param {string} menuItemFunctionName - the name of the menu function to call.
     * @returns {Array} menu items ready for scratch-blocks.
     * @private
     */
    private _getExtensionMenuItems;
    /**
     * Apply defaults for optional block fields.
     * @param {string} serviceName - the name of the service hosting this extension block
     * @param {ExtensionBlockMetadata} blockInfo - the block info from the extension
     * @returns {ExtensionBlockMetadata} - a new block info object which has values for all relevant optional fields.
     * @private
     */
    private _prepareBlockInfo;
}
declare namespace ExtensionManager {
    export { ArgumentInfo, ConvertedBlockInfo, CategoryInfo, PendingExtensionWorker };
}
/**
 * - Information about an extension worker still initializing
 */
type PendingExtensionWorker = {
    /**
     * - the URL of the extension to be loaded by this worker
     */
    extensionURL: string;
    /**
     * - function to call on successful worker startup
     */
    resolve: Function;
    /**
     * - function to call on failed worker startup
     */
    reject: Function;
};
/**
 * - Information about an extension block argument
 */
type ArgumentInfo = {
    /**
     * - the type of value this argument can take
     */
    type: ArgumentType;
    /**
     * - the default value of this argument (default: blank)
     */
    default: any | undefined;
};
/**
 * - Raw extension block data paired with processed data ready for scratch-blocks
 */
type ConvertedBlockInfo = {
    /**
     * - the raw block info
     */
    info: ExtensionBlockMetadata;
    /**
     * - the scratch-blocks JSON definition for this block
     */
    json: object;
    /**
     * - the scratch-blocks XML definition for this block
     */
    xml: string;
};
/**
 * - Information about a block category
 */
type CategoryInfo = {
    /**
     * - the unique ID of this category
     */
    id: string;
    /**
     * - the human-readable name of this category
     */
    name: string;
    /**
     * - optional URI for the block icon image
     */
    blockIconURI: string | undefined;
    /**
     * - the primary color for this category, in '#rrggbb' format
     */
    color1: string;
    /**
     * - the secondary color for this category, in '#rrggbb' format
     */
    color2: string;
    /**
     * - the tertiary color for this category, in '#rrggbb' format
     */
    color3: string;
    /**
     * - the blocks, separators, etc. in this category
     */
    blocks: Array<ConvertedBlockInfo>;
    /**
     * - the menus provided by this category
     */
    menus: Array<object>;
};
