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

/**
 * Serializes the specified VM runtime.
 * @param  {!Runtime} runtime VM runtime instance to be serialized.
 * @return {string}    Serialized runtime instance.
 */
const serialize = function (runtime) {
    // Fetch targets
    const obj = Object.create(null);
    obj.targets = runtime.targets;

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
    if (object.hasOwnProperty('costumes') || object.hasOwnProperty('costume')) {
        for (let i = 0; i < object.costumeCount; i++) {
            const costume = object.costumes[i];
            // @todo: Make sure all the relevant metadata is being pulled out.
            sprite.costumes.push({
                skin: costume.skin,
                name: costume.name,
                bitmapResolution: costume.bitmapResolution,
                rotationCenterX: costume.rotationCenterX,
                rotationCenterY: costume.rotationCenterY
            });
        }
    }
    // Sounds from JSON
    if (object.hasOwnProperty('sounds')) {
        for (let s = 0; s < object.sounds.length; s++) {
            const sound = object.sounds[s];
            sprite.sounds.push({
                format: sound.format,
                fileUrl: sound.fileUrl,
                rate: sound.rate,
                sampleCount: sound.sampleCount,
                soundID: sound.soundID,
                name: sound.name,
                md5: sound.md5
            });
        }
    }
    // Create the first clone, and load its run-state from JSON.
    const target = sprite.createClone();
    // Add it to the runtime's list of targets.
    runtime.targets.push(target);
    // Load target properties from JSON.
    if (object.hasOwnProperty('variables')) {
        for (let j = 0; j < object.variables.length; j++) {
            const variable = object.variables[j];
            target.variables[variable.name] = new Variable(
                variable.name,
                variable.value,
                variable.isPersistent
            );
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
    target.updateAllDrawableProperties();

    // console.log('returning target:');
    // console.log(target);
    return target;
};

/**
 * Deserializes the specified representation of a VM runtime and loads it into
 * the provided runtime instance.
 * @param  {string}  json    Stringified JSON representation of a VM runtime.
 * @param  {Runtime} runtime Runtime instance
 */
const deserialize = function (json, runtime) {
    for (let i = 0; i < json.targets.length; i++) {
        parseScratchObject(json.targets[i], runtime);
    }
};

module.exports = {
    serialize: serialize,
    deserialize: deserialize
};
