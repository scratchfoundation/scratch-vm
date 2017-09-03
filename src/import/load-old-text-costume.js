// @todo this file's name is a little bit unwieldly; should it be merged with load-costume.js (which could also contain common code between the two functions)?

const StringUtil = require('../util/string-util');
const log = require('../util/log');

// @todo should [bitmapResolution] (in the documentation comment) not be optional? After all, the resulting image is always a bitmap.

/**
 * Load an "old text" costume's asset into memory asynchronously.
 * "Old text" costumes are ones who have a text part from Scratch 1.4.
 * See the issue LLK/scratch-vm#672 for more information.
 * Do not call this unless there is a renderer attached.
 * @param {string} baseMD5ext - the MD5 and extension of the base layer of the costume to be loaded.
 * @param {string} textMD5ext - the MD5 and extension of the text layer of the costume to be loaded.
 * @param {!object} costume - the Scratch costume object.
 * @property {int} skinId - the ID of the costume's render skin, once installed.
 * @property {number} rotationCenterX - the X component of the costume's origin.
 * @property {number} rotationCenterY - the Y component of the costume's origin.
 * @property {number} [bitmapResolution] - the resolution scale for a bitmap costume.
 * @param {!Runtime} runtime - Scratch runtime, used to access the storage module.
 * @returns {?Promise} - a promsie which will resolve after skinId is set, or null on error.
 */
const loadOldTextCostume = function(baseMD5ext, textMD5ext, costume, runtime) {
    if (!runtime.storage) {
        log.error('No storage module present; cannot load costume asset: ', baseMD5ext, textMD5ext);
        return Promise.resolve(costume);
    }

    const [baseMD5, baseExt] = StringUtil.splitFirst(baseMD5ext, '.');
    const [textMD5, textExt] = StringUtil.splitFirst(textMD5ext, '.');

    if (baseExt === 'svg' || textExt === 'svg') {
        log.error('Old text costumes should never be SVGs');
        return Promise.resolve(costume);
    }

    const assetType = runtime.storage.AssetType.ImageBitmap;

    // @todo should this be in a separate function, which could also be used by loadCostume?
    const rotationCenter = [
        costume.rotationCenterX / costume.bitmapResolution,
        costume.rotationCenterY / costume.bitmapResolution
    ];

    // @todo what should the assetId be? Probably unset, since we'll be doing image processing (which will produce a completely new image)?
    // @todo what about the dataFormat? This depends on how the image processing is implemented.

    return Promise.all([
        runtime.storage.load(assetType, baseMD5, baseExt),
        runtime.storage.load(assetType, textMD5, textExt)
    ]).then(costumeAssets => (
        new Promise((resolve, reject) => {
            const baseImageElement = new Image();
            const textImageElement = new Image();

            let loadedOne = false;

            const onError = function () {
                // eslint-disable-next-line no-use-before-define
                removeEventListeners();
                reject();
            };
            const onLoad = function () {
                if (loadedOne) {
                    removeEventListeners();
                    resolve([baseImageElement, textImageElement]);
                } else {
                    loadedOne = true;
                }
            };
            const removeEventListeners = function () {
                baseImageElement.removeEventListener('error', onError);
                textImageElement.removeEventListener('error', onError);
                baseImageElement.removeEventListener('load', onLoad);
                textImageElement.removeEventListener('load', onLoad);
            };

            baseImageElement.addEventListener('error', onError);
            textImageElement.addEventListener('error', onError);
            baseImageElement.addEventListener('load', onLoad);
            textImageElement.addEventListener('load', onLoad);

            const [baseAsset, textAsset] = costumeAssets;

            baseImageElement.src = baseAsset.encodeDataURI();
            textImageElement.src = textAsset.encodeDataURI();
        })
    )).then(imageElements => {
        const [baseImageElement, textImageElement] = imageElements;

        // @todo flatten the base and text images. The renderer should probably do the image processing that'll be needed here.
        // The text part is currently displayed only for debugging.
        costume.skinId = runtime.renderer.createBitmapSkin(textImageElement, costume.bitmapResolution, rotationCenter);

        return costume;
    });
};

module.exports = loadOldTextCostume;
