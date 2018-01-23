const StringUtil = require('../util/string-util');
const log = require('../util/log');

/**
 * Initialize a costume from an asset asynchronously.
 * Do not call this unless there is a renderer attached.
 * @param {!object} costume - the Scratch costume object.
 * @property {int} skinId - the ID of the costume's render skin, once installed.
 * @property {number} rotationCenterX - the X component of the costume's origin.
 * @property {number} rotationCenterY - the Y component of the costume's origin.
 * @property {number} [bitmapResolution] - the resolution scale for a bitmap costume.
 * @param {!Asset} costumeAsset - the asset of the costume loaded from storage.
 * @param {!Runtime} runtime - Scratch runtime, used to access the storage module.
 * @returns {?Promise} - a promise which will resolve after skinId is set, or null on error.
 */
const loadCostumeFromAsset = function (costume, costumeAsset, runtime) {
    costume.assetId = costumeAsset.assetId;
    if (!runtime.renderer) {
        log.error('No rendering module present; cannot load costume: ', costume.name);
        return costume;
    }
    const AssetType = runtime.storage.AssetType;
    const rotationCenter = [
        costume.rotationCenterX / costume.bitmapResolution,
        costume.rotationCenterY / costume.bitmapResolution
    ];
    if (costumeAsset.assetType === AssetType.ImageVector) {
        costume.skinId = runtime.renderer.createSVGSkin(costumeAsset.decodeText(), rotationCenter);
        return costume;
    }

    return new Promise((resolve, reject) => {
        const imageElement = new Image();
        const onError = function () {
            // eslint-disable-next-line no-use-before-define
            removeEventListeners();
            reject();
        };
        const onLoad = function () {
            // eslint-disable-next-line no-use-before-define
            removeEventListeners();
            resolve(imageElement);
        };
        const removeEventListeners = function () {
            imageElement.removeEventListener('error', onError);
            imageElement.removeEventListener('load', onLoad);
        };
        imageElement.addEventListener('error', onError);
        imageElement.addEventListener('load', onLoad);
        imageElement.src = costumeAsset.encodeDataURI();
    }).then(imageElement => {
        costume.skinId = runtime.renderer.createBitmapSkin(imageElement, costume.bitmapResolution, rotationCenter);
        return costume;
    });
};

/**
 * Load a costume's asset into memory asynchronously.
 * Do not call this unless there is a renderer attached.
 * @param {string} md5ext - the MD5 and extension of the costume to be loaded.
 * @param {!object} costume - the Scratch costume object.
 * @property {int} skinId - the ID of the costume's render skin, once installed.
 * @property {number} rotationCenterX - the X component of the costume's origin.
 * @property {number} rotationCenterY - the Y component of the costume's origin.
 * @property {number} [bitmapResolution] - the resolution scale for a bitmap costume.
 * @param {!Runtime} runtime - Scratch runtime, used to access the storage module.
 * @returns {?Promise} - a promise which will resolve after skinId is set, or null on error.
 */
const loadCostume = function (md5ext, costume, runtime) {
    if (!runtime.storage) {
        log.error('No storage module present; cannot load costume asset: ', md5ext);
        return Promise.resolve(costume);
    }

    const AssetType = runtime.storage.AssetType;
    const idParts = StringUtil.splitFirst(md5ext, '.');
    const md5 = idParts[0];
    const ext = idParts[1].toLowerCase();
    const assetType = (ext === 'svg') ? AssetType.ImageVector : AssetType.ImageBitmap;

    return runtime.storage.load(assetType, md5, ext).then(costumeAsset => {
        costume.dataFormat = ext;
        return loadCostumeFromAsset(costume, costumeAsset, runtime);
    });
};

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
 * @returns {?Promise} - a promise which will resolve after skinId is set, or null on error.
 */
const loadOldTextCostume = function(baseMD5ext, textMD5ext, costume, runtime) {
    // @todo should [bitmapResolution] (in the documentation comment) not be optional? After all, the resulting image is always a bitmap.

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

        const canvas = document.createElement('canvas');
        canvas.width = baseImageElement.width;
        canvas.height = baseImageElement.height;

        const ctx = canvas.getContext('2d')
        ctx.drawImage(baseImageElement, 0, 0);
        ctx.drawImage(textImageElement, 0, 0);

        costume.skinId = runtime.renderer.createBitmapSkin(canvas, costume.bitmapResolution, rotationCenter);

        return costume;
    });
};

module.exports = {
    loadCostume,
    loadCostumeFromAsset,
    loadOldTextCostume
};
