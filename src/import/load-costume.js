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

module.exports = {
    loadCostume,
    loadCostumeFromAsset
};
