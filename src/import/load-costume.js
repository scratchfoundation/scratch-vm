const StringUtil = require('../util/string-util');
const log = require('../util/log');

const loadVector_ = function (costume, costumeAsset, runtime, rotationCenter, optVersion) {
    let svgString = costumeAsset.decodeText();
    // SVG Renderer load fixes "quirks" associated with Scratch 2 projects
    if (optVersion && optVersion === 2 && !runtime.v2SvgAdapter) {
        log.error('No V2 SVG adapter present; SVGs may not render correctly.');
    } else if (optVersion && optVersion === 2 && runtime.v2SvgAdapter) {
        runtime.v2SvgAdapter.loadString(svgString, true /* fromVersion2 */);
        svgString = runtime.v2SvgAdapter.toString();
        // Put back into storage
        const storage = runtime.storage;
        costumeAsset.encodeTextData(svgString, storage.DataFormat.SVG);
        costume.assetId = storage.builtinHelper.cache(
            storage.AssetType.ImageVector,
            storage.DataFormat.SVG,
            costumeAsset.data
        );
        costume.md5 = `${costume.assetId}.${costume.dataFormat}`;
    }
    // createSVGSkin does the right thing if rotationCenter isn't provided, so it's okay if it's
    // undefined here
    costume.skinId = runtime.renderer.createSVGSkin(svgString, rotationCenter);
    costume.size = runtime.renderer.getSkinSize(costume.skinId);
    // Now we should have a rotationCenter even if we didn't before
    if (!rotationCenter) {
        rotationCenter = runtime.renderer.getSkinRotationCenter(costume.skinId);
        costume.rotationCenterX = rotationCenter[0];
        costume.rotationCenterY = rotationCenter[1];
        costume.bitmapResolution = 1;
    }

    return Promise.resolve(costume);
};

const loadBitmap_ = function (costume, costumeAsset, runtime, rotationCenter) {
    return new Promise((resolve, reject) => {
        const imageElement = new Image();
        const onError = function () {
            // eslint-disable-next-line no-use-before-define
            removeEventListeners();
            reject('Image load failed');
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
        const src = costumeAsset.encodeDataURI();
        if (costume.bitmapResolution === 1 && !runtime.v2BitmapAdapter) {
            log.error('No V2 bitmap adapter present; bitmaps may not render correctly.');
        } else if (costume.bitmapResolution === 1) {
            runtime.v2BitmapAdapter.convertResolution1Bitmap(src, (error, dataURI) => {
                if (error) {
                    log.error(error);
                } else if (dataURI) {
                    // Put back into storage
                    const storage = runtime.storage;
                    costume.assetId = storage.builtinHelper.cache(
                        storage.AssetType.ImageBitmap,
                        storage.DataFormat.PNG,
                        runtime.v2BitmapAdapter.convertDataURIToBinary(dataURI)
                    );
                    costume.md5 = `${costume.assetId}.${costume.dataFormat}`;
                }
                // Regardless of if conversion succeeds, convert it to bitmap resolution 2,
                // since all code from here on will assume that.
                if (rotationCenter) {
                    rotationCenter[0] = rotationCenter[0] * 2;
                    rotationCenter[1] = rotationCenter[1] * 2;
                    costume.rotationCenterX = rotationCenter[0];
                    costume.rotationCenterY = rotationCenter[1];
                }
                costume.bitmapResolution = 2;
                // Use original src if conversion fails.
                // The image will appear half-sized.
                imageElement.src = dataURI ? dataURI : src;
            });
        } else {
            imageElement.src = src;
        }
    }).then(imageElement => {
        // createBitmapSkin does the right thing if costume.bitmapResolution or rotationCenter are undefined...
        costume.skinId = runtime.renderer.createBitmapSkin(imageElement, costume.bitmapResolution, rotationCenter);
        const renderSize = runtime.renderer.getSkinSize(costume.skinId);
        costume.size = [renderSize[0] * 2, renderSize[1] * 2]; // Actual size, since all bitmaps are resolution 2

        if (!rotationCenter) {
            rotationCenter = runtime.renderer.getSkinRotationCenter(costume.skinId);
            // Actual rotation center, since all bitmaps are resolution 2
            costume.rotationCenterX = rotationCenter[0] * 2;
            costume.rotationCenterY = rotationCenter[1] * 2;
            costume.bitmapResolution = 2;
        }
        return costume;
    });
};

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
 * @param {?int} optVersion - Version of Scratch that the costume comes from. If this is set
 *     to 2, scratch 3 will perform an upgrade step to handle quirks in SVGs from Scratch 2.0.
 * @returns {?Promise} - a promise which will resolve after skinId is set, or null on error.
 */
const loadCostumeFromAsset = function (costume, costumeAsset, runtime, optVersion) {
    costume.assetId = costumeAsset.assetId;
    const renderer = runtime.renderer;
    if (!renderer) {
        log.error('No rendering module present; cannot load costume: ', costume.name);
        return Promise.resolve(costume);
    }
    const AssetType = runtime.storage.AssetType;
    let rotationCenter;
    // Use provided rotation center and resolution if they are defined. Bitmap resolution
    // should only ever be 1 or 2.
    if (typeof costume.rotationCenterX === 'number' && !isNaN(costume.rotationCenterX) &&
            typeof costume.rotationCenterY === 'number' && !isNaN(costume.rotationCenterY)) {
        rotationCenter = [costume.rotationCenterX, costume.rotationCenterY];
    }
    if (costumeAsset.assetType === AssetType.ImageVector) {
        return loadVector_(costume, costumeAsset, runtime, rotationCenter, optVersion);
    }
    return loadBitmap_(costume, costumeAsset, runtime, rotationCenter, optVersion);
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
 * @param {?int} optVersion - Version of Scratch that the costume comes from. If this is set
 *     to 2, scratch 3 will perform an upgrade step to handle quirks in SVGs from Scratch 2.0.
 * @returns {?Promise} - a promise which will resolve after skinId is set, or null on error.
 */
const loadCostume = function (md5ext, costume, runtime, optVersion) {
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
        return loadCostumeFromAsset(costume, costumeAsset, runtime, optVersion);
    })
        .catch(e => {
            log.error(e);
        });
};

module.exports = {
    loadCostume,
    loadCostumeFromAsset
};
