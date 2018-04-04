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
const uid = require('../util/uid');
// const Cast = require('../util/Cast');

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

const INPUT_SAME_BLOCK_SHADOW = 1; // unobscured shadow
const INPUT_BLOCK_NO_SHADOW = 2; // no shadow
const INPUT_DIFF_BLOCK_SHADOW = 3; // obscured shadow
// haven't found a case where block = null, but shadow is present...

// Constants referring to 'primitive' blocks that are usually shadows,
// or in the case of variables and lists, appear quite often in projects
// math_number
const MATH_NUM_PRIMITIVE = 4; // there's no reason these constants can't collide
// math_positive_number
const POSITIVE_NUM_PRIMITIVE = 5; // with the above, but removing duplication for clarity
// math_whole_number
const WHOLE_NUM_PRIMITIVE = 6;
// math_integer
const INTEGER_NUM_PRIMITIVE = 7;
// math_angle
const ANGLE_NUM_PRIMITIVE = 8;
// colour_picker
const COLOR_PICKER_PRIMITIVE = 9;
// text
const TEXT_PRIMITIVE = 10;
// event_broadcast_menu
const BROADCAST_PRIMITIVE = 11;
// data_variable
const VAR_PRIMITIVE = 12;
// data_listcontents
const LIST_PRIMITIVE = 13;

const primitiveOpcodeInfoMap = {
    math_number: [MATH_NUM_PRIMITIVE, 'NUM'],
    math_positive_number: [POSITIVE_NUM_PRIMITIVE, 'NUM'],
    math_whole_number: [WHOLE_NUM_PRIMITIVE, 'NUM'],
    math_integer: [INTEGER_NUM_PRIMITIVE, 'NUM'],
    math_angle: [ANGLE_NUM_PRIMITIVE, 'NUM'],
    colour_picker: [COLOR_PICKER_PRIMITIVE, 'COLOUR'],
    text: [TEXT_PRIMITIVE, 'TEXT'],
    event_broadcast_menu: [BROADCAST_PRIMITIVE, 'BROADCAST_OPTION'],
    data_variable: [VAR_PRIMITIVE, 'VARIABLE'],
    data_listcontents: [LIST_PRIMITIVE, 'LIST']
};

const serializePrimitiveBlock = function (block) {
    // Returns an array represeting a primitive block or null if not one of
    // the primitive types above
    if (primitiveOpcodeInfoMap.hasOwnProperty(block.opcode)) {
        const primitiveInfo = primitiveOpcodeInfoMap[block.opcode];
        const primitiveConstant = primitiveInfo[0];
        const fieldName = primitiveInfo[1];
        const field = block.fields[fieldName];
        const primitiveDesc = [primitiveConstant, field.value];
        if (block.opcode === 'event_broadcast_menu') {
            primitiveDesc.push(field.id);
        } else if (block.opcode === 'data_variable' || block.opcode === 'data_listcontents') {
            primitiveDesc.push(field.id);
            if (block.topLevel) {
                primitiveDesc.push(block.x ? Math.round(block.x) : 0);
                primitiveDesc.push(block.y ? Math.round(block.y) : 0);
            }
        }
        return primitiveDesc;
    }
    return null;
    // if (block.opcode === 'math_number') {
    //     const numField = block.fields.NUM;
    //     // const numValue = (typeof numField.value === 'number') ?
    //     //     numField.value : Cast.toNumber(numField.value);
    //     return [MATH_NUM_PRIMITIVE, numField.value];
    // }
    // if (block.opcode === 'math_positive_number') {
    //     const positiveNumField = block.fields.NUM;
    //     // TODO should I actually be providing more validation here and ensure that the number is positive?
    //     // const numValue = (typeof positiveNumField.value === 'number') ?
    //     //     positiveNumField.value : Cast.toNumber(positiveNumField.value);
    //     return [POSITIVE_NUM_PRIMITIVE, positiveNumField.Value];
    // }
    // if (block.opcode === 'math_whole_number') {
    //     const wholeNumField = block.fields.NUM;
    //     const numValue = (typeof wholeNumField.value === 'number') ?
    //         wholeNumField.value : JSON.parse(wholeNumField.value);
    //     return [WHOLE_NUM_PRIMITIVE, numValue];
    // }
    // if (block.opcode === 'math_integer') {
    //     const integerNumField = block.fields.NUM;
    //     const numValue = (typeof integerNumField.value === 'number') ?
    //         integerNumField.value : JSON.parse(integerNumField.value);
    //     return [INTEGER_NUM_PRIMITIVE, numValue];
    // }
    // if (block.opcode === 'math_angle') {
    //     const angleNumField = block.fields.NUM;
    //     const numValue = (typeof angleNumField.value === 'number') ?
    //         angleNumField.value : JSON.parse(angleNumField.value);
    //     return [ANGLE_NUM_PRIMITIVE, numValue];
    // }
    // if (block.opcode === 'colour_picker') {
    //     const colorField = block.fields.COLOUR; // field uses this spelling
    //     return [COLOR_PICKER_PRIMITIVE, colorField.value];
    // }
    // if (block.opcode === 'text') {
    //     const textField = block.fields.TEXT;
    //     return [TEXT_PRIMITIVE, textField.value];
    // }
    // if (block.opcode === 'event_broadcast_menu') {
    //     const broadcastField = block.fields.BROADCAST_OPTION;
    //     return [BROADCAST_PRIMITIVE, broadcastField.value, broadcastField.id];
    // }
    // if (block.opcode === 'data_variable') {
    //     const variableField = block.fields.VARIABLE;
    //     const varArray = [VAR_PRIMITIVE, variableField.value, variableField.id];
    //     if (block.topLevel) {
    //         varArray.push(block.x ? Math.round(block.x) : 0);
    //         varArray.push(block.y ? Math.round(block.y) : 0);
    //
    //     }
    //     return varArray;
    // }
    // if (block.opcode === 'data_listcontents') {
    //     const listField = block.fields.LIST;
    //     const listArray = [LIST_PRIMITIVE, listField.value, listField.id];
    //     if (block.topLevel) {
    //         listArray.push(block.x ? Math.round(block.x) : 0);
    //         listArray.push(block.y ? Math.round(block.y) : 0);
    //
    //     }
    //     return listArray;
    // }
    // // If none of the above, return null
    // return null;
};

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
    const serializedPrimitive = serializePrimitiveBlock(block);
    if (serializedPrimitive) return serializedPrimitive;
    // If serializedPrimitive is null, proceed with serializing a non-primitive block
    const obj = Object.create(null);
    obj.opcode = block.opcode;
    // NOTE: this is extremely important to serialize even if null;
    // not serializing `next: null` results in strange behavior
    obj.next = block.next;
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

// caution this function modifies its inputs directly...........
const compressInputTree = function (block, blocks) {
    // const newInputs = Object.create(null);
    // second pass on the block
    // so the inputs field should be an object of key - array pairs
    const serializedInputs = block.inputs;
    for (const inputName in serializedInputs) {
        // don't need to check for hasOwnProperty because of how we constructed
        // inputs
        const currInput = serializedInputs[inputName];
        // traverse currInput skipping the first element, which describes whether the block
        // and shadow are the same
        for (let i = 1; i < currInput.length; i++) {
            if (!currInput[i]) continue; // need this check b/c block/shadow can be null
            const blockOrShadowID = currInput[i];
            // newInputs[inputName][i] = blocks[blockOrShadowID];
            // replace element of currInput directly
            // (modifying input block directly)
            const blockOrShadow = blocks[blockOrShadowID];
            if (Array.isArray(blockOrShadow)) {
                currInput[i] = blockOrShadow;
                delete blocks[blockOrShadowID];
            }
        }
    }
    return block;
};

const serializeBlocks = function (blocks) {
    const obj = Object.create(null);
    for (const blockID in blocks) {
        if (!blocks.hasOwnProperty(blockID)) continue;
        obj[blockID] = serializeBlock(blocks[blockID], blocks);
    }
    // once we have completed a first pass, do a second pass on block inputs
    for (const serializedBlockId in obj) {
        // don't need to do the hasOwnProperty check here since we
        // created an object that doesn't get extra properties/functions
        const serializedBlock = obj[serializedBlockId];
        // caution, this function deletes parts of this object in place as
        // it's traversing it (we could do a third pass...)
        obj[serializedBlockId] = compressInputTree(serializedBlock, obj);
        // second pass on connecting primitives to serialized inputs directly
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
            obj.broadcasts[varId] = v.value; // name and value is the same for broadcast msgs
            continue;
        }
        if (v.type === Variable.LIST_TYPE) {
            obj.lists[varId] = [v.name, v.value];
            continue;
        }

        // otherwise should be a scalar type
        obj.variables[varId] = [v.name, v.value];
        // only scalar vars have the potential to be cloud vars
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
    if (target.hasOwnProperty('volume')) obj.volume = target.volume;
    if (obj.isStage) { // Only the stage should have these properties
        if (target.hasOwnProperty('tempo')) obj.tempo = target.tempo;
        if (target.hasOwnProperty('videoTransparency')) obj.videoTransparency = target.videoTransparency;
        if (target.hasOwnProperty('videoState')) obj.videoState = target.videoState;
    } else { // The stage does not need the following properties, but sprites should
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

// Deserializes input descriptors, which is either a block id or a serialized primitive
// (see serializePrimitiveBlock function).
const deserializeInputDesc = function (inputDescOrId, parentId, isShadow, blocks) {
    if (!Array.isArray(inputDescOrId)) return inputDescOrId;
    const primitiveObj = Object.create(null);
    const newId = uid();
    primitiveObj.id = newId;
    primitiveObj.next = null;
    primitiveObj.parent = parentId;
    primitiveObj.shadow = isShadow;
    primitiveObj.inputs = Object.create(null);
    // need a reference to parent id
    switch (inputDescOrId[0]) {
    case MATH_NUM_PRIMITIVE: {
        primitiveObj.opcode = 'math_number';
        primitiveObj.fields = {
            NUM: {
                name: 'NUM',
                value: inputDescOrId[1]
            }
        };
        primitiveObj.topLevel = false;
        // what should we do about shadows
        break;
    }
    case POSITIVE_NUM_PRIMITIVE: {
        primitiveObj.opcode = 'math_positive_number';
        primitiveObj.fields = {
            NUM: {
                name: 'NUM',
                value: inputDescOrId[1]
            }
        };
        primitiveObj.topLevel = false;
        break;
    }
    case WHOLE_NUM_PRIMITIVE: {
        primitiveObj.opcode = 'math_whole_number';
        primitiveObj.fields = {
            NUM: {
                name: 'NUM',
                value: inputDescOrId[1]
            }
        };
        primitiveObj.topLevel = false;
        break;
    }
    case INTEGER_NUM_PRIMITIVE: {
        primitiveObj.opcode = 'math_integer';
        primitiveObj.fields = {
            NUM: {
                name: 'NUM',
                value: inputDescOrId[1]
            }
        };
        primitiveObj.topLevel = false;
        break;
    }
    case ANGLE_NUM_PRIMITIVE: {
        primitiveObj.opcode = 'math_angle';
        primitiveObj.fields = {
            NUM: {
                name: 'NUM',
                value: inputDescOrId[1]
            }
        };
        primitiveObj.topLevel = false;
        break;
    }
    case COLOR_PICKER_PRIMITIVE: {
        primitiveObj.opcode = 'colour_picker';
        primitiveObj.fields = {
            COLOUR: {
                name: 'COLOUR',
                value: inputDescOrId[1]
            }
        };
        primitiveObj.topLevel = false;
        break;
    }
    case TEXT_PRIMITIVE: {
        primitiveObj.opcode = 'text';
        primitiveObj.fields = {
            TEXT: {
                name: 'TEXT',
                value: inputDescOrId[1]
            }
        };
        primitiveObj.topLevel = false;
        break;
    }
    case BROADCAST_PRIMITIVE: {
        primitiveObj.opcode = 'event_broadcast_menu';
        primitiveObj.fields = {
            BROADCAST_OPTION: {
                name: 'BROADCAST_OPTION',
                value: inputDescOrId[1],
                id: inputDescOrId[2],
                variableType: Variable.BROADCAST_MESSAGE_TYPE
            }
        };
        primitiveObj.topLevel = false;
        break;
    }
    case VAR_PRIMITIVE: {
        primitiveObj.opcode = 'data_variable';
        primitiveObj.fields = {
            VARIABLE: {
                name: 'VARIABLE',
                value: inputDescOrId[1],
                id: inputDescOrId[2],
                variableType: Variable.SCALAR_TYPE
            }
        };
        if (inputDescOrId.length > 3) {
            primitiveObj.topLevel = true;
            primitiveObj.x = inputDescOrId[3];
            primitiveObj.y = inputDescOrId[4];
        }
        break;
    }
    case LIST_PRIMITIVE: {
        primitiveObj.opcode = 'data_listcontents';
        primitiveObj.fields = {
            LIST: {
                name: 'LIST',
                value: inputDescOrId[1],
                id: inputDescOrId[2],
                variableType: Variable.LIST_TYPE
            }
        };
        if (inputDescOrId.length > 3) {
            primitiveObj.topLevel = true;
            primitiveObj.x = inputDescOrId[3];
            primitiveObj.y = inputDescOrId[4];
        }
        break;
    }
    default: {
        log.error(`Found unknown primitive type during deserialization: ${JSON.stringify(inputDescOrId)}`);
        return null;
    }
    }
    blocks[newId] = primitiveObj;
    return newId;
};

const deserializeInputs = function (inputs, parentId, blocks) {
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
            block = shadow = deserializeInputDesc(inputDescArr[1], parentId, true, blocks);
        } else if (blockShadowInfo === INPUT_BLOCK_NO_SHADOW) {
            block = deserializeInputDesc(inputDescArr[1], parentId, false, blocks);
        } else { // assume INPUT_DIFF_BLOCK_SHADOW
            block = deserializeInputDesc(inputDescArr[1], parentId, false, blocks);
            shadow = deserializeInputDesc(inputDescArr[2], parentId, true, blocks);
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
            if (Array.isArray(blockJSON)) {
                // this is one of the primitives
                // delete the old entry in object.blocks and replace it w/the
                // deserialized object
                delete object.blocks[blockId];
                deserializeInputDesc(blockJSON, null, false, object.blocks);
                continue;
            }
            blockJSON.id = blockId; // add id back to block since it wasn't serialized
            const serializedInputs = blockJSON.inputs;
            const deserializedInputs = deserializeInputs(serializedInputs, blockId, object.blocks);
            blockJSON.inputs = deserializedInputs;
            const serializedFields = blockJSON.fields;
            const deserializedFields = deserializeFields(serializedFields);
            blockJSON.fields = deserializedFields;
        }
        // Take a second pass to create objects and add extensions
        for (const blockId in object.blocks) {
            if (!object.blocks.hasOwnProperty(blockId)) continue;
            const blockJSON = object.blocks[blockId];
            blocks.createBlock(blockJSON);

            const dotIndex = blockJSON.opcode.indexOf('.');
            if (dotIndex >= 0) {
                const extensionId = blockJSON.opcode.substring(0, dotIndex);
                extensions.extensionIDs.add(extensionId);
            }
        }
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
    if (object.hasOwnProperty('tempo')) {
        target.tempo = object.tempo;
    }
    if (object.hasOwnProperty('volume')) {
        target.volume = object.volume;
    }
    if (object.hasOwnProperty('videoTransparency')) {
        target.videoTransparency = object.videoTransparency;
    }
    if (object.hasOwnProperty('videoState')) {
        target.videoState = object.videoState;
    }
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
                broadcast,
                Variable.BROADCAST_MESSAGE_TYPE,
                false
            );
            // no need to explicitly set the value, variable constructor
            // sets the value to the same as the name for broadcast msgs
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
