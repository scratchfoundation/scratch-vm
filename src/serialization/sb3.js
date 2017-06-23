/**
 * @fileoverview
 * Partial implementation of a SB3 serializer and deserializer. Parses provided
 * JSON and then generates all needed scratch-vm runtime structures.
 */

const vmPackage = require('../../package.json');
const Blocks = require('../engine/blocks');
const Sprite = require('../sprites/sprite');
const Variable = require('../engine/variable');
const List = require('../engine/list');

const loadCostume = require('../import/load-costume.js');
const loadSound = require('../import/load-sound.js');

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
 * @return {?Target} Target created (stage or sprite).
 */
const parseScratchObject = function (object, runtime) {
    if (!object.hasOwnProperty('name')) {
        // Watcher/monitor - skip this object until those are implemented in VM.
        // @todo
        return;
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
        for (let blockId in object.blocks) {
            blocks.createBlock(object.blocks[blockId]);
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
        for (let j = 0; j < object.variables.length; j++) {
            const variable = object.variables[j];
            const newVariable = new Variable(
                variable.id,
                variable.name,
                variable.value,
                variable.isPersistent
            );
            target.variables[newVariable.id] = newVariable;
        }
    }
    if (object.hasOwnProperty('lists')) {
        for (let k = 0; k < object.lists.length; k++) {
            const list = object.lists[k];
            // @todo: monitor properties.
            target.lists[list.listName] = new List(
                list.listName,
                list.contents
            );
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
 * Deserializes the specified representation of a VM runtime and loads it into
 * the provided runtime instance.
 * @param  {object}  json    JSON representation of a VM runtime.
 * @param  {Runtime} runtime Runtime instance
 * @returns {Promise} Promise that resolves to the list of targets after the project is deserialized
 */
const deserialize = function (json, runtime) {
    return Promise.all((json.targets || []).map(target => parseScratchObject(target, runtime)));
};

module.exports = {
    serialize: serialize,
    deserialize: deserialize
};
