import EventEmitter from "events";

import validate from "scratch-parser";

import JSZip from "jszip";

import { get } from "http";

import lodash from "lodash";
import Runtime from "./engine/runtime.mjs";
import Variable from "./engine/variable.mjs";

import "canvas-toBlob";

import sb3 from "./serialization/sb3.mjs";
import sb2 from "./serialization/sb2.mjs";

import { loadCostume } from "./import/load-costume.mjs";
import { loadSound } from "./import/load-sound.mjs";

import StringUtil from "./util/string-util.mjs";
import { KEY_NAME } from "./io/keyboard.mjs";
import RenderedTarget from "./sprites/rendered-target.mjs";
import PrimProxy from "./worker/prim-proxy.js";
import ScratchConverter from "./conversion/scratch-conversion.mjs";

const { isUndefined } = lodash;

const RESERVED_NAMES = ["_mouse_", "_stage_", "_edge_", "_myself_", "_random_"];

/**
 * Handles connections between blocks, stage, and extensions.
 * @constructor
 */
export default class VirtualMachine extends EventEmitter {
    constructor() {
        super();

        /**
         * VM runtime, to store blocks, I/O devices, sprites/targets, etc.
         * @type {!Runtime}
         */
        this.runtime = new Runtime(this.startHats.bind(this));
        this.runtime.on("WORKER READY", () => {
            this.emit("VM READY");
        });
        this.runtime.on("RUNTIME ERROR", (threadId, message, lineNumber, type) => {
            this.emit("RUNTIME ERROR", threadId, message, lineNumber, type);
        });
        this.runtime.on("COMPILE TIME ERROR", (threadId, message, lineNumber, type) => {
            this.emit("COMPILE TIME ERROR", threadId, message, lineNumber, type);
        });
    }

    /**
     * Start running the VM - do this before anything else.
     */
    start() {
        this.runtime.start();
    }

    /**
     * Quit the VM, clearing any handles which might keep the process alive.
     * Do not use the runtime after calling this method. This method is meant for test shutdown.
     */
    quit() {
        this.runtime.quit();
    }

    /**
     * "Green flag" handler - start all threads starting with a green flag.
     */
    async greenFlag() {
        await this.runtime.greenFlag();
    }

    /**
     * Stop all threads and running activities.
     */
    stopAll() {
        this.runtime.stopAll();
    }

    /**
     * Clear out current running project data.
     */
    clear() {
        this.runtime.dispose();
    }

    /**
     * Set the audio engine for the VM/runtime
     * @param {!AudioEngine} audioEngine The audio engine to attach
     */
    attachAudioEngine(audioEngine) {
        this.runtime.attachAudioEngine(audioEngine);
    }

    /**
     * Set the bitmap adapter for the VM/runtime, which converts scratch 2
     * bitmaps to scratch 3 bitmaps. (Scratch 3 bitmaps are all bitmap resolution 2)
     * @param {!function} bitmapAdapter The adapter to attach
     */
    attachV2BitmapAdapter(bitmapAdapter) {
        this.runtime.attachV2BitmapAdapter(bitmapAdapter);
    }

    /**
     * Set the renderer for the VM/runtime
     * @param {!RenderWebGL} renderer The renderer to attach
     */
    attachRenderer(renderer) {
        this.runtime.attachRenderer(renderer);
    }

    /**
     * @returns {RenderWebGL} The renderer attached to the vm
     */
    get renderer() {
        return this.runtime && this.runtime.renderer;
    }

    /**
     * Set the storage module for the VM/runtime
     * @param {!ScratchStorage} storage The storage module to attach
     */
    attachStorage(storage) {
        this.runtime.attachStorage(storage);
    }

    /**
     * Emit metadata about available targets.
     * An editor UI could use this to display a list of targets and show
     * the currently editing one.
     * @param {bool} triggerProjectChange If true, also emit a project changed event.
     * Disabled selectively by updates that don't affect project serialization.
     * Defaults to true.
     */
    emitTargetsUpdate(triggerProjectChange) {
        // eslint-disable-next-line no-param-reassign
        if (typeof triggerProjectChange === "undefined") triggerProjectChange = true;
        this.emit("targetsUpdate", {
            // [[target id, human readable target name], ...].
            targetList: this.runtime.targets
                .filter(
                    // Don't report clones.
                    (target) => !target.hasOwnProperty("isOriginal") || target.isOriginal
                )
                .map((target) => target.toJSON()),
            // Currently editing target id.
            editingTarget: this.editingTarget ? this.editingTarget.id : null,
        });
        if (triggerProjectChange) {
            this.runtime.emitProjectChanged();
        }
    }

    /**
     * Emit an Blockly/scratch-blocks compatible XML representation
     * of the current editing target's blocks.
     */
    emitWorkspaceUpdate() {
        // Create a list of broadcast message Ids according to the stage variables
        const stageVariables = this.runtime.getTargetForStage().variables;
        const messageIds = [];
        // eslint-disable-next-line no-restricted-syntax
        for (const varId in stageVariables) {
            if (stageVariables[varId].type === Variable.BROADCAST_MESSAGE_TYPE) {
                messageIds.push(varId);
            }
        }
        // // Go through all blocks on all targets, removing referenced
        // // broadcast ids from the list.
        // for (let i = 0; i < this.runtime.targets.length; i++) {
        //     const currTarget = this.runtime.targets[i];
        //     const currBlocks = currTarget.blocks._blocks;
        //     for (const blockId in currBlocks) {
        //         if (currBlocks[blockId].fields.BROADCAST_OPTION) {
        //             const id = currBlocks[blockId].fields.BROADCAST_OPTION.id;
        //             const index = messageIds.indexOf(id);
        //             if (index !== -1) {
        //                 messageIds = messageIds.slice(0, index)
        //                     .concat(messageIds.slice(index + 1));
        //             }
        //         }
        //     }
        // }
        // Anything left in messageIds is not referenced by a block, so delete it.
        for (let i = 0; i < messageIds.length; i++) {
            const id = messageIds[i];
            delete this.runtime.getTargetForStage().variables[id];
        }
        const globalVarMap = { ...this.runtime.getTargetForStage().variables };
        const localVarMap = this.editingTarget.isStage ? Object.create(null) : { ...this.editingTarget.variables };

        const globalVariables = Object.keys(globalVarMap).map((k) => globalVarMap[k]);
        const localVariables = Object.keys(localVarMap).map((k) => localVarMap[k]);
        const workspaceComments = Object.keys(this.editingTarget.comments)
            .map((k) => this.editingTarget.comments[k])
            .filter((c) => c.blockId === null);

        const xmlString = `<xml xmlns="http://www.w3.org/1999/xhtml">
                            <variables>
                                ${globalVariables.map((v) => v.toXML()).join()}
                                ${localVariables.map((v) => v.toXML(true)).join()}
                            </variables>
                            ${workspaceComments.map((c) => c.toXML()).join()}
                            ${this.editingTarget.blocks.toXML(this.editingTarget.comments)}
                        </xml>`;

        this.emit("workspaceUpdate", { xml: xmlString });
    }

    /**
     * Install `deserialize` results: zero or more targets after the extensions (if any) used by those targets.
     * @param {Array.<Target>} targets - the targets to be installed
     * @param {ImportedExtensionsInfo} extensions - metadata about extensions used by these targets
     * @param {boolean} wholeProject - set to true if installing a whole project, as opposed to a single sprite.
     * @returns {Promise} resolved once targets have been installed
     */
    installTargets(targets, extensions, wholeProject) {
        const extensionPromises = [];

        extensions.extensionIDs.forEach((extensionID) => {
            if (!this.extensionManager.isExtensionLoaded(extensionID)) {
                const extensionURL = extensions.extensionURLs.get(extensionID) || extensionID;
                extensionPromises.push(this.extensionManager.loadExtensionURL(extensionURL));
            }
        });

        // eslint-disable-next-line no-param-reassign
        targets = targets.filter((target) => !!target);

        return Promise.all(extensionPromises).then(() => {
            targets.forEach((target) => {
                this.runtime.addTarget(target);
                /** @type RenderedTarget */ target.updateAllDrawableProperties();
                // Ensure unique sprite name
                if (target.isSprite()) this.renameSprite(target.id, target.getName());
            });
            // Sort the executable targets by layerOrder.
            // Remove layerOrder property after use.
            this.runtime.executableTargets.sort((a, b) => a.layerOrder - b.layerOrder);
            targets.forEach((target) => {
                // eslint-disable-next-line no-param-reassign
                delete target.layerOrder;
            });

            // Select the first target for editing, e.g., the first sprite.
            if (wholeProject && targets.length > 1) {
                // eslint-disable-next-line prefer-destructuring
                this.editingTarget = targets[1];
            } else {
                // eslint-disable-next-line prefer-destructuring
                this.editingTarget = targets[0];
            }

            if (!wholeProject) {
                this.editingTarget.fixUpVariableReferences();
            }

            // Update the VM user's knowledge of targets and blocks on the workspace.
            this.emitTargetsUpdate(false /* Don't emit project change */);
            // this.emitWorkspaceUpdate();
            this.runtime.setEditingTarget(this.editingTarget);
            // this.runtime.ioDevices.cloud.setStage(this.runtime.getTargetForStage());
        });
    }

    /**
     * Add a sprite, this could be .sprite2 or .sprite3. Unpack and validate
     * such a file first.
     * @param {string | object} input A json string, object, or ArrayBuffer representing the project to load.
     * @return {!Promise} Promise that resolves after targets are installed.
     */
    addSprite(input) {
        const errorPrefix = "Sprite Upload Error:";
        if (typeof input === "object" && !(input instanceof ArrayBuffer) && !ArrayBuffer.isView(input)) {
            // If the input is an object and not any ArrayBuffer
            // or an ArrayBuffer view (this includes all typed arrays and DataViews)
            // turn the object into a JSON string, because we suspect
            // this is a project.json as an object
            // validate expects a string or buffer as input
            // TODO not sure if we need to check that it also isn't a data view
            // eslint-disable-next-line no-param-reassign
            input = JSON.stringify(input);
        }

        // eslint-disable-next-line no-async-promise-executor
        const validationPromise = new Promise(async (resolve, reject) => {
            // The second argument of true below indicates to the parser/validator
            // that the given input should be treated as a single sprite and not
            // an entire project
            // eslint-disable-next-line consistent-return
            validate(input, true, (error, res) => {
                if (error) return reject(error);
                resolve(res);
            });
        });

        return validationPromise
            .then((validatedInput) => {
                const { projectVersion } = validatedInput[0];
                if (projectVersion === 2) {
                    return this._addSprite2(validatedInput[0], validatedInput[1]);
                }
                if (projectVersion === 3) {
                    return this._addSprite3(validatedInput[0], validatedInput[1]);
                }
                // eslint-disable-next-line prefer-promise-reject-errors
                return Promise.reject(`${errorPrefix} Unable to verify sprite version.`);
            })
            .then(() => this.runtime.emitProjectChanged())
            .catch((error) => {
                // Intentionally rejecting here (want errors to be handled by caller)
                if (error.hasOwnProperty("validationError")) {
                    return Promise.reject(JSON.stringify(error));
                }
                // eslint-disable-next-line prefer-promise-reject-errors
                return Promise.reject(`${errorPrefix} ${error}`);
            });
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
    addBackdrop(md5ext, backdropObject) {
        return loadCostume(md5ext, backdropObject, this.runtime).then(() => {
            const stage = this.runtime.getTargetForStage();
            stage.addCostume(backdropObject);
            stage.setCostume(stage.getCostumes().length - 1);
            this.runtime.emitProjectChanged();
        });
    }

    /**
     * Add a single sprite from the "Sprite2" (i.e., SB2 sprite) format.
     * @param {object} sprite Object representing 2.0 sprite to be added.
     * @param {?ArrayBuffer} zip Optional zip of assets being referenced by json
     * @returns {Promise} Promise that resolves after the sprite is added
     */
    _addSprite2(sprite, zip) {
        // Validate & parse

        return sb2.deserialize(sprite, this.runtime, true, zip).then(({ targets, extensions }) => this.installTargets(targets, extensions, false));
    }

    /**
     * Add a single sb3 sprite.
     * @param {object} sprite Object rperesenting 3.0 sprite to be added.
     * @param {?ArrayBuffer} zip Optional zip of assets being referenced by target json
     * @returns {Promise} Promise that resolves after the sprite is added
     */
    _addSprite3(sprite, zip) {
        // Validate & parse
        return sb3.deserialize(sprite, this.runtime, zip, true).then(({ targets, extensions }) => this.installTargets(targets, extensions, false));
    }

    /**
     * Rename a sprite.
     * @param {string} targetId ID of a target whose sprite to rename.
     * @param {string} newName New name of the sprite.
     */
    renameSprite(targetId, newName) {
        const target = this.runtime.getTargetById(targetId);
        if (target) {
            if (!target.isSprite()) {
                throw new Error("Cannot rename non-sprite targets.");
            }
            const { sprite } = target;
            if (!sprite) {
                throw new Error("No sprite associated with this target.");
            }
            if (newName && RESERVED_NAMES.indexOf(newName) === -1) {
                const names = this.runtime.targets.filter((runtimeTarget) => runtimeTarget.isSprite() && runtimeTarget.id !== target.id).map((runtimeTarget) => runtimeTarget.sprite.name);
                const oldName = sprite.name;
                const newUnusedName = StringUtil.unusedName(newName, names);
                sprite.name = newUnusedName;
                const allTargets = this.runtime.targets;
                for (let i = 0; i < allTargets.length; i++) {
                    const currTarget = allTargets[i];
                    currTarget.blocks?.updateAssetName(oldName, newName, "sprite");
                }

                if (newUnusedName !== oldName) this.emitTargetsUpdate();
            }
        } else {
            throw new Error("No target with the provided id.");
        }
    }

    /**
     * Delete a sprite and all its clones.
     * @param {string} targetId ID of a target whose sprite to delete.
     * @return {Function} Returns a function to restore the sprite that was deleted
     */
    deleteSprite(targetId) {
        const target = this.runtime.getTargetById(targetId);
        if (target) {
            const targetIndexBeforeDelete = this.runtime.targets.map((t) => t.id).indexOf(target.id);
            if (!target.isSprite()) {
                throw new Error("Cannot delete non-sprite targets.");
            }
            const { sprite } = target;
            if (!sprite) {
                throw new Error("No sprite associated with this target.");
            }
            // Remove monitors from the runtime state and remove the
            // target-specific monitored blocks (e.g. local variables)
            const currentEditingTarget = this.editingTarget;
            this.runtime.disposeTarget(target);
            if (sprite === currentEditingTarget) {
                const nextTargetIndex = Math.min(this.runtime.targets.length - 1, targetIndexBeforeDelete);
                if (this.runtime.targets.length > 0) {
                    this.setEditingTarget(this.runtime.targets[nextTargetIndex].id);
                } else {
                    this.editingTarget = null;
                }
            }
            /* for (let i = 0; i < sprite.clones.length; i++) {
                const clone = sprite.clones[i];
                // Ensure editing target is switched if we are deleting it.
                this.runtime.disposeTarget(sprite.clones[i]);
                if (clone === currentEditingTarget) {
                    const nextTargetIndex = Math.min(this.runtime.targets.length - 1, targetIndexBeforeDelete);
                    if (this.runtime.targets.length > 0){
                        this.setEditingTarget(this.runtime.targets[nextTargetIndex].id);
                    } else {
                        this.editingTarget = null;
                    }
                } */
        }
        // Sprite object should be deleted by GC.
        target.updateAllDrawableProperties();
        this.emitTargetsUpdate();
    }

    /**
     * Set an editing target. An editor UI can use this function to switch
     * between editing different targets, sprites, etc.
     * After switching the editing target, the VM may emit updates
     * to the list of targets and any attached workspace blocks
     * (see `emitTargetsUpdate` and `emitWorkspaceUpdate`).
     * @param {string} targetId Id of target to set as editing.
     */
    setEditingTarget(targetId) {
        // Has the target id changed? If not, exit.
        if (this.editingTarget && targetId === this.editingTarget.id) {
            return;
        }
        const target = this.runtime.getTargetById(targetId);
        if (target) {
            this.editingTarget = target;
            // Emit appropriate UI updates.
            this.emitTargetsUpdate(false /* Don't emit project change */);
            // this.emitWorkspaceUpdate();
            this.runtime.setEditingTarget(target);
        }
    }

    /**
     * Duplicate a sprite.
     * @param {string} targetId ID of a target whose sprite to duplicate.
     * @returns {Promise} Promise that resolves when duplicated target has
     *     been added to the runtime.
     */
    duplicateSprite(targetId) {
        const target = this.runtime.getTargetById(targetId);
        if (!target) {
            throw new Error("No target with the provided id.");
        } else if (!target.isSprite()) {
            throw new Error("Cannot duplicate non-sprite targets.");
        } else if (!target.sprite) {
            throw new Error("No sprite associated with this target.");
        }
        return target.duplicate().then((newTarget) => {
            this.runtime.addTarget(newTarget);
            newTarget.goBehindOther(target);
            this.setEditingTarget(newTarget.id);
        });
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
     * @param {string} optVersion - if this is 2, load costume as sb2, otherwise load costume as sb3.
     * @returns {?Promise} - a promise that resolves when the costume has been added
     */
    addCostume(md5ext, costumeObject, optTargetId, optVersion) {
        const target = optTargetId ? this.runtime.getTargetById(optTargetId) : this.editingTarget;
        if (target) {
            // eslint-disable-next-line no-undef
            return loadCostume(md5ext, costumeObject, this.runtime, optVersion).then(() => {
                target.addCostume(costumeObject);
                target.setCostume(target.getCostumes().length - 1);
                this.runtime.emitProjectChanged();
            });
        }
        // If the target cannot be found by id, return a rejected promise
        return Promise.reject();
    }

    /**
     * Add a sound to the current editing target.
     * @param {!object} soundObject Object representing the costume.
     * @param {string} optTargetId - the id of the target to add to, if not the editing target.
     * @returns {?Promise} - a promise that resolves when the sound has been decoded and added
     */
    addSound(soundObject, optTargetId) {
        const target = optTargetId ? this.runtime.getTargetById(optTargetId) : this.editingTarget;
        if (target) {
            // eslint-disable-next-line no-undef
            return loadSound(soundObject, this.runtime, target.sprite.soundBank).then(() => {
                target.addSound(soundObject);
                this.emitTargetsUpdate();
            });
        }
        // If the target cannot be found by id, return a rejected promise
        return Promise.reject();
    }

    getEventLabels() {
        const hats = this.runtime._hats;
        const eventLabels = {};
        Object.keys(hats).forEach((hatId) => {
            eventLabels[hatId] = hats[hatId].label;
        });
        return eventLabels;
    }

    getBackdropNames() {
        const target = this.runtime.targets[0];
        const costumes = target.getCostumes();
        const names = [];
        for (let i = 0; i < costumes.length; i++) {
            names.push(costumes[i].name);
        }
        return names;
    }

    getSpriteNames() {
        const targetNames = this.runtime.targets.map((target) => target.sprite.name);
        return targetNames;
    }

    getKeyboardOptions() {
        const characterKeys = Array.from(Array(26), (e, i) => String.fromCharCode(65 + i));
        const scratchKeys = Object.keys(KEY_NAME).map((keyId) => KEY_NAME[keyId].toUpperCase());

        return characterKeys.concat(scratchKeys);
    }

    // There is 100% a better way to implement this
    getEventOptionsMap(eventId) {
        return {
            event_whenflagclicked: null,
            event_whenkeypressed: this.getKeyboardOptions(),
            event_whenthisspriteclicked: null,
            event_whentouchingobject: this.getSpriteNames(),
            event_whenstageclicked: null,
            event_whenbackdropswitchesto: this.getBackdropNames(),
            event_whengreaterthan: null,
            event_whenbroadcastreceived: "Free Input",
        }[eventId];
    }

    /**
     * Serializes the current state of the VM into a project.json file which is then
     * then compressed into a zip file and returned as a Blob object
     *
     * @returns {Blob} A Blob object representing the zip file
     */
    async serializeProject() {
        // const vm = JSON.stringify(sb3.serialize(this.runtime));
        const vm = sb3.serialize(this.runtime);

        const projectJSON = {};
        projectJSON.vmstate = vm;
        projectJSON.globalVariables = this.getGlobalVariables();

        return projectJSON;
    }
    
    async zipProject() {
        const projectJson = await this.serializeProject();
        const projectJsonString = JSON.stringify(projectJson);
        const zip = new JSZip();

        /** Example for adding in an asset:
         * zip.file("{scratch provided asset filename}", {the data});
         */

        // This may be needed once custom sprites are added.
        /* this.runtime.targets.forEach((target) => {
                    if (target instanceof RenderedTarget) {
                        target.getCostumes().forEach((costume) => {
                            console.log(costume);
                            if (!zip.files[costume.md5]) {
                                zip.file(costume.md5, new Blob([costume.asset.data]));
                            }
                        });
                    }
                }); */

        zip.file("project.json", new Blob([projectJsonString], { type: "text/plain" }));
        const zippedProject = await zip.generateAsync({ type: "blob" }).then((content) => content);
        return zippedProject;
    }

    /**
     * Downloads a zip file containing all project data with the following
     * naming template "[project name].ptch1"
     *
     * @returns {Blob} A Blob object representing the zip file
     */
    async downloadProject() {
        const zippedProject = await this.zipProject();

        // https://stackoverflow.com/questions/19327749/javascript-blob-filename-without-link
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        const url = window.URL.createObjectURL(zippedProject);
        a.href = url;
        a.download = "project.ptch1";
        a.click();
        window.URL.revokeObjectURL(url);
    }

    /**
     * Converts a .sb3 scratch project to a .ptch1 patch project
     *
     * @param {ArrayBuffer} scratchData - An ArrayBuffer object generated from
     * a valid Scratch (.sb3) project file
     * @returns {ArrayBuffer} An ArrayBuffer object representing a Patch (.ptch1) project file
     */
    async scratchToPatch(scratchData) {
        const converter = new ScratchConverter(scratchData);
        return converter.getPatchArrayBuffer().then((buf) => buf);
    }

    /**
     * Restores the state of the VM from a ArrayBuffer object that has been generated from a
     * valid Patch Project .ptch1 file.
     *
     * @param {ArrayBuffer | JSON} projectData - A ArrayBuffer object generated from
     * a valid Patch Project .ptch1 file
     */
    async loadProject(projectData) {
        const isJsonObject = (param) => typeof param === "object" && param !== null && !Array.isArray(param) && JSON.stringify(param)

        let zip;
        let jsonData = projectData;

        // Check if project data is a json object
        if (!isJsonObject(projectData)) {
            zip = await JSZip.loadAsync(projectData).then((newZip) => newZip);

            // https://stackoverflow.com/questions/40223259/jszip-get-content-of-file-in-zip-from-file-input
            const jsonDataString = await zip.files["project.json"].async("text").then((text) => text);
            if (!jsonDataString || isUndefined(jsonDataString)) {
                console.warn("No project.json file. Is your project corrupted?");
                return null;
            }
            jsonData = JSON.parse(jsonDataString);
        }

        this.clear();
        const importedProject = await sb3.deserialize(jsonData.vmstate, this.runtime, zip, false).then((proj) => proj);

        if (importedProject.extensionsInfo) {
            await this.installTargets(importedProject.targets, importedProject.extensionsInfo, true);
        } else {
            await this.installTargets(importedProject.targets, { extensionIDs: [] }, true);
        }

        jsonData.globalVariables.forEach((variable) => {
            this.updateGlobalVariable(variable.name, variable.value);
        });

        const returnVal = {};
        returnVal.runtime = this.runtime;
        returnVal.importedProject = importedProject;
        returnVal.json = jsonData;

        return returnVal;
    }

    /**
     * Post I/O data to the virtual devices.
     * @param {?string} device Name of virtual I/O device.
     * @param {object} data Any data object to post to the I/O device.
     */
    postIOData(device, data) {
        if (this.runtime.ioDevices[device]) {
            this.runtime.ioDevices[device].postData(data);
        }
    }

    /**
     * Start all relevant hats.
     * @param {Array.<string>} requestedHatOpcode Opcode of hats to start.
     * @param {object=} optMatchFields Optionally, fields to match on the hat.
     * @param {Target=} optTarget Optionally, a target to restrict to.
     * @return {Array.<Thread>} List of threads started by this function.
     */
    async startHats(hat, option) {
        const startedHat = await this.runtime.startHats(hat, option);
        return startedHat;
    }

    async addThread(targetId, script, triggerEventId, option, displayName = "") {
        const newThreadId = await this.runtime.addThread(targetId, script, triggerEventId, option, displayName);
        return newThreadId;
    }

    deleteThread(threadId) {
        this.runtime.deleteThread(threadId);
    }

    getThreadById(threadId) {
        return this.runtime.getThreadById(threadId);
    }

    getThreadsForTarget(targetId) {
        return this.runtime.getThreadsForTarget(targetId);
    }

    updateThreadScript(threadId, script) {
        this.runtime.updateThreadScript(threadId, script);
    }

    updateThreadTriggerEvent(threadId, eventTrigger) {
        this.runtime.updateThreadTriggerEvent(threadId, eventTrigger);
    }

    updateThreadTriggerEventOption(threadId, eventTriggerOption) {
        this.runtime.updateThreadTriggerEventOption(threadId, eventTriggerOption);
    }

    updateGlobalVariable(name, value) {
        this.runtime.updateGlobalVariable(name, value);
    }

    removeGlobalVariable(name) {
        this.runtime.removeGlobalVariable(name);
    }

    getGlobalVariables() {
        return this.runtime.getGlobalVariables();
    }

    loadCostumeWrap(md5ext, costume, runtime, optVersion) {
        return loadCostume(md5ext, costume, runtime, optVersion);
    }

    isLoaded() {
        return this.runtime.workerLoaded;
    }

    getAllRenderedTargets() {
        return this.runtime.targets;
    }

    getApiInfo() {
        return PrimProxy.patchApi;
    }

    getDynamicFunctionInfo(functionName) {
        return PrimProxy.getDynamicFunctionInfo(functionName, this);
    }

    getRuntimeErrors() {
        return this.runtime.runtimeErrors;
    }

    getCompileTimeErrors() {
        return this.runtime.compileTimeErrors;
    }

    /**
     * Get all messagesIds that are currently being listened for by threads
     */
    getAllBroadcastMessages() {
        const messages = [];
        this.getAllRenderedTargets().forEach((target) => {
            const { threads } = target;
            Object.keys(threads).forEach((threadId) => {
                const thread = threads[threadId];
                if (thread.triggerEvent === "event_whenbroadcastreceived") {
                    messages.push(thread.triggerEventOption);
                }
            });
        });
        return messages;
    }
}
