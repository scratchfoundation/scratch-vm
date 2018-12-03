const {value} = require('../squeak/fields');
const {ImageMediaData, SoundMediaData, SpriteData} = require('../squeak/types');

const sb1SpecMap = {
    // https://github.com/LLK/scratch-flash/blob/cb5f42f039ef633710faf9c63b69e8368b280372/src/blocks/BlockIO.as#L197-L199
    'getParam': ([a, b, c, d]) => [a, b, c, d || 'r'],
    // https://github.com/LLK/scratch-flash/blob/cb5f42f039ef633710faf9c63b69e8368b280372/src/blocks/BlockIO.as#L200-L212
    'changeVariable': block => [block[2], block[1], block[3]],
    // https://github.com/LLK/scratch-flash/blob/cb5f42f039ef633710faf9c63b69e8368b280372/src/blocks/BlockIO.as#L213-L219
    'EventHatMorph': block => {
        if (String(block[1]) === 'Scratch-StartClicked') {
            return ['whenGreenFlag'];
        }
        return ['whenIReceive', block[1]];
    },
    // https://github.com/LLK/scratch-flash/blob/cb5f42f039ef633710faf9c63b69e8368b280372/src/blocks/BlockIO.as#L220-L222
    'MouseClickEventHatMorph': () => ['whenClicked'],
    // https://github.com/LLK/scratch-flash/blob/cb5f42f039ef633710faf9c63b69e8368b280372/src/blocks/BlockIO.as#L223-L226
    'KeyEventHatMorph': block => ['whenKeyPressed', block[1]],
    // https://github.com/LLK/scratch-flash/blob/cb5f42f039ef633710faf9c63b69e8368b280372/src/blocks/BlockIO.as#L227-L235
    'stopScripts': block => {
        if (String(block[1]) === 'other scripts') {
            return [block[0], 'other scripts in sprite'];
        }
        return block;
    },
    // https://github.com/LLK/scratch-flash/blob/cb5f42f039ef633710faf9c63b69e8368b280372/src/blocks/BlockIO.as#L249-L253
    'abs': block => ['computeFunction:of:', 'abs', block[1]],
    // https://github.com/LLK/scratch-flash/blob/cb5f42f039ef633710faf9c63b69e8368b280372/src/blocks/BlockIO.as#L254-L258
    'sqrt': block => ['computeFunction:of:', 'sqrt', block[1]],
    // https://github.com/LLK/scratch-flash/blob/cb5f42f039ef633710faf9c63b69e8368b280372/src/blocks/BlockIO.as#L137
    '\\\\': block => ['%', ...block.slice(1)],
    // https://github.com/LLK/scratch-flash/blob/cb5f42f039ef633710faf9c63b69e8368b280372/src/blocks/BlockIO.as#L259-L262
    'doReturn': () => ['stopScripts', 'this script'],
    // https://github.com/LLK/scratch-flash/blob/cb5f42f039ef633710faf9c63b69e8368b280372/src/blocks/BlockIO.as#L263-L266
    'stopAll': () => ['stopScripts', 'all'],
    // https://github.com/LLK/scratch-flash/blob/cb5f42f039ef633710faf9c63b69e8368b280372/src/blocks/BlockIO.as#L267-L270
    'showBackground:': block => ['startScene', block[1]],
    // https://github.com/LLK/scratch-flash/blob/cb5f42f039ef633710faf9c63b69e8368b280372/src/blocks/BlockIO.as#L271-L273
    'nextBackground': () => ['nextScene'],
    // https://github.com/LLK/scratch-flash/blob/cb5f42f039ef633710faf9c63b69e8368b280372/src/blocks/BlockIO.as#L274-L282
    'doForeverIf': block => ['doForever', [['doIf', block[1], block[2]]]]
};

const toSb2Json = root => {
    const {info, stageData, images, sounds} = root;

    const pairs = array => {
        const pairs = [];
        for (let i = 0; i < array.length; i += 2) {
            pairs.push([array[i], array[i + 1]]);
        }
        return pairs;
    };

    const toSb2JsonVariable = ([name, value]) => ({
        name,
        value,
        isPersistent: false
    });

    const toSb2JsonList = ([name, {
        listName, contents, x, y, width, height, hiddenWhenNull
    }]) => ({
        listName: listName,
        contents: contents,
        isPersistent: false,
        x: x,
        y: y,
        width: width,
        height: height,
        visible: value(hiddenWhenNull) !== null
    });

    // const toSb2JsonWatcher = watcher => {
    //
    // };
    //
    // const toSb2JsonListWatcher = listWatcher => {
    //
    // };

    const toSb2JsonSound = soundMediaData => {
        const soundID = sounds.findIndex(sound => sound.crc === soundMediaData.crc);
        return {
            soundName: soundMediaData.name,
            soundID,
            // TODO: Produce a proper MD5.
            md5: `${soundID}.wav`,
            sampleCount: soundMediaData.sampleCount,
            rate: soundMediaData.rate,
            format: ''
        };
    };

    const toSb2JsonCostume = imageMediaData => {
        const baseLayerID = images.findIndex(image => image.crc === imageMediaData.crc);
        return {
            costumeName: imageMediaData.costumeName,
            baseLayerID,
            // TODO: Produce a proper MD5.
            baseLayerMD5: `${baseLayerID}.${imageMediaData.extension}`,
            bitmapResolution: 1,
            rotationCenterX: imageMediaData.rotationCenter.x,
            rotationCenterY: imageMediaData.rotationCenter.y
        };
    };

    const toSb2JsonBlock = blockData => {
        let output = blockData.map(toSb2JsonBlockArg);
        const spec = sb1SpecMap[output[0]];
        if (spec) {
            output = spec(output);
        }
        return output;
    };

    const toSb2JsonStack = stackData => {
        return stackData.map(toSb2JsonBlock);
    };

    const toSb2JsonBlockArg = argData => {
        if (argData instanceof SpriteData) {
            return argData.objName;
        }
        else if (Array.isArray(argData)) {
            if (argData.length === 0 || Array.isArray(argData[0])) {
                return toSb2JsonStack(argData);
            }
            return toSb2JsonBlock(argData);
        }
        return argData;
    };

    const toSb2JsonScript = scriptData => {
        return [
            scriptData[0].x,
            scriptData[0].y,
            toSb2JsonStack(scriptData[1])
        ];
    };

    const toSb2JsonSprite = spriteData => {
        const rawCostumes = spriteData.media
        .filter(data => data instanceof ImageMediaData);
        const rawSounds = spriteData.media
        .filter(data => data instanceof SoundMediaData);
        return {
            objName: spriteData.objName,
            variables: pairs(spriteData.vars).map(toSb2JsonVariable),
            lists: pairs(spriteData.lists).map(toSb2JsonList),
            scripts: spriteData.blocksBin.map(toSb2JsonScript),
            costumes: rawCostumes
            .map(toSb2JsonCostume),
            currentCostumeIndex: rawCostumes.findIndex(image => image.crc === spriteData.currentCostume.crc),
            sounds: rawSounds.map(toSb2JsonSound),
            scratchX: spriteData.scratchX,
            scratchY: spriteData.scratchY,
            scale: spriteData.scalePoint.x,
            direction: Math.round(spriteData.rotationDegrees * 1e6) / 1e6 - 270,
            rotationStyle: spriteData.rotationStyle,
            isDraggable: spriteData.draggable,
            indexInLibrary: stageData.spriteOrderInLibrary.indexOf(spriteData),
            visible: spriteData.visible,
            spriteInfo: {}
        };
    };

    const toSb2JsonChild = child => {
        if (child instanceof SpriteData) {
            return toSb2JsonSprite(child);
        }
        return null;
    }

    const toSb2JsonStage = stageData => {
        const rawCostumes = stageData.media
        .filter(data => data instanceof ImageMediaData);
        const rawSounds = stageData.media
        .filter(data => data instanceof SoundMediaData);
        return {
            objName: stageData.objName,
            variables: pairs(stageData.vars).map(toSb2JsonVariable),
            lists: pairs(stageData.lists).map(toSb2JsonList),
            scripts: stageData.blocksBin.map(toSb2JsonScript),
            costumes: rawCostumes
            .map(toSb2JsonCostume),
            currentCostumeIndex: rawCostumes.findIndex(image => image.crc === stageData.currentCostume.crc),
            sounds: rawSounds.map(toSb2JsonSound),
            // TODO: Where does this come from? Is it always the same for SB1?
            penLayerMD5: '5c81a336fab8be57adc039a8a2b33ca9.png',
            penLayerID: 0,
            tempoBPM: stageData.tempoBPM,
            videoAlpha: 0.5,
            children: stageData.stageContents.map(toSb2JsonChild).filter(Boolean)
        };
    };

    const toSb2JsonInfo = info => {
        const obj = {};
        for (let i = 0; i < info.length; i += 2) {
            if ('' + info[i] === 'thumbnail') continue;
            obj['' + info[i]] = '' + info[i + 1];
        }
        return obj;
    };

    return JSON.parse(JSON.stringify(Object.assign(toSb2JsonStage(stageData), {
        info: toSb2JsonInfo(info)
    })));
};

exports.toSb2Json = toSb2Json;
