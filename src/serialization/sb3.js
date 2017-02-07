/**
 * @fileoverview
 * Partial implementation of a SB3 serializer and deserializer. Parses provided
 * JSON and then generates all needed scratch-vm runtime structures.
 */

var package = require('../../package.json');
var Blocks = require('../engine/blocks');
var RenderedTarget = require('../sprites/rendered-target');
var Sprite = require('../sprites/sprite');
var Variable = require('../engine/variable');
var List = require('../engine/list');

/**
 * Serializes the specified VM runtime.
 * @param  {!Runtime} runtime VM runtime instance to be serialized.
 * @return {string}    Serialized runtime instance.
 */
var serialize = function (runtime) {
    // Fetch targets
    var obj = Object.create(null);
    obj.targets = runtime.targets;

    // Assemble metadata
    var meta = Object.create(null);
    meta.semver = '3.0.0';
    meta.vm = package.version;

    // Attach full user agent string to metadata if available
    meta.agent = null;
    if (typeof navigator !== 'undefined') meta.agent = navigator.userAgent;

    // Assemble payload and return
    obj.meta = meta;
    return obj;
};

/**
 * Parse a single "Scratch object" and create all its in-memory VM objects.
 * @param {!Object} object From-JSON "Scratch object:" sprite, stage, watcher.
 * @param {!Runtime} runtime Runtime object to load all structures into.
 * @param {boolean} topLevel Whether this is the top-level object (stage).
 * @return {?Target} Target created (stage or sprite).
 */
var parseScratchObject = function (object, runtime, topLevel) {
    if (!object.hasOwnProperty('name')) {
        // Watcher/monitor - skip this object until those are implemented in VM.
        // @todo
        return;
    }
    // Blocks container for this object.
    var blocks = new Blocks();

    // @todo: For now, load all Scratch objects (stage/sprites) as a Sprite.
    var sprite = new Sprite(blocks, runtime);

    // Sprite/stage name from JSON.
    if (object.hasOwnProperty('name')) {
        sprite.name = object.name;
    }
    if (object.hasOwnProperty('blocks')) {
        for (blockId in object.blocks) {
            blocks.createBlock(object.blocks[blockId]);
        }
        console.log(blocks);
    }
    // Costumes from JSON.
    if (object.hasOwnProperty('costumes') || object.hasOwnProperty('costume')) {
        for (var i = 0; i < object.costumeCount; i++) {
            var costume = object.costumes[i];
            // @todo: Make sure all the relevant metadata is being pulled out.
            sprite.costumes.push({
                skin: costume.skin,
                name: costume.costumeName,
                bitmapResolution: costume.bitmapResolution,
                rotationCenterX: costume.rotationCenterX,
                rotationCenterY: costume.rotationCenterY
            });
        }
    }
    // Sounds from JSON
    if (object.hasOwnProperty('sounds')) {
        for (var s = 0; s < object.sounds.length; s++) {
            var sound = object.sounds[s];
            sprite.sounds.push({
                format: sound.format,
                fileUrl: sound.fileUrl,
                rate: sound.rate,
                sampleCount: sound.sampleCount,
                soundID: sound.soundID,
                name: sound.name
            });
        }
    }
    // Create the first clone, and load its run-state from JSON.
    var target = sprite.createClone();
    // Add it to the runtime's list of targets.
    runtime.targets.push(target);
    // Load target properties from JSON.
    if (object.hasOwnProperty('variables')) {
        for (var j = 0; j < object.variables.length; j++) {
            var variable = object.variables[j];
            target.variables[variable.name] = new Variable(
                variable.name,
                variable.value,
                variable.isPersistent
            );
        }
    }
    if (object.hasOwnProperty('lists')) {
        for (var k = 0; k < object.lists.length; k++) {
            var list = object.lists[k];
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
    target.isStage = topLevel;
    target.updateAllDrawableProperties();
    // The stage will have child objects; recursively process them.
    if (object.children) {
        for (var m = 0; m < object.children.length; m++) {
            parseScratchObject(object.children[m], runtime, false);
        }
    }
    console.log("returning target:");
    console.log(target);
    return target;
};

/**
 * Top-level handler. Parse provided JSON,
 * and process the top-level object (the stage object).
 * @param {!string} json SB2-format JSON to load.
 * @param {!Runtime} runtime Runtime object to load all structures into.
 * @param {Boolean=} optForceSprite If set, treat as sprite (Sprite2).
 * @return {?Target} Top-level target created (stage or sprite).
 */
var sb3import = function (json, runtime, optForceSprite) {
    return parseScratchObject(
        json,
        runtime,
        !optForceSprite
    );
};

/**
 * Deserializes the specified representation of a VM runtime and loads it into
 * the provided runtime instance.
 * @param  {string}  json    Stringified JSON representation of a VM runtime.
 * @param  {Runtime} runtime Runtime instance
 */
var deserialize = function (json, runtime) {
    for (var i = 0; i < json.targets.length; i++) {
        parseScratchObject(json.targets[i], runtime);
    }
};

module.exports = {
    serialize: serialize,
    deserialize: deserialize
};
