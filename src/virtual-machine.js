const TextEncoder = require('text-encoding').TextEncoder;
const EventEmitter = require('events');
const JSZip = require('jszip');

const Buffer = require('buffer').Buffer;
const centralDispatch = require('./dispatch/central-dispatch');
const ExtensionManager = require('./extension-support/extension-manager');
const log = require('./util/log');
const MathUtil = require('./util/math-util');
const Runtime = require('./engine/runtime');
const sb2 = require('./serialization/sb2');
const sb3 = require('./serialization/sb3');
const StringUtil = require('./util/string-util');
const formatMessage = require('format-message');
const validate = require('scratch-parser');

const Variable = require('./engine/variable');

const {loadCostume} = require('./import/load-costume.js');
const {loadSound} = require('./import/load-sound.js');
const {serializeSounds, serializeCostumes} = require('./serialization/serialize-assets');
require('canvas-toBlob');

const RESERVED_NAMES = ['_mouse_', '_stage_', '_edge_', '_myself_', '_random_'];

const CORE_EXTENSIONS = [
    // 'motion',
    // 'looks',
    // 'sound',
    // 'events',
    // 'control',
    // 'sensing',
    // 'operators',
    // 'variables',
    // 'myBlocks'
];

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
        this.runtime.on(Runtime.BLOCK_DRAG_UPDATE, areBlocksOverGui => {
            this.emit(Runtime.BLOCK_DRAG_UPDATE, areBlocksOverGui);
        });
        this.runtime.on(Runtime.BLOCK_DRAG_END, blocks => {
            this.emit(Runtime.BLOCK_DRAG_END, blocks);
        });
        this.runtime.on(Runtime.EXTENSION_ADDED, blocksInfo => {
            this.emit(Runtime.EXTENSION_ADDED, blocksInfo);
        });
        this.runtime.on(Runtime.BLOCKSINFO_UPDATE, blocksInfo => {
            this.emit(Runtime.BLOCKSINFO_UPDATE, blocksInfo);
        });
        this.runtime.on(Runtime.PERIPHERAL_LIST_UPDATE, info => {
            this.emit(Runtime.PERIPHERAL_LIST_UPDATE, info);
        });
        this.runtime.on(Runtime.PERIPHERAL_CONNECTED, () =>
            this.emit(Runtime.PERIPHERAL_CONNECTED)
        );
        this.runtime.on(Runtime.PERIPHERAL_ERROR, () =>
            this.emit(Runtime.PERIPHERAL_ERROR)
        );
        this.runtime.on(Runtime.PERIPHERAL_SCAN_TIMEOUT, () =>
            this.emit(Runtime.PERIPHERAL_SCAN_TIMEOUT)
        );

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
        if (this.runtime.turboMode) {
            this.emit(Runtime.TURBO_MODE_ON);
        } else {
            this.emit(Runtime.TURBO_MODE_OFF);
        }
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

    setVideoProvider (videoProvider) {
        this.runtime.ioDevices.video.setProvider(videoProvider);
    }

    /**
     * Tell the specified extension to scan for a peripheral.
     * @param {string} extensionId - the id of the extension.
     */
    scanForPeripheral (extensionId) {
        this.runtime.scanForPeripheral(extensionId);
    }

    /**
     * Connect to the extension's specified peripheral.
     * @param {string} extensionId - the id of the extension.
     * @param {number} peripheralId - the id of the peripheral.
     */
    connectPeripheral (extensionId, peripheralId) {
        this.runtime.connectPeripheral(extensionId, peripheralId);
    }

    /**
     * Disconnect from the extension's connected peripheral.
     * @param {string} extensionId - the id of the extension.
     */
    disconnectPeripheral (extensionId) {
        this.runtime.disconnectPeripheral(extensionId);
    }

    /**
     * Returns whether the extension has a currently connected peripheral.
     * @param {string} extensionId - the id of the extension.
     * @return {boolean} - whether the extension has a connected peripheral.
     */
    getPeripheralIsConnected (extensionId) {
        return this.runtime.getPeripheralIsConnected(extensionId);
    }

    /**
     * Load a Scratch project from a .sb, .sb2, .sb3 or json string.
     * @param {string | object} input A json string, object, or ArrayBuffer representing the project to load.
     * @return {!Promise} Promise that resolves after targets are installed.
     */
    loadProject (input) {
        if (typeof input === 'object' && !(input instanceof ArrayBuffer) &&
          !ArrayBuffer.isView(input)) {
            // If the input is an object and not any ArrayBuffer
            // or an ArrayBuffer view (this includes all typed arrays and DataViews)
            // turn the object into a JSON string, because we suspect
            // this is a project.json as an object
            // validate expects a string or buffer as input
            // TODO not sure if we need to check that it also isn't a data view
            input = JSON.stringify(input);
        }

        const validationPromise = new Promise((resolve, reject) => {
            // The second argument of false below indicates to the validator that the
            // input should be parsed/validated as an entire project (and not a single sprite)
            validate(input, false, (error, res) => {
                if (error) return reject(error);
                resolve(res);
            });
        });

        return validationPromise
            .then(validatedInput => this.deserializeProject(validatedInput[0], validatedInput[1]))
            .catch(error => {
                // Intentionally rejecting here (want errors to be handled by caller)
                if (error.hasOwnProperty('validationError')) {
                    return Promise.reject(JSON.stringify(error));
                }
                return Promise.reject(error);
            });
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
            vm.loadProject(projectAsset.data);
        });
    }

    /**
     * @returns {string} Project in a Scratch 3.0 JSON representation.
     */
    saveProjectSb3 () {
        const soundDescs = serializeSounds(this.runtime);
        const costumeDescs = serializeCostumes(this.runtime);
        const projectJson = this.toJSON();

        // TODO want to eventually move zip creation out of here, and perhaps
        // into scratch-storage
        const zip = new JSZip();

        // Put everything in a zip file
        zip.file('project.json', projectJson);
        this._addFileDescsToZip(soundDescs.concat(costumeDescs), zip);

        return zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: {
                level: 6 // Tradeoff between best speed (1) and best compression (9)
            }
        });
    }

    _addFileDescsToZip (fileDescs, zip) {
        for (let i = 0; i < fileDescs.length; i++) {
            const currFileDesc = fileDescs[i];
            zip.file(currFileDesc.fileName, currFileDesc.fileContent);
        }
    }

    /**
     * Exports a sprite in the sprite3 format.
     * @param {string} targetId ID of the target to export
     * @param {string=} optZipType Optional type that the resulting
     * zip should be outputted in. Options are: base64, binarystring,
     * array, uint8array, arraybuffer, blob, or nodebuffer. Defaults to
     * blob if argument not provided.
     * See https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html#type-option
     * for more information about these options.
     * @return {object} A generated zip of the sprite and its assets in the format
     * specified by optZipType or blob by default.
     */
    exportSprite (targetId, optZipType) {
        const soundDescs = serializeSounds(this.runtime, targetId);
        const costumeDescs = serializeCostumes(this.runtime, targetId);
        const spriteJson = JSON.stringify(sb3.serialize(this.runtime, targetId));

        const zip = new JSZip();
        zip.file('sprite.json', spriteJson);
        this._addFileDescsToZip(soundDescs.concat(costumeDescs), zip);

        return zip.generateAsync({
            type: typeof optZipType === 'string' ? optZipType : 'blob',
            compression: 'DEFLATE',
            compressionOptions: {
                level: 6
            }
        });
    }

    /**
     * Export project as a Scratch 3.0 JSON representation.
     * @return {string} Serialized state of the runtime.
     */
    toJSON () {
        return JSON.stringify(sb3.serialize(this.runtime));
    }

    // TODO do we still need this function? Keeping it here so as not to introduce
    // a breaking change.
    /**
     * Load a project from a Scratch JSON representation.
     * @param {string} json JSON string representing a project.
     * @returns {Promise} Promise that resolves after the project has loaded
     */
    fromJSON (json) {
        log.warning('fromJSON is now just a wrapper around loadProject, please use that function instead.');
        return this.loadProject(json);
    }

    /**
     * Load a project from a Scratch JSON representation.
     * @param {string} projectJSON JSON string representing a project.
     * @param {?JSZip} zip Optional zipped project containing assets to be loaded.
     * @returns {Promise} Promise that resolves after the project has loaded
     */
    deserializeProject (projectJSON, zip) {
        // Clear the current runtime
        this.clear();

        const runtime = this.runtime;
        const deserializePromise = function () {
            const projectVersion = projectJSON.projectVersion;
            if (projectVersion === 2) {
                return sb2.deserialize(projectJSON, runtime, false, zip);
            }
            if (projectVersion === 3) {
                return sb3.deserialize(projectJSON, runtime, zip);
            }
            return Promise.reject('Unable to verify Scratch Project version.');
        };
        return deserializePromise()
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

        if (wholeProject) {
            CORE_EXTENSIONS.forEach(extensionID => {
                if (!this.extensionManager.isExtensionLoaded(extensionID)) {
                    extensionPromises.push(this.extensionManager.loadExtensionURL(extensionID));
                }
            });
        }

        extensions.extensionIDs.forEach(extensionID => {
            if (!this.extensionManager.isExtensionLoaded(extensionID)) {
                const extensionURL = extensions.extensionURLs.get(extensionID) || extensionID;
                extensionPromises.push(this.extensionManager.loadExtensionURL(extensionURL));
            }
        });

        targets = targets.filter(target => !!target);

        return Promise.all(extensionPromises).then(() => {
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

            if (!wholeProject) {
                this.editingTarget.fixUpVariableReferences();
            }

            // Update the VM user's knowledge of targets and blocks on the workspace.
            this.emitTargetsUpdate();
            this.emitWorkspaceUpdate();
            this.runtime.setEditingTarget(this.editingTarget);
        });
    }

    /**
     * Add a sprite, this could be .sprite2 or .sprite3. Unpack and validate
     * such a file first.
     * @param {string | object} input A json string, object, or ArrayBuffer representing the project to load.
     * @return {!Promise} Promise that resolves after targets are installed.
     */
    addSprite (input) {
        const errorPrefix = 'Sprite Upload Error:';
        if (typeof input === 'object' && !(input instanceof ArrayBuffer) &&
          !ArrayBuffer.isView(input)) {
            // If the input is an object and not any ArrayBuffer
            // or an ArrayBuffer view (this includes all typed arrays and DataViews)
            // turn the object into a JSON string, because we suspect
            // this is a project.json as an object
            // validate expects a string or buffer as input
            // TODO not sure if we need to check that it also isn't a data view
            input = JSON.stringify(input);
        }

        const validationPromise = new Promise((resolve, reject) => {
            // The second argument of true below indicates to the parser/validator
            // that the given input should be treated as a single sprite and not
            // an entire project
            validate(input, true, (error, res) => {
                if (error) return reject(error);
                resolve(res);
            });
        });

        return validationPromise
            .then(validatedInput => {
                const projectVersion = validatedInput[0].projectVersion;
                if (projectVersion === 2) {
                    return this._addSprite2(validatedInput[0], validatedInput[1]);
                }
                if (projectVersion === 3) {
                    return this._addSprite3(validatedInput[0], validatedInput[1]);
                }
                return Promise.reject(`${errorPrefix} Unable to verify sprite version.`);
            })
            .catch(error => {
                // Intentionally rejecting here (want errors to be handled by caller)
                if (error.hasOwnProperty('validationError')) {
                    return Promise.reject(JSON.stringify(error));
                }
                return Promise.reject(`${errorPrefix} ${error}`);
            });
    }

    /**
     * Add a single sprite from the "Sprite2" (i.e., SB2 sprite) format.
     * @param {object} sprite Object representing 2.0 sprite to be added.
     * @param {?ArrayBuffer} zip Optional zip of assets being referenced by json
     * @returns {Promise} Promise that resolves after the sprite is added
     */
    _addSprite2 (sprite, zip) {
        // Validate & parse

        return sb2.deserialize(sprite, this.runtime, true, zip)
            .then(({targets, extensions}) =>
                this.installTargets(targets, extensions, false));
    }

    /**
     * Add a single sb3 sprite.
     * @param {object} sprite Object rperesenting 3.0 sprite to be added.
     * @param {?ArrayBuffer} zip Optional zip of assets being referenced by target json
     * @returns {Promise} Promise that resolves after the sprite is added
     */
    _addSprite3 (sprite, zip) {
        // Validate & parse

        return sb3
            .deserialize(sprite, this.runtime, zip, true)
            .then(({targets, extensions}) => this.installTargets(targets, extensions, false));
    }

    /**
     * Add a costume to the current editing target.
     * @param {string} md5ext - the MD5 and extension of the costume to be loaded.
     * @param {!object} costumeObject Object representing the costume.
     * @property {int} skinId - the ID of the costume's render skin, once installed.
     * @property {number} rotationCenterX - the X component of the costume's origin.
     * @property {number} rotationCenterY - the Y component of the costume's origin.
     * @property {number} [bitmapResolution] - the resolution scale for a bitmap costume.
     * @param {string} optTargetId - the id of the target to add to, if not the editing target.
     * @returns {?Promise} - a promise that resolves when the costume has been added
     */
    addCostume (md5ext, costumeObject, optTargetId) {
        const target = optTargetId ? this.runtime.getTargetById(optTargetId) :
            this.editingTarget;
        if (target) {
            return loadCostume(md5ext, costumeObject, this.runtime).then(() => {
                target.addCostume(costumeObject);
                target.setCostume(
                    target.getCostumes().length - 1
                );
            });
        }
        // If the target cannot be found by id, return a rejected promise
        return new Promise.reject();
    }

    /**
     * Duplicate the costume at the given index. Add it at that index + 1.
     * @param {!int} costumeIndex Index of costume to duplicate
     * @returns {?Promise} - a promise that resolves when the costume has been decoded and added
     */
    duplicateCostume (costumeIndex) {
        const originalCostume = this.editingTarget.getCostumes()[costumeIndex];
        const clone = Object.assign({}, originalCostume);
        const md5ext = `${clone.assetId}.${clone.dataFormat}`;
        return loadCostume(md5ext, clone, this.runtime).then(() => {
            this.editingTarget.addCostume(clone, costumeIndex + 1);
            this.editingTarget.setCostume(costumeIndex + 1);
            this.emitTargetsUpdate();
        });
    }

    /**
     * Duplicate the sound at the given index. Add it at that index + 1.
     * @param {!int} soundIndex Index of sound to duplicate
     * @returns {?Promise} - a promise that resolves when the sound has been decoded and added
     */
    duplicateSound (soundIndex) {
        const originalSound = this.editingTarget.getSounds()[soundIndex];
        const clone = Object.assign({}, originalSound);
        return loadSound(clone, this.runtime, this.editingTarget.sprite).then(() => {
            this.editingTarget.addSound(clone, soundIndex + 1);
            this.emitTargetsUpdate();
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
     * @return {?function} A function to restore the deleted costume, or null,
     * if no costume was deleted.
     */
    deleteCostume (costumeIndex) {
        const deletedCostume = this.editingTarget.deleteCostume(costumeIndex);
        if (deletedCostume) {
            const target = this.editingTarget;
            return () => {
                target.addCostume(deletedCostume);
                this.emitTargetsUpdate();
            };
        }
        return null;
    }

    /**
     * Add a sound to the current editing target.
     * @param {!object} soundObject Object representing the costume.
     * @param {string} optTargetId - the id of the target to add to, if not the editing target.
     * @returns {?Promise} - a promise that resolves when the sound has been decoded and added
     */
    addSound (soundObject, optTargetId) {
        const target = optTargetId ? this.runtime.getTargetById(optTargetId) :
            this.editingTarget;
        if (target) {
            return loadSound(soundObject, this.runtime, target.sprite).then(() => {
                target.addSound(soundObject);
                this.emitTargetsUpdate();
            });
        }
        // If the target cannot be found by id, return a rejected promise
        return new Promise.reject();
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
            return this.editingTarget.sprite.soundBank.getSoundPlayer(id).buffer;
        }
        return null;
    }

    /**
     * Update a sound buffer.
     * @param {int} soundIndex - the index of the sound to be updated.
     * @param {AudioBuffer} newBuffer - new audio buffer for the audio engine.
     * @param {ArrayBuffer} soundEncoding - the new (wav) encoded sound to be stored
     */
    updateSoundBuffer (soundIndex, newBuffer, soundEncoding) {
        const sound = this.editingTarget.sprite.sounds[soundIndex];
        const id = sound ? sound.soundId : null;
        if (id && this.runtime && this.runtime.audioEngine) {
            this.editingTarget.sprite.soundBank.getSoundPlayer(id).buffer = newBuffer;
        }
        // Update sound in runtime
        if (soundEncoding) {
            // Now that we updated the sound, the format should also be updated
            // so that the sound can eventually be decoded the right way.
            // Sounds that were formerly 'adpcm', but were updated in sound editor
            // will not get decoded by the audio engine correctly unless the format
            // is updated as below.
            sound.format = '';
            const storage = this.runtime.storage;
            sound.assetId = storage.builtinHelper.cache(
                storage.AssetType.Sound,
                storage.DataFormat.WAV,
                soundEncoding
            );
            sound.dataFormat = storage.DataFormat.WAV;
            sound.md5 = `${sound.assetId}.${sound.dataFormat}`;
        }
        // If soundEncoding is null, it's because gui had a problem
        // encoding the updated sound. We don't want to store anything in this
        // case, and gui should have logged an error.

        this.emitTargetsUpdate();
    }

    /**
     * Delete a sound from the current editing target.
     * @param {int} soundIndex - the index of the sound to be removed.
     * @return {?Function} A function to restore the sound that was deleted,
     * or null, if no sound was deleted.
     */
    deleteSound (soundIndex) {
        const target = this.editingTarget;
        const deletedSound = this.editingTarget.deleteSound(soundIndex);
        if (deletedSound) {
            const restoreFun = () => {
                target.addSound(deletedSound);
                this.emitTargetsUpdate();
            };
            return restoreFun;
        }
        return null;
    }

    /**
     * Get a string representation of the image from storage.
     * @param {int} costumeIndex - the index of the costume to be got.
     * @return {string} the costume's SVG string if it's SVG,
     *     a dataURI if it's a PNG or JPG, or null if it couldn't be found or decoded.
     */
    getCostume (costumeIndex) {
        const id = this.editingTarget.getCostumes()[costumeIndex].assetId;
        if (!id || !this.runtime || !this.runtime.storage) return null;
        const format = this.runtime.storage.get(id).dataFormat;
        if (format === this.runtime.storage.DataFormat.SVG) {
            return this.runtime.storage.get(id).decodeText();
        } else if (format === this.runtime.storage.DataFormat.PNG ||
                format === this.runtime.storage.DataFormat.JPG) {
            return this.runtime.storage.get(id).encodeDataURI();
        }
        log.error(`Unhandled format: ${this.runtime.storage.get(id).dataFormat}`);
        return null;
    }

    /**
     * Update a costume with the given bitmap
     * @param {!int} costumeIndex - the index of the costume to be updated.
     * @param {!ImageData} bitmap - new bitmap for the renderer.
     * @param {!number} rotationCenterX x of point about which the costume rotates, relative to its upper left corner
     * @param {!number} rotationCenterY y of point about which the costume rotates, relative to its upper left corner
     * @param {!number} bitmapResolution 1 for bitmaps that have 1 pixel per unit of stage,
     *     2 for double-resolution bitmaps
     */
    updateBitmap (costumeIndex, bitmap, rotationCenterX, rotationCenterY, bitmapResolution) {
        const costume = this.editingTarget.getCostumes()[costumeIndex];
        if (!(costume && this.runtime && this.runtime.renderer)) return;

        costume.rotationCenterX = rotationCenterX;
        costume.rotationCenterY = rotationCenterY;

        // @todo: updateBitmapSkin does not take ImageData
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d');
        context.putImageData(bitmap, 0, 0);

        // Divide by resolution because the renderer's definition of the rotation center
        // is the rotation center divided by the bitmap resolution
        this.runtime.renderer.updateBitmapSkin(
            costume.skinId,
            canvas,
            bitmapResolution,
            [rotationCenterX / bitmapResolution, rotationCenterY / bitmapResolution]
        );

        // @todo there should be a better way to get from ImageData to a decodable storage format
        canvas.toBlob(blob => {
            const reader = new FileReader();
            reader.addEventListener('loadend', () => {
                const storage = this.runtime.storage;
                costume.assetId = storage.builtinHelper.cache(
                    storage.AssetType.ImageBitmap,
                    storage.DataFormat.PNG,
                    Buffer.from(reader.result)
                );
                costume.dataFormat = storage.DataFormat.PNG;
                costume.bitmapResolution = bitmapResolution;
                costume.size = [bitmap.width, bitmap.height];
                costume.md5 = `${costume.assetId}.${costume.dataFormat}`;
                this.emitTargetsUpdate();
            });
            reader.readAsArrayBuffer(blob);
        });
    }

    /**
     * Update a costume with the given SVG
     * @param {int} costumeIndex - the index of the costume to be updated.
     * @param {string} svg - new SVG for the renderer.
     * @param {number} rotationCenterX x of point about which the costume rotates, relative to its upper left corner
     * @param {number} rotationCenterY y of point about which the costume rotates, relative to its upper left corner
     */
    updateSvg (costumeIndex, svg, rotationCenterX, rotationCenterY) {
        const costume = this.editingTarget.getCostumes()[costumeIndex];
        if (costume && this.runtime && this.runtime.renderer) {
            costume.rotationCenterX = rotationCenterX;
            costume.rotationCenterY = rotationCenterY;
            this.runtime.renderer.updateSVGSkin(costume.skinId, svg, [rotationCenterX, rotationCenterY]);
            costume.size = this.runtime.renderer.getSkinSize(costume.skinId);
        }
        const storage = this.runtime.storage;
        costume.assetId = storage.builtinHelper.cache(
            storage.AssetType.ImageVector,
            storage.DataFormat.SVG,
            (new TextEncoder()).encode(svg)
        );
        // If we're in here, we've edited an svg in the vector editor,
        // so the dataFormat should be 'svg'
        costume.dataFormat = storage.DataFormat.SVG;
        costume.md5 = `${costume.assetId}.${costume.dataFormat}`;
        costume.bitmapResolution = 1;
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
            stage.setCostume(stage.getCostumes().length - 1);
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
                const oldName = sprite.name;
                const newUnusedName = StringUtil.unusedName(newName, names);
                sprite.name = newUnusedName;
                const allTargets = this.runtime.targets;
                for (let i = 0; i < allTargets.length; i++) {
                    const currTarget = allTargets[i];
                    currTarget.blocks.updateAssetName(oldName, newName, 'sprite');
                }
            }
            this.emitTargetsUpdate();
        } else {
            throw new Error('No target with the provided id.');
        }
    }

    /**
     * Delete a sprite and all its clones.
     * @param {string} targetId ID of a target whose sprite to delete.
     * @return {Function} Returns a function to restore the sprite that was deleted
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
            const spritePromise = this.exportSprite(targetId, 'uint8array');
            const restoreSprite = () => spritePromise.then(spriteBuffer => this.addSprite(spriteBuffer));
            // Remove monitors from the runtime state and remove the
            // target-specific monitored blocks (e.g. local variables)
            this.runtime.requestRemoveMonitorByTargetId(targetId);
            const targetSpecificMonitorBlockIds = Object.keys(this.runtime.monitorBlocks._blocks)
                .filter(key => this.runtime.monitorBlocks._blocks[key].targetId === targetId);
            for (const blockId of targetSpecificMonitorBlockIds) {
                this.runtime.monitorBlocks.deleteBlock(blockId);
            }
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
            return restoreSprite;
        }

        throw new Error('No target with the provided id.');
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
     * Set the svg adapter for the VM/runtime, which converts scratch 2 svgs to scratch 3 svgs
     * @param {!SvgRenderer} svgAdapter The adapter to attach
     */
    attachV2SVGAdapter (svgAdapter) {
        this.runtime.attachV2SVGAdapter(svgAdapter);
    }

    /**
     * Set the bitmap adapter for the VM/runtime, which converts scratch 2
     * bitmaps to scratch 3 bitmaps. (Scratch 3 bitmaps are all bitmap resolution 2)
     * @param {!function} bitmapAdapter The adapter to attach
     */
    attachV2BitmapAdapter (bitmapAdapter) {
        this.runtime.attachV2BitmapAdapter(bitmapAdapter);
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
     * @param {!string} locale       current locale
     * @param {!object} messages     builtin messages map for current locale
     * @returns {Promise} Promise that resolves when all the blocks have been
     *     updated for a new locale (or empty if locale hasn't changed.)
     */
    setLocale (locale, messages) {
        if (locale === formatMessage.setup().locale) {
            return Promise.resolve();
        }
        formatMessage.setup({locale: locale, translations: {[locale]: messages}});
        return this.extensionManager.refreshBlocks();
    }

    /**
     * get the current locale for the VM
     * @returns {string} the current locale in the VM
     */
    getLocale () {
        return formatMessage.setup().locale;
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
     * Called when blocks are dragged from one sprite to another. Adds the blocks to the
     * workspace of the given target.
     * @param {!Array<object>} blocks Blocks to add.
     * @param {!string} targetId Id of target to add blocks to.
     * @param {?string} optFromTargetId Optional target id indicating that blocks are being
     * shared from that target. This is needed for resolving any potential variable conflicts.
     */
    shareBlocksToTarget (blocks, targetId, optFromTargetId) {
        const copiedBlocks = JSON.parse(JSON.stringify(blocks));
        const target = this.runtime.getTargetById(targetId);

        if (optFromTargetId) {
            // If the blocks are being shared from another target,
            // resolve any possible variable conflicts that may arise.
            const fromTarget = this.runtime.getTargetById(optFromTargetId);
            fromTarget.resolveVariableSharingConflictsWithTarget(copiedBlocks, target);
        }

        for (let i = 0; i < copiedBlocks.length; i++) {
            target.blocks.createBlock(copiedBlocks[i]);
        }
        target.blocks.updateTargetSpecificBlocks(target.isStage);
    }

    /**
     * Called when costumes are dragged from editing target to another target.
     * Sets the newly added costume as the current costume.
     * @param {!number} costumeIndex Index of the costume of the editing target to share.
     * @param {!string} targetId Id of target to add the costume.
     * @return {Promise} Promise that resolves when the new costume has been loaded.
     */
    shareCostumeToTarget (costumeIndex, targetId) {
        const originalCostume = this.editingTarget.getCostumes()[costumeIndex];
        const clone = Object.assign({}, originalCostume);
        const md5ext = `${clone.assetId}.${clone.dataFormat}`;
        return loadCostume(md5ext, clone, this.runtime).then(() => {
            const target = this.runtime.getTargetById(targetId);
            if (target) {
                target.addCostume(clone);
                target.setCostume(
                    target.getCostumes().length - 1
                );
            }
        });
    }

    /**
     * Called when sounds are dragged from editing target to another target.
     * @param {!number} soundIndex Index of the sound of the editing target to share.
     * @param {!string} targetId Id of target to add the sound.
     * @return {Promise} Promise that resolves when the new sound has been loaded.
     */
    shareSoundToTarget (soundIndex, targetId) {
        const originalSound = this.editingTarget.getSounds()[soundIndex];
        const clone = Object.assign({}, originalSound);
        const target = this.runtime.getTargetById(targetId);
        return loadSound(clone, this.runtime, target.sprite).then(() => {
            if (target) {
                target.addSound(clone);
                this.emitTargetsUpdate();
            }
        });
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
        const globalVarMap = Object.assign({}, this.runtime.getTargetForStage().variables);
        const localVarMap = this.editingTarget.isStage ?
            Object.create(null) :
            Object.assign({}, this.editingTarget.variables);

        const globalVariables = Object.keys(globalVarMap).map(k => globalVarMap[k]);
        const localVariables = Object.keys(localVarMap).map(k => localVarMap[k]);
        const workspaceComments = Object.keys(this.editingTarget.comments)
            .map(k => this.editingTarget.comments[k])
            .filter(c => c.blockId === null);

        const xmlString = `<xml xmlns="http://www.w3.org/1999/xhtml">
                            <variables>
                                ${globalVariables.map(v => v.toXML()).join()}
                                ${localVariables.map(v => v.toXML(true)).join()}
                            </variables>
                            ${workspaceComments.map(c => c.toXML()).join()}
                            ${this.editingTarget.blocks.toXML(this.editingTarget.comments)}
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
     * Reorder target by index. Return whether a change was made.
     * @param {!string} targetIndex Index of the target.
     * @param {!number} newIndex index that the target should be moved to.
     * @returns {boolean} Whether a target was reordered.
     */
    reorderTarget (targetIndex, newIndex) {
        let targets = this.runtime.targets;
        targetIndex = MathUtil.clamp(targetIndex, 0, targets.length - 1);
        newIndex = MathUtil.clamp(newIndex, 0, targets.length - 1);
        if (targetIndex === newIndex) return false;
        const target = targets[targetIndex];
        targets = targets.slice(0, targetIndex).concat(targets.slice(targetIndex + 1));
        targets.splice(newIndex, 0, target);
        this.runtime.targets = targets;
        this.emitTargetsUpdate();
        return true;
    }

    /**
     * Reorder the costumes of a target if it exists. Return whether it succeeded.
     * @param {!string} targetId ID of the target which owns the costumes.
     * @param {!number} costumeIndex index of the costume to move.
     * @param {!number} newIndex index that the costume should be moved to.
     * @returns {boolean} Whether a costume was reordered.
     */
    reorderCostume (targetId, costumeIndex, newIndex) {
        const target = this.runtime.getTargetById(targetId);
        if (target) {
            return target.reorderCostume(costumeIndex, newIndex);
        }
        return false;
    }

    /**
     * Reorder the sounds of a target if it exists. Return whether it occured.
     * @param {!string} targetId ID of the target which owns the sounds.
     * @param {!number} soundIndex index of the sound to move.
     * @param {!number} newIndex index that the sound should be moved to.
     * @returns {boolean} Whether a sound was reordered.
     */
    reorderSound (targetId, soundIndex, newIndex) {
        const target = this.runtime.getTargetById(targetId);
        if (target) {
            return target.reorderSound(soundIndex, newIndex);
        }
        return false;
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
            this.setEditingTarget(target.sprite && target.sprite.clones[0] ?
                target.sprite.clones[0].id : target.id);
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

    /**
     * Set a target's variable's value. Return whether it succeeded.
     * @param {!string} targetId ID of the target which owns the variable.
     * @param {!string} variableId ID of the variable to set.
     * @param {!*} value The new value of that variable.
     * @returns {boolean} whether the target and variable were found and updated.
     */
    setVariableValue (targetId, variableId, value) {
        const target = this.runtime.getTargetById(targetId);
        if (target) {
            const variable = target.lookupVariableById(variableId);
            if (variable) {
                variable.value = value;
                return true;
            }
        }
        return false;
    }

    /**
     * Get a target's variable's value. Return null if the target or variable does not exist.
     * @param {!string} targetId ID of the target which owns the variable.
     * @param {!string} variableId ID of the variable to set.
     * @returns {?*} The value of the variable, or null if it could not be looked up.
     */
    getVariableValue (targetId, variableId) {
        const target = this.runtime.getTargetById(targetId);
        if (target) {
            const variable = target.lookupVariableById(variableId);
            if (variable) {
                return variable.value;
            }
        }
        return null;
    }
}

module.exports = VirtualMachine;
