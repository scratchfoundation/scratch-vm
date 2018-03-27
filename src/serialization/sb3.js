/**
 * @fileoverview
 * Partial implementation of a SB3 serializer and deserializer. Parses provided
 * JSON and then generates all needed scratch-vm runtime structures.
 */

const vmPackage = require('../../package.json');
const Blocks = require('../engine/blocks');
const Sprite = require('../sprites/sprite');
const Variable = require('../engine/variable');
const log = require('../util/log');

const {loadCostume} = require('../import/load-costume.js');
const {loadSound} = require('../import/load-sound.js');
const {deserializeCostume, deserializeSound} = require('./deserialize-assets.js');

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

const INPUT_SAME_BLOCK_SHADOW = 1;
const INPUT_BLOCK_NO_SHADOW = 2;
const INPUT_DIFF_BLOCK_SHADOW = 3;
// haven't found a case where block = null, but shadow is present...

const serializeInputs = function (inputs) {
    const obj = Object.create(null);
    for (const inputName in inputs) {
        if (!inputs.hasOwnProperty(inputName)) continue;
        // if block and shadow refer to the same block, only serialize one
        if (inputs[inputName].block === inputs[inputName].shadow) {
            // has block and shadow, and they are the same
            obj[inputName] = [
                INPUT_SAME_BLOCK_SHADOW,
                inputs[inputName].block
            ];
        } else if (inputs[inputName].shadow === null) {
            // does not have shadow
            obj[inputName] = [
                INPUT_BLOCK_NO_SHADOW,
                inputs[inputName].block
            ];
        } else {
            // block and shadow are both present and are different
            obj[inputName] = [
                INPUT_DIFF_BLOCK_SHADOW,
                inputs[inputName].block,
                inputs[inputName].shadow
            ];
        }
    }
    return obj;
};

const serializeFields = function (fields) {
    const obj = Object.create(null);
    for (const fieldName in fields) {
        if (!fields.hasOwnProperty(fieldName)) continue;
        obj[fieldName] = [fields[fieldName].value];
        if (fields[fieldName].hasOwnProperty('id')) {
            obj[fieldName].push(fields[fieldName].id);
        }
    }
    return obj;
};

const serializeBlock = function (block) {
    const obj = Object.create(null);
    // obj.id = block.id; // don't need this, it's the index of this block in its containing object
    obj.opcode = block.opcode;
    if (block.next) obj.next = block.next; // don't serialize next if null
    // obj.next = if (block.next;
    obj.parent = block.parent;
    obj.inputs = serializeInputs(block.inputs);
    obj.fields = serializeFields(block.fields);
    obj.topLevel = block.topLevel ? block.topLevel : false;
    obj.shadow = block.shadow; // I think we don't need this either..
    if (block.topLevel) {
        if (block.x) {
            obj.x = Math.round(block.x);
        }
        if (block.y) {
            obj.y = Math.round(block.y);
        }
    }
    if (block.mutation) {
        obj.mutation = block.mutation;
    }
    return obj;
};

const serializeBlocks = function (blocks) {
    const obj = Object.create(null);
    for (const blockID in blocks) {
        if (!blocks.hasOwnProperty(blockID)) continue;
        obj[blockID] = serializeBlock(blocks[blockID]);
    }
    return obj;
};

const serializeCostume = function (costume) {
    const obj = Object.create(null);
    obj.assetId = costume.assetId;
    obj.name = costume.name;
    obj.bitmapResolution = costume.bitmapResolution;
    // serialize this property with the name 'md5ext' because that's
    // what it's actually referring to. TODO runtime objects need to be
    // updated to actually refer to this as 'md5ext' instead of 'md5'
    // but that change should be made carefully since it is very
    // pervasive
    obj.md5ext = costume.md5;
    obj.dataFormat = costume.dataFormat;
    obj.rotationCenterX = costume.rotationCenterX;
    obj.rotationCenterY = costume.rotationCenterY;
    return obj;
};

const serializeSound = function (sound) {
    const obj = Object.create(null);
    obj.assetId = sound.assetId;
    obj.name = sound.name;
    obj.dataFormat = sound.dataFormat;
    obj.format = sound.format;
    obj.rate = sound.rate;
    obj.sampleCount = sound.sampleCount;
    // serialize this property with the name 'md5ext' because that's
    // what it's actually referring to. TODO runtime objects need to be
    // updated to actually refer to this as 'md5ext' instead of 'md5'
    // but that change should be made carefully since it is very
    // pervasive
    obj.md5ext = sound.md5;
    return obj;
};

const serializeVariables = function (variables) {
    const obj = Object.create(null);
    // separate out variables into types at the top level so we don't have
    // keep track of a type for each
    obj.variables = Object.create(null);
    obj.lists = Object.create(null);
    obj.broadcasts = Object.create(null);
    for (const varId in variables) {
        const v = variables[varId];
        if (v.type === Variable.BROADCAST_MESSAGE_TYPE) {
            obj.broadcasts[varId] = [v.name, v.value];
            continue;
        }
        if (v.type === Variable.LIST_TYPE) {
            obj.lists[varId] = [v.name, v.value];
            continue;
        }

        // should be a scalar type
        obj.variables[varId] = [v.name]
        let val = v.value;
        if ((typeof val !== 'string') && (typeof val !== 'number')) {
            log.info(`Variable: ${v.name} had value ${val} of type: ${typeof val} converting to string`);
            val = JSON.stringify(val);
        }
        obj.variables[varId].push(val);
        // Some hacked blocks have booleans as variable values
        // (typeof v.value === 'string') || (typeof v.value === 'number') ?
        //    v.value : JSON.stringify(v.value)];
        if (v.isPersistent) obj.variables[varId].push(true);
    }
    return obj;
};

const serializeTarget = function (target) {
    const obj = Object.create(null);
    obj.isStage = target.isStage;
    obj.name = target.name;
    const vars = serializeVariables(target.variables);
    obj.variables = vars.variables;
    obj.lists = vars.lists;
    obj.broadcasts = vars.broadcasts;
    obj.blocks = serializeBlocks(target.blocks);
    obj.currentCostume = target.currentCostume;
    obj.costumes = target.costumes.map(serializeCostume);
    obj.sounds = target.sounds.map(serializeSound);
    if (!obj.isStage) {
        // Stage does not need the following properties
        obj.visible = target.visible;
        obj.x = target.x;
        obj.y = target.y;
        obj.size = target.size;
        obj.direction = target.direction;
        obj.draggable = target.draggable;
        obj.rotationStyle = target.rotationStyle;
    }
    return obj;
};

/**
 * Serializes the specified VM runtime.
 * @param  {!Runtime} runtime VM runtime instance to be serialized.
 * @return {object}    Serialized runtime instance.
 */
const serialize = function (runtime) {
    // Fetch targets
    const obj = Object.create(null);
    const flattenedOriginalTargets = JSON.parse(JSON.stringify(
        runtime.targets.filter(target => target.isOriginal)));
    obj.targets = flattenedOriginalTargets.map(t => serializeTarget(t, runtime));

    // TODO Serialize monitors

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

const deserializeInputs = function (inputs) {
    // Explicitly not using Object.create(null) here
    // because we call prototype functions later in the vm
    const obj = {};
    for (const inputName in inputs) {
        if (!inputs.hasOwnProperty(inputName)) continue;
        const inputDescArr = inputs[inputName];
        let block = null;
        let shadow = null;
        const blockShadowInfo = inputDescArr[0];
        if (blockShadowInfo === INPUT_SAME_BLOCK_SHADOW) {
            // block and shadow are the same id, and only one is provided
            block = shadow = inputDescArr[1];
        } else if (blockShadowInfo === INPUT_BLOCK_NO_SHADOW) {
            block = inputDescArr[1];
        } else { // assume INPUT_DIFF_BLOCK_SHADOW
            block = inputDescArr[1];
            shadow = inputDescArr[2];
        }
        obj[inputName] = {
            name: inputName,
            block: block,
            shadow: shadow
        };
    }
    return obj;
};

const deserializeFields = function (fields) {
    // Explicitly not using Object.create(null) here
    // because we call prototype functions later in the vm
    const obj = {};
    for (const fieldName in fields) {
        if (!fields.hasOwnProperty(fieldName)) continue;
        const fieldDescArr = fields[fieldName];
        obj[fieldName] = {
            name: fieldName,
            value: fieldDescArr[0]
        };
        if (fieldDescArr.length > 1) {
            obj[fieldName].id = fieldDescArr[1];
        }
        if (fieldName === 'BROADCAST_OPTION') {
            obj[fieldName].variableType = Variable.BROADCAST_MESSAGE_TYPE;
        } else if (fieldName === 'VARIABLE') {
            obj[fieldName].variableType = Variable.SCALAR_TYPE;
        } else if (fieldName === 'LIST') {
            obj[fieldName].variableType = Variable.LIST_TYPE;
        }
    }
    return obj;
};

/**
 * Parse a single "Scratch object" and create all its in-memory VM objects.
 * @param {!object} object From-JSON "Scratch object:" sprite, stage, watcher.
 * @param {!Runtime} runtime Runtime object to load all structures into.
 * @param {ImportedExtensionsInfo} extensions - (in/out) parsed extension information will be stored here.
 * @param {JSZip} zip Sb3 file describing this project (to load assets from)
 * @return {!Promise.<Target>} Promise for the target created (stage or sprite), or null for unsupported objects.
 */
const parseScratchObject = function (object, runtime, extensions, zip) {
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
            if (!object.blocks.hasOwnProperty(blockId)) continue;
            const blockJSON = object.blocks[blockId];
            blockJSON.id = blockId; // add id back to block since it wasn't serialized
            const serializedInputs = blockJSON.inputs;
            const deserializedInputs = deserializeInputs(serializedInputs);
            blockJSON.inputs = deserializedInputs;
            const serializedFields = blockJSON.fields;
            const deserializedFields = deserializeFields(serializedFields);
            blockJSON.fields = deserializedFields;
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
            assetId: costumeSource.assetId,
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
        const costumeMd5Ext = costumeSource.hasOwnProperty('md5ext') ?
            costumeSource.md5ext : `${costumeSource.assetId}.${dataFormat}`;
        costume.md5 = costumeMd5Ext;
        costume.dataFormat = dataFormat;
        // deserializeCostume should be called on the costume object we're
        // creating above instead of the source costume object, because this way
        // we're always loading the 'sb3' representation of the costume
        // any translation that needs to happen will happen in the process
        // of building up the costume object into an sb3 format
        return deserializeCostume(costume, runtime, zip)
            .then(() => loadCostume(costumeMd5Ext, costume, runtime));
        // Only attempt to load the costume after the deserialization
        // process has been completed
    });
    // Sounds from JSON
    const soundPromises = (object.sounds || []).map(soundSource => {
        const sound = {
            assetId: soundSource.assetId,
            format: soundSource.format,
            rate: soundSource.rate,
            sampleCount: soundSource.sampleCount,
            name: soundSource.name,
            // TODO we eventually want this property to be called md5ext,
            // but there are many things relying on this particular name at the
            // moment, so this translation is very important
            md5: soundSource.md5ext,
            dataFormat: soundSource.dataFormat,
            data: null
        };
        // deserializeSound should be called on the sound object we're
        // creating above instead of the source sound object, because this way
        // we're always loading the 'sb3' representation of the costume
        // any translation that needs to happen will happen in the process
        // of building up the costume object into an sb3 format
        return deserializeSound(sound, runtime, zip)
            .then(() => loadSound(sound, runtime));
        // Only attempt to load the sound after the deserialization
        // process has been completed.
    });
    // Create the first clone, and load its run-state from JSON.
    const target = sprite.createClone();
    // Load target properties from JSON.
    if (object.hasOwnProperty('variables')) {
        for (const varId in object.variables) {
            const variable = object.variables[varId];
            let newVariable;
            if (Array.isArray(variable)) {
                newVariable = new Variable(
                    varId, // var id is the index of the variable desc array in the variables obj
                    variable[0], // name of the variable
                    Variable.SCALAR_TYPE, // type of the variable
                    (variable.length === 3) ? variable[2] : false // isPersistent/isCloud
                );
                newVariable.value = variable[1];
            } else {
                newVariable = new Variable(
                    variable.id,
                    variable.name,
                    variable.type,
                    variable.isPersistent
                );
                newVariable.value = variable.value;
            }
            target.variables[newVariable.id] = newVariable;
        }
    }
    if (object.hasOwnProperty('lists')) {
        for (const listId in object.lists) {
            const list = object.lists[listId];
            const newList = new Variable(
                listId,
                list[0],
                Variable.LIST_TYPE,
                false
            );
            newList.value = list[1];
            target.variables[newList.id] = newList;
        }
    }
    if (object.hasOwnProperty('broadcasts')) {
        for (const broadcastId in object.broadcasts) {
            const broadcast = object.broadcasts[broadcastId];
            const newBroadcast = new Variable(
                broadcastId,
                broadcast[0],
                Variable.BROADCAST_MESSAGE_TYPE,
                false
            );
            newBroadcast.value = broadcast[1];
            target.variables[newBroadcast.id] = newBroadcast;
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
 * @param {JSZip} zip - Sb3 file describing this project (to load assets from)
 * @returns {Promise.<ImportedProject>} Promise that resolves to the list of targets after the project is deserialized
 */
const deserialize = function (json, runtime, zip) {
    const extensions = {
        extensionIDs: new Set(),
        extensionURLs: new Map()
    };
    return Promise.all(
        (json.targets || []).map(target => parseScratchObject(target, runtime, extensions, zip))
    ).then(targets => ({
        targets,
        extensions
    }));
};

module.exports = {
    serialize: serialize,
    deserialize: deserialize
};
