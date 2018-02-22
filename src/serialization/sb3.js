/**
 * @fileoverview
 * Partial implementation of a SB3 serializer and deserializer. Parses provided
 * JSON and then generates all needed scratch-vm runtime structures.
 */

const vmPackage = require('../../package.json');
const Blocks = require('../engine/blocks');
const Sprite = require('../sprites/sprite');
const Variable = require('../engine/variable');

const {loadCostume} = require('../import/load-costume.js');
const {loadSound} = require('../import/load-sound.js');

/**
 * @typedef {object} ImportedProject
 * @property {Array.<Target>} targets - the imported Scratch 3.0 target objects.
 * @property {ImportedExtensionsInfo} extensionsInfo - the ID of each extension actually used by this project.
 */

/**
 * @typedef {object} ImportedExtensionsInfo
 * @property {Set.<string>} extensionIDs - the ID of each extension actually in use by blocks in this project.
 * @property {Map.<string, string>} extensionURLs - map of ID => URL from project metadata. May not match extensionIDs.
 */

/**
 * Serializes the specified VM runtime.
 * @param  {!Runtime} runtime VM runtime instance to be serialized.
 * @return {object}    Serialized runtime instance.
 */
const serialize = function (runtime) {
    // Fetch targets
    const obj = Object.create(null);
    obj.targets = runtime.targets.filter(target => target.isOriginal);

    // Assemble metadata
    const meta = Object.create(null);
    meta.semver = '3.0.0';
    meta.vm = vmPackage.version;

    // Attach full user agent string to metadata if available
    meta.agent = null;
    if (typeof navigator !== 'undefined') meta.agent = navigator.userAgent;

    // Assemble payload and return
    obj.meta = meta;
    return obj;
};

/**
 * Parse a single "Scratch object" and create all its in-memory VM objects.
 * @param {!object} object From-JSON "Scratch object:" sprite, stage, watcher.
 * @param {!Runtime} runtime Runtime object to load all structures into.
 * @param {ImportedExtensionsInfo} extensions - (in/out) parsed extension information will be stored here.
 * @return {!Promise.<Target>} Promise for the target created (stage or sprite), or null for unsupported objects.
 */
const parseScratchObject = function (object, runtime, extensions) {
    if (!object.hasOwnProperty('name')) {
        // Watcher/monitor - skip this object until those are implemented in VM.
        // @todo
        return Promise.resolve(null);
    }
    // Blocks container for this object.
    const blocks = new Blocks();

    // @todo: For now, load all Scratch objects (stage/sprites) as a Sprite.
    const sprite = new Sprite(blocks, runtime);

    // Sprite/stage name from JSON.
    if (object.hasOwnProperty('name')) {
        sprite.name = object.name;
    }
    if (object.hasOwnProperty('blocks')) {
        for (const blockId in object.blocks) {
            const blockJSON = object.blocks[blockId];
            blocks.createBlock(blockJSON);

            const dotIndex = blockJSON.opcode.indexOf('.');
            if (dotIndex >= 0) {
                const extensionId = blockJSON.opcode.substring(0, dotIndex);
                extensions.extensionIDs.add(extensionId);
            }
        }
        // console.log(blocks);
    }
    // Costumes from JSON.
    const costumePromises = (object.costumes || []).map(costumeSource => {
        // @todo: Make sure all the relevant metadata is being pulled out.
        const costume = {
            skinId: null,
            name: costumeSource.name,
            bitmapResolution: costumeSource.bitmapResolution,
            rotationCenterX: costumeSource.rotationCenterX,
            rotationCenterY: costumeSource.rotationCenterY
        };
        const dataFormat =
            costumeSource.dataFormat ||
            (costumeSource.assetType && costumeSource.assetType.runtimeFormat) || // older format
            'png'; // if all else fails, guess that it might be a PNG
        const costumeMd5 = `${costumeSource.assetId}.${dataFormat}`;
        return loadCostume(costumeMd5, costume, runtime);
    });
    // Sounds from JSON
    const soundPromises = (object.sounds || []).map(soundSource => {
        const sound = {
            format: soundSource.format,
            fileUrl: soundSource.fileUrl,
            rate: soundSource.rate,
            sampleCount: soundSource.sampleCount,
            soundID: soundSource.soundID,
            name: soundSource.name,
            md5: soundSource.md5,
            data: null
        };
        return loadSound(sound, runtime);
    });
    // Create the first clone, and load its run-state from JSON.
    const target = sprite.createClone();
    // Load target properties from JSON.
    if (object.hasOwnProperty('variables')) {
        for (const j in object.variables) {
            const variable = object.variables[j];
            const newVariable = new Variable(
                variable.id,
                variable.name,
                variable.type,
                variable.isPersistent
            );
            newVariable.value = variable.value;
            target.variables[newVariable.id] = newVariable;
        }
    }
    if (object.hasOwnProperty('x')) {
        target.x = object.x;
    }
    if (object.hasOwnProperty('y')) {
        target.y = object.y;
    }
    if (object.hasOwnProperty('direction')) {
        target.direction = object.direction;
    }
    if (object.hasOwnProperty('size')) {
        target.size = object.size;
    }
    if (object.hasOwnProperty('visible')) {
        target.visible = object.visible;
    }
    if (object.hasOwnProperty('currentCostume')) {
        target.currentCostume = object.currentCostume;
    }
    if (object.hasOwnProperty('rotationStyle')) {
        target.rotationStyle = object.rotationStyle;
    }
    if (object.hasOwnProperty('isStage')) {
        target.isStage = object.isStage;
    }
    Promise.all(costumePromises).then(costumes => {
        sprite.costumes = costumes;
    });
    Promise.all(soundPromises).then(sounds => {
        sprite.sounds = sounds;
    });
    return Promise.all(costumePromises.concat(soundPromises)).then(() => target);
};

/**
 * Deserialize the specified representation of a VM runtime and loads it into the provided runtime instance.
 * TODO: parse extension info (also, design extension info storage...)
 * @param  {object} json - JSON representation of a VM runtime.
 * @param  {Runtime} runtime - Runtime instance
 * @returns {Promise.<ImportedProject>} Promise that resolves to the list of targets after the project is deserialized
 */
const deserialize = function (json, runtime) {
    const extensions = {
        extensionIDs: new Set(),
        extensionURLs: new Map()
    };
    return Promise.all(
        (json.targets || []).map(target => parseScratchObject(target, runtime, extensions))
    ).then(targets => ({
        targets,
        extensions
    }));
};

module.exports = {
    serialize: serialize,
    deserialize: deserialize
};
