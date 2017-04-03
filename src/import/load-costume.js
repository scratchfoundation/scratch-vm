var AssetType = require('scratch-storage').AssetType;
var log = require('../util/log');

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
var loadCostume = function (md5ext, costume, runtime) {
    if (!runtime.storage) {
        log.error('No storage module present; cannot load costume asset: ', md5ext);
        return Promise.resolve(costume);
    }


    var idParts = md5ext.split('.');
    var md5 = idParts[0];
    var ext = idParts[1].toUpperCase();
    var assetType = (ext === 'SVG') ? AssetType.ImageVector : AssetType.ImageBitmap;

    var rotationCenter = [
        costume.rotationCenterX / costume.bitmapResolution,
        costume.rotationCenterY / costume.bitmapResolution
    ];

    var promise = runtime.storage.load(assetType, md5).then(function (costumeAsset) {
        costume.url = costumeAsset.encodeDataURI();
        return costumeAsset;
    });

    if (!runtime.renderer) {
        log.error('No rendering module present; cannot load costume asset: ', md5ext);
        return promise.then(function () {
            return costume;
        });
    }

    if (assetType === AssetType.ImageVector) {
        promise = promise.then(function (costumeAsset) {
            costume.skinId = runtime.renderer.createSVGSkin(costumeAsset.decodeText(), rotationCenter);
            return costume;
        });
    } else {
        promise = promise.then(function (costumeAsset) {
            return new Promise(function (resolve, reject) {
                var imageElement = new Image();
                var removeEventListeners; // fix no-use-before-define
                var onError = function () {
                    removeEventListeners();
                    reject();
                };
                var onLoad = function () {
                    removeEventListeners();
                    resolve(imageElement);
                };
                removeEventListeners = function () {
                    imageElement.removeEventListener('error', onError);
                    imageElement.removeEventListener('load', onLoad);
                };
                imageElement.addEventListener('error', onError);
                imageElement.addEventListener('load', onLoad);
                imageElement.src = costumeAsset.encodeDataURI();
            });
        }).then(function (imageElement) {
            costume.skinId = runtime.renderer.createBitmapSkin(imageElement, costume.bitmapResolution, rotationCenter);
            return costume;
        });
    }
    return promise;
};

module.exports = loadCostume;
