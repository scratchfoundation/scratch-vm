const TextEncoder = require('text-encoding').TextEncoder;
const EventEmitter = require('events');

const centralDispatch = require('./dispatch/central-dispatch');
const ExtensionManager = require('./extension-support/extension-manager');
const log = require('./util/log');
const Runtime = require('./engine/runtime');
const sb2 = require('./serialization/sb2');
const sb3 = require('./serialization/sb3');
const StringUtil = require('./util/string-util');
const formatMessage = require('format-message');
const Variable = require('./engine/variable');

const {loadCostume} = require('./import/load-costume.js');
const {loadSound} = require('./import/load-sound.js');

const RESERVED_NAMES = ['_mouse_', '_stage_', '_edge_', '_myself_', '_random_'];

/**
 * Handles connections between blocks, stage, and extensions.
 * @constructor
 */
class VirtualMachine extends EventEmitter {
    constructor () {
        super();

        /**
         * VM runtime, to store blocks, I/O devices, sprites/targets, etc.
         * @type {!Runtime}
         */
        this.runtime = new Runtime();
        centralDispatch.setService('runtime', this.runtime).catch(e => {
            log.error(`Failed to register runtime service: ${JSON.stringify(e)}`);
        });

        /**
         * The "currently editing"/selected target ID for the VM.
         * Block events from any Blockly workspace are routed to this target.
         * @type {Target}
         */
        this.editingTarget = null;

        /**
         * The currently dragging target, for redirecting IO data.
         * @type {Target}
         */
        this._dragTarget = null;

        // Runtime emits are passed along as VM emits.
        this.runtime.on(Runtime.SCRIPT_GLOW_ON, glowData => {
            this.emit(Runtime.SCRIPT_GLOW_ON, glowData);
        });
        this.runtime.on(Runtime.SCRIPT_GLOW_OFF, glowData => {
            this.emit(Runtime.SCRIPT_GLOW_OFF, glowData);
        });
        this.runtime.on(Runtime.BLOCK_GLOW_ON, glowData => {
            this.emit(Runtime.BLOCK_GLOW_ON, glowData);
        });
        this.runtime.on(Runtime.BLOCK_GLOW_OFF, glowData => {
            this.emit(Runtime.BLOCK_GLOW_OFF, glowData);
        });
        this.runtime.on(Runtime.PROJECT_RUN_START, () => {
            this.emit(Runtime.PROJECT_RUN_START);
        });
        this.runtime.on(Runtime.PROJECT_RUN_STOP, () => {
            this.emit(Runtime.PROJECT_RUN_STOP);
        });
        this.runtime.on(Runtime.VISUAL_REPORT, visualReport => {
            this.emit(Runtime.VISUAL_REPORT, visualReport);
        });
        this.runtime.on(Runtime.TARGETS_UPDATE, () => {
            this.emitTargetsUpdate();
        });
        this.runtime.on(Runtime.MONITORS_UPDATE, monitorList => {
            this.emit(Runtime.MONITORS_UPDATE, monitorList);
        });
        this.runtime.on(Runtime.EXTENSION_ADDED, blocksInfo => {
            this.emit(Runtime.EXTENSION_ADDED, blocksInfo);
        });
        this.runtime.on(Runtime.BLOCKSINFO_UPDATE, blocksInfo => {
            this.emit(Runtime.BLOCKSINFO_UPDATE, blocksInfo);
        });

        this.extensionManager = new ExtensionManager(this.runtime);

        this.blockListener = this.blockListener.bind(this);
        this.flyoutBlockListener = this.flyoutBlockListener.bind(this);
        this.monitorBlockListener = this.monitorBlockListener.bind(this);
        this.variableListener = this.variableListener.bind(this);
    }

    /**
     * Start running the VM - do this before anything else.
     */
    start () {
        this.runtime.start();
    }

    /**
     * "Green flag" handler - start all threads starting with a green flag.
     */
    greenFlag () {
        this.runtime.greenFlag();
    }

    /**
     * Set whether the VM is in "turbo mode."
     * When true, loops don't yield to redraw.
     * @param {boolean} turboModeOn Whether turbo mode should be set.
     */
    setTurboMode (turboModeOn) {
        this.runtime.turboMode = !!turboModeOn;
    }

    /**
     * Set whether the VM is in 2.0 "compatibility mode."
     * When true, ticks go at 2.0 speed (30 TPS).
     * @param {boolean} compatibilityModeOn Whether compatibility mode is set.
     */
    setCompatibilityMode (compatibilityModeOn) {
        this.runtime.setCompatibilityMode(!!compatibilityModeOn);
    }

    /**
     * Stop all threads and running activities.
     */
    stopAll () {
        this.runtime.stopAll();
    }

    /**
     * Clear out current running project data.
     */
    clear () {
        this.runtime.dispose();
        this.editingTarget = null;
        this.emitTargetsUpdate();
    }

    /**
     * Get data for playground. Data comes back in an emitted event.
     */
    getPlaygroundData () {
        const instance = this;
        // Only send back thread data for the current editingTarget.
        const threadData = this.runtime.threads.filter(thread => thread.target === instance.editingTarget);
        // Remove the target key, since it's a circular reference.
        const filteredThreadData = JSON.stringify(threadData, (key, value) => {
            if (key === 'target') return;
            return value;
        }, 2);
        this.emit('playgroundData', {
            blocks: this.editingTarget.blocks,
            threads: filteredThreadData
        });
    }

    /**
     * Post I/O data to the virtual devices.
     * @param {?string} device Name of virtual I/O device.
     * @param {object} data Any data object to post to the I/O device.
     */
    postIOData (device, data) {
        if (this.runtime.ioDevices[device]) {
            this.runtime.ioDevices[device].postData(data);
        }
    }

    /**
     * Load a project from a Scratch 2.0 JSON representation.
     * @param {?string} json JSON string representing the project.
     * @return {!Promise} Promise that resolves after targets are installed.
     */
    loadProject (json) {
        // @todo: Handle other formats, e.g., Scratch 1.4, Scratch 3.0.
        return this.fromJSON(json);
    }

    /**
     * Load a project from the Scratch web site, by ID.
     * @param {string} id - the ID of the project to download, as a string.
     */
    downloadProjectId (id) {
        const storage = this.runtime.storage;
        if (!storage) {
            log.error('No storage module present; cannot load project: ', id);
            return;
        }
        const vm = this;
        const promise = storage.load(storage.AssetType.Project, id);
        promise.then(projectAsset => {
            vm.loadProject(projectAsset.decodeText());
        });
    }

    /**
     * @returns {string} Project in a Scratch 3.0 JSON representation.
     */
    saveProjectSb3 () {
        // @todo: Handle other formats, e.g., Scratch 1.4, Scratch 2.0.
        return this.toJSON();
    }

    /**
     * Export project as a Scratch 3.0 JSON representation.
     * @return {string} Serialized state of the runtime.
     */
    toJSON () {
        return JSON.stringify(sb3.serialize(this.runtime));
    }

    /**
     * Load a project from a Scratch JSON representation.
     * @param {string} json JSON string representing a project.
     * @returns {Promise} Promise that resolves after the project has loaded
     */
    fromJSON (json) {
        // Clear the current runtime
        this.clear();

        // Validate & parse
        if (typeof json !== 'string' && typeof json !== 'object') {
            log.error('Failed to parse project. Invalid type supplied to fromJSON.');
            return;
        }

        // Attempt to parse JSON if string is supplied
        if (typeof json === 'string') json = JSON.parse(json);

        // Establish version, deserialize, and load into runtime
        // @todo Support Scratch 1.4
        // @todo This is an extremely naïve / dangerous way of determining version.
        //       See `scratch-parser` for a more sophisticated validation
        //       methodology that should be adapted for use here
        let deserializer;
        if ((typeof json.meta !== 'undefined') && (typeof json.meta.semver !== 'undefined')) {
            deserializer = sb3;
        } else {
            deserializer = sb2;
        }

        return deserializer.deserialize(json, this.runtime)
            .then(({targets, extensions}) =>
                this.installTargets(targets, extensions, true));
    }

    /**
     * Install `deserialize` results: zero or more targets after the extensions (if any) used by those targets.
     * @param {Array.<Target>} targets - the targets to be installed
     * @param {ImportedExtensionsInfo} extensions - metadata about extensions used by these targets
     * @param {boolean} wholeProject - set to true if installing a whole project, as opposed to a single sprite.
     * @returns {Promise} resolved once targets have been installed
     */
    installTargets (targets, extensions, wholeProject) {
        const extensionPromises = [];
        extensions.extensionIDs.forEach(extensionID => {
            if (!this.extensionManager.isExtensionLoaded(extensionID)) {
                const extensionURL = extensions.extensionURLs.get(extensionID) || extensionID;
                extensionPromises.push(this.extensionManager.loadExtensionURL(extensionURL));
            }
        });

        targets = targets.filter(target => !!target);

        return Promise.all(extensionPromises).then(() => {
            if (wholeProject) {
                this.clear();
            }
            targets.forEach(target => {
                this.runtime.targets.push(target);
                (/** @type RenderedTarget */ target).updateAllDrawableProperties();
                // Ensure unique sprite name
                if (target.isSprite()) this.renameSprite(target.id, target.getName());
            });
            // Select the first target for editing, e.g., the first sprite.
            if (wholeProject && (targets.length > 1)) {
                this.editingTarget = targets[1];
            } else {
                this.editingTarget = targets[0];
            }

            // Update the VM user's knowledge of targets and blocks on the workspace.
            this.emitTargetsUpdate();
            this.emitWorkspaceUpdate();
            this.runtime.setEditingTarget(this.editingTarget);
        });
    }

    /**
     * Add a single sprite from the "Sprite2" (i.e., SB2 sprite) format.
     * @param {string} json JSON string representing the sprite.
     * @returns {Promise} Promise that resolves after the sprite is added
     */
    addSprite2 (json) {
        // Validate & parse
        if (typeof json !== 'string') {
            log.error('Failed to parse sprite. Non-string supplied to addSprite2.');
            return;
        }
        json = JSON.parse(json);
        if (typeof json !== 'object') {
            log.error('Failed to parse sprite. JSON supplied to addSprite2 is not an object.');
            return;
        }

        return sb2.deserialize(json, this.runtime, true)
            .then(({targets, extensions}) =>
                this.installTargets(targets, extensions, false));
    }

    /**
     * Add a costume to the current editing target.
     * @param {string} md5ext - the MD5 and extension of the costume to be loaded.
     * @param {!object} costumeObject Object representing the costume.
     * @property {int} skinId - the ID of the costume's render skin, once installed.
     * @property {number} rotationCenterX - the X component of the costume's origin.
     * @property {number} rotationCenterY - the Y component of the costume's origin.
     * @property {number} [bitmapResolution] - the resolution scale for a bitmap costume.
     * @returns {?Promise} - a promise that resolves when the costume has been added
     */
    addCostume (md5ext, costumeObject) {
        return loadCostume(md5ext, costumeObject, this.runtime).then(() => {
            this.editingTarget.addCostume(costumeObject);
            this.editingTarget.setCostume(
                this.editingTarget.sprite.costumes.length - 1
            );
        });
    }

    /**
     * Rename a costume on the current editing target.
     * @param {int} costumeIndex - the index of the costume to be renamed.
     * @param {string} newName - the desired new name of the costume (will be modified if already in use).
     */
    renameCostume (costumeIndex, newName) {
        this.editingTarget.renameCostume(costumeIndex, newName);
        this.emitTargetsUpdate();
    }

    /**
     * Delete a costume from the current editing target.
     * @param {int} costumeIndex - the index of the costume to be removed.
     */
    deleteCostume (costumeIndex) {
        this.editingTarget.deleteCostume(costumeIndex);
    }

    /**
     * Add a sound to the current editing target.
     * @param {!object} soundObject Object representing the costume.
     * @returns {?Promise} - a promise that resolves when the sound has been decoded and added
     */
    addSound (soundObject) {
        return loadSound(soundObject, this.runtime).then(() => {
            this.editingTarget.addSound(soundObject);
            this.emitTargetsUpdate();
        });
    }

    /**
     * Rename a sound on the current editing target.
     * @param {int} soundIndex - the index of the sound to be renamed.
     * @param {string} newName - the desired new name of the sound (will be modified if already in use).
     */
    renameSound (soundIndex, newName) {
        this.editingTarget.renameSound(soundIndex, newName);
        this.emitTargetsUpdate();
    }

    /**
     * Get a sound buffer from the audio engine.
     * @param {int} soundIndex - the index of the sound to be got.
     * @return {AudioBuffer} the sound's audio buffer.
     */
    getSoundBuffer (soundIndex) {
        const id = this.editingTarget.sprite.sounds[soundIndex].soundId;
        if (id && this.runtime && this.runtime.audioEngine) {
            return this.runtime.audioEngine.getSoundBuffer(id);
        }
        return null;
    }

    /**
     * Update a sound buffer.
     * @param {int} soundIndex - the index of the sound to be updated.
     * @param {AudioBuffer} newBuffer - new audio buffer for the audio engine.
     */
    updateSoundBuffer (soundIndex, newBuffer) {
        const id = this.editingTarget.sprite.sounds[soundIndex].soundId;
        if (id && this.runtime && this.runtime.audioEngine) {
            this.runtime.audioEngine.updateSoundBuffer(id, newBuffer);
        }
        this.emitTargetsUpdate();
    }

    /**
     * Delete a sound from the current editing target.
     * @param {int} soundIndex - the index of the sound to be removed.
     */
    deleteSound (soundIndex) {
        this.editingTarget.deleteSound(soundIndex);
    }

    /**
     * Get an SVG string from storage.
     * @param {int} costumeIndex - the index of the costume to be got.
     * @return {string} the costume's SVG string, or null if it's not an SVG costume.
     */
    getCostumeSvg (costumeIndex) {
        const id = this.editingTarget.sprite.costumes[costumeIndex].assetId;
        if (id && this.runtime && this.runtime.storage &&
                this.runtime.storage.get(id).dataFormat === 'svg') {
            return this.runtime.storage.get(id).decodeText();
        }
        return null;
    }

    /**
     * Update a costume with the given SVG
     * @param {int} costumeIndex - the index of the costume to be updated.
     * @param {string} svg - new SVG for the renderer.
     * @param {number} rotationCenterX x of point about which the costume rotates, relative to its upper left corner
     * @param {number} rotationCenterY y of point about which the costume rotates, relative to its upper left corner
     */
    updateSvg (costumeIndex, svg, rotationCenterX, rotationCenterY) {
        const costume = this.editingTarget.sprite.costumes[costumeIndex];
        if (costume && this.runtime && this.runtime.renderer) {
            costume.rotationCenterX = rotationCenterX;
            costume.rotationCenterY = rotationCenterY;
            this.runtime.renderer.updateSVGSkin(costume.skinId, svg, [rotationCenterX, rotationCenterY]);
        }
        const storage = this.runtime.storage;
        costume.assetId = storage.builtinHelper.cache(
            storage.AssetType.ImageVector,
            storage.DataFormat.SVG,
            (new TextEncoder()).encode(svg)
        );
        this.emitTargetsUpdate();
    }

    /**
     * Add a backdrop to the stage.
     * @param {string} md5ext - the MD5 and extension of the backdrop to be loaded.
     * @param {!object} backdropObject Object representing the backdrop.
     * @property {int} skinId - the ID of the backdrop's render skin, once installed.
     * @property {number} rotationCenterX - the X component of the backdrop's origin.
     * @property {number} rotationCenterY - the Y component of the backdrop's origin.
     * @property {number} [bitmapResolution] - the resolution scale for a bitmap backdrop.
     * @returns {?Promise} - a promise that resolves when the backdrop has been added
     */
    addBackdrop (md5ext, backdropObject) {
        return loadCostume(md5ext, backdropObject, this.runtime).then(() => {
            const stage = this.runtime.getTargetForStage();
            stage.addCostume(backdropObject);
            stage.setCostume(stage.sprite.costumes.length - 1);
        });
    }

    /**
     * Rename a sprite.
     * @param {string} targetId ID of a target whose sprite to rename.
     * @param {string} newName New name of the sprite.
     */
    renameSprite (targetId, newName) {
        const target = this.runtime.getTargetById(targetId);
        if (target) {
            if (!target.isSprite()) {
                throw new Error('Cannot rename non-sprite targets.');
            }
            const sprite = target.sprite;
            if (!sprite) {
                throw new Error('No sprite associated with this target.');
            }
            if (newName && RESERVED_NAMES.indexOf(newName) === -1) {
                const names = this.runtime.targets
                    .filter(runtimeTarget => runtimeTarget.isSprite() && runtimeTarget.id !== target.id)
                    .map(runtimeTarget => runtimeTarget.sprite.name);
                sprite.name = StringUtil.unusedName(newName, names);
            }
            this.emitTargetsUpdate();
        } else {
            throw new Error('No target with the provided id.');
        }
    }

    /**
     * Delete a sprite and all its clones.
     * @param {string} targetId ID of a target whose sprite to delete.
     */
    deleteSprite (targetId) {
        const target = this.runtime.getTargetById(targetId);

        if (target) {
            const targetIndexBeforeDelete = this.runtime.targets.map(t => t.id).indexOf(target.id);
            if (!target.isSprite()) {
                throw new Error('Cannot delete non-sprite targets.');
            }
            const sprite = target.sprite;
            if (!sprite) {
                throw new Error('No sprite associated with this target.');
            }
            this.runtime.requestRemoveMonitorByTargetId(targetId);
            const currentEditingTarget = this.editingTarget;
            for (let i = 0; i < sprite.clones.length; i++) {
                const clone = sprite.clones[i];
                this.runtime.stopForTarget(sprite.clones[i]);
                this.runtime.disposeTarget(sprite.clones[i]);
                // Ensure editing target is switched if we are deleting it.
                if (clone === currentEditingTarget) {
                    const nextTargetIndex = Math.min(this.runtime.targets.length - 1, targetIndexBeforeDelete);
                    if (this.runtime.targets.length > 0){
                        this.setEditingTarget(this.runtime.targets[nextTargetIndex].id);
                    } else {
                        this.editingTarget = null;
                    }
                }
            }
            // Sprite object should be deleted by GC.
            this.emitTargetsUpdate();
        } else {
            throw new Error('No target with the provided id.');
        }
    }

    /**
     * Duplicate a sprite.
     * @param {string} targetId ID of a target whose sprite to duplicate.
     * @returns {Promise} Promise that resolves when duplicated target has
     *     been added to the runtime.
     */
    duplicateSprite (targetId) {
        const target = this.runtime.getTargetById(targetId);
        if (!target) {
            throw new Error('No target with the provided id.');
        } else if (!target.isSprite()) {
            throw new Error('Cannot duplicate non-sprite targets.');
        } else if (!target.sprite) {
            throw new Error('No sprite associated with this target.');
        }
        return target.duplicate().then(newTarget => {
            this.runtime.targets.push(newTarget);
            this.setEditingTarget(newTarget.id);
        });
    }

    /**
     * Set the audio engine for the VM/runtime
     * @param {!AudioEngine} audioEngine The audio engine to attach
     */
    attachAudioEngine (audioEngine) {
        this.runtime.attachAudioEngine(audioEngine);
    }

    /**
     * Set the renderer for the VM/runtime
     * @param {!RenderWebGL} renderer The renderer to attach
     */
    attachRenderer (renderer) {
        this.runtime.attachRenderer(renderer);
    }

    /**
     * Set the storage module for the VM/runtime
     * @param {!ScratchStorage} storage The storage module to attach
     */
    attachStorage (storage) {
        this.runtime.attachStorage(storage);
    }

    /**
     * set the current locale and builtin messages for the VM
     * @param {[type]} locale       current locale
     * @param {[type]} messages     builtin messages map for current locale
     */
    setLocale (locale, messages) {
        if (locale !== formatMessage.setup().locale) {
            formatMessage.setup({locale: locale, translations: {[locale]: messages}});
            this.extensionManager.refreshBlocks();
        }
    }

    /**
     * Handle a Blockly event for the current editing target.
     * @param {!Blockly.Event} e Any Blockly event.
     */
    blockListener (e) {
        if (this.editingTarget) {
            this.editingTarget.blocks.blocklyListen(e, this.runtime);
        }
    }

    /**
     * Handle a Blockly event for the flyout.
     * @param {!Blockly.Event} e Any Blockly event.
     */
    flyoutBlockListener (e) {
        this.runtime.flyoutBlocks.blocklyListen(e, this.runtime);
    }

    /**
     * Handle a Blockly event for the flyout to be passed to the monitor container.
     * @param {!Blockly.Event} e Any Blockly event.
     */
    monitorBlockListener (e) {
        // Filter events by type, since monitor blocks only need to listen to these events.
        // Monitor blocks shouldn't be destroyed when flyout blocks are deleted.
        if (['create', 'change'].indexOf(e.type) !== -1) {
            this.runtime.monitorBlocks.blocklyListen(e, this.runtime);
        }
    }

    /**
     * Handle a Blockly event for the variable map.
     * @param {!Blockly.Event} e Any Blockly event.
     */
    variableListener (e) {
        // Filter events by type, since blocks only needs to listen to these
        // var events.
        if (['var_create', 'var_rename', 'var_delete'].indexOf(e.type) !== -1) {
            this.runtime.getTargetForStage().blocks.blocklyListen(e,
                this.runtime);
        }
    }

    /**
     * Set an editing target. An editor UI can use this function to switch
     * between editing different targets, sprites, etc.
     * After switching the editing target, the VM may emit updates
     * to the list of targets and any attached workspace blocks
     * (see `emitTargetsUpdate` and `emitWorkspaceUpdate`).
     * @param {string} targetId Id of target to set as editing.
     */
    setEditingTarget (targetId) {
        // Has the target id changed? If not, exit.
        if (this.editingTarget && targetId === this.editingTarget.id) {
            return;
        }
        const target = this.runtime.getTargetById(targetId);
        if (target) {
            this.editingTarget = target;
            // Emit appropriate UI updates.
            this.emitTargetsUpdate();
            this.emitWorkspaceUpdate();
            this.runtime.setEditingTarget(target);
        }
    }

    /**
     * Repopulate the workspace with the blocks of the current editingTarget. This
     * allows us to get around bugs like gui#413.
     */
    refreshWorkspace () {
        if (this.editingTarget) {
            this.emitWorkspaceUpdate();
            this.runtime.setEditingTarget(this.editingTarget);
        }
    }

    /**
     * Emit metadata about available targets.
     * An editor UI could use this to display a list of targets and show
     * the currently editing one.
     */
    emitTargetsUpdate () {
        this.emit('targetsUpdate', {
            // [[target id, human readable target name], ...].
            targetList: this.runtime.targets
                .filter(
                    // Don't report clones.
                    target => !target.hasOwnProperty('isOriginal') || target.isOriginal
                ).map(
                    target => target.toJSON()
                ),
            // Currently editing target id.
            editingTarget: this.editingTarget ? this.editingTarget.id : null
        });
    }

    /**
     * Emit an Blockly/scratch-blocks compatible XML representation
     * of the current editing target's blocks.
     */
    emitWorkspaceUpdate () {
        // Create a list of broadcast message Ids according to the stage variables
        const stageVariables = this.runtime.getTargetForStage().variables;
        let messageIds = [];
        for (const varId in stageVariables) {
            if (stageVariables[varId].type === Variable.BROADCAST_MESSAGE_TYPE) {
                messageIds.push(varId);
            }
        }
        // Go through all blocks on all targets, removing referenced
        // broadcast ids from the list.
        for (let i = 0; i < this.runtime.targets.length; i++) {
            const currTarget = this.runtime.targets[i];
            const currBlocks = currTarget.blocks._blocks;
            for (const blockId in currBlocks) {
                if (currBlocks[blockId].fields.BROADCAST_OPTION) {
                    const id = currBlocks[blockId].fields.BROADCAST_OPTION.id;
                    const index = messageIds.indexOf(id);
                    if (index !== -1) {
                        messageIds = messageIds.slice(0, index)
                            .concat(messageIds.slice(index + 1));
                    }
                }
            }
        }
        // Anything left in messageIds is not referenced by a block, so delete it.
        for (let i = 0; i < messageIds.length; i++) {
            const id = messageIds[i];
            delete this.runtime.getTargetForStage().variables[id];
        }
        const variableMap = Object.assign({},
            this.runtime.getTargetForStage().variables,
            this.editingTarget.variables
        );

        const variables = Object.keys(variableMap).map(k => variableMap[k]);

        const xmlString = `<xml xmlns="http://www.w3.org/1999/xhtml">
                            <variables>
                                ${variables.map(v => v.toXML()).join()}
                            </variables>
                            ${this.editingTarget.blocks.toXML()}
                        </xml>`;

        this.emit('workspaceUpdate', {xml: xmlString});
    }

    /**
     * Get a target id for a drawable id. Useful for interacting with the renderer
     * @param {int} drawableId The drawable id to request the target id for
     * @returns {?string} The target id, if found. Will also be null if the target found is the stage.
     */
    getTargetIdForDrawableId (drawableId) {
        const target = this.runtime.getTargetByDrawableId(drawableId);
        if (target && target.hasOwnProperty('id') && target.hasOwnProperty('isStage') && !target.isStage) {
            return target.id;
        }
        return null;
    }

    /**
     * Put a target into a "drag" state, during which its X/Y positions will be unaffected
     * by blocks.
     * @param {string} targetId The id for the target to put into a drag state
     */
    startDrag (targetId) {
        const target = this.runtime.getTargetById(targetId);
        if (target) {
            this._dragTarget = target;
            target.startDrag();
        }
    }

    /**
     * Remove a target from a drag state, so blocks may begin affecting X/Y position again
     * @param {string} targetId The id for the target to remove from the drag state
     */
    stopDrag (targetId) {
        const target = this.runtime.getTargetById(targetId);
        if (target) {
            this._dragTarget = null;
            target.stopDrag();
            this.setEditingTarget(target.id);
        }
    }

    /**
     * Post/edit sprite info for the current editing target or the drag target.
     * @param {object} data An object with sprite info data to set.
     */
    postSpriteInfo (data) {
        if (this._dragTarget) {
            this._dragTarget.postSpriteInfo(data);
        } else {
            this.editingTarget.postSpriteInfo(data);
        }
    }
}

module.exports = VirtualMachine;
