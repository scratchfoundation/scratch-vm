const StringUtil = require('../util/string-util');
const log = require('../util/log');

const loadVector_ = function (costume, runtime, rotationCenter, optVersion) {
    let svgString = costume.asset.decodeText();
    // SVG Renderer load fixes "quirks" associated with Scratch 2 projects
    if (optVersion && optVersion === 2 && !runtime.v2SvgAdapter) {
        log.error('No V2 SVG adapter present; SVGs may not render correctly.');
    } else if (optVersion && optVersion === 2 && runtime.v2SvgAdapter) {
        runtime.v2SvgAdapter.loadString(svgString, true /* fromVersion2 */);
        svgString = runtime.v2SvgAdapter.toString();
        // Put back into storage
        const storage = runtime.storage;
        costume.asset.encodeTextData(svgString, storage.DataFormat.SVG, true);
        costume.assetId = costume.asset.assetId;
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

/**
 * Return a promise to fetch a bitmap from storage and return it as a canvas
 * If the costume has bitmapResolution 1, it will be converted to bitmapResolution 2 here (the standard for Scratch 3)
 * If the costume has a text layer asset, which is a text part from Scratch 1.4, then this function
 * will merge the two image assets. See the issue LLK/scratch-vm#672 for more information.
 * @param {!object} costume - the Scratch costume object.
 * @param {!Runtime} runtime - Scratch runtime, used to access the v2BitmapAdapter
 * @param {?object} rotationCenter - optionally passed in coordinates for the center of rotation for the image. If
 *     none is given, the rotation center of the costume will be set to the middle of the costume later on.
 * @property {number} costume.bitmapResolution - the resolution scale for a bitmap costume.
 * @returns {?Promise} - a promise which will resolve to an object {canvas, rotationCenter, assetMatchesBase},
 *     or reject on error.
 *     assetMatchesBase is true if the asset matches the base layer; false if it required adjustment
 */
const fetchBitmapCanvas_ = function (costume, runtime, rotationCenter) {
    if (!costume || !costume.asset) {
        return Promise.reject('Costume load failed. Assets were missing.');
    }
    if (!runtime.v2BitmapAdapter) {
        return Promise.reject('No V2 Bitmap adapter present.');
    }

    return new Promise((resolve, reject) => {
        const baseImageElement = new Image();
        let textImageElement;

        // We need to wait for 2 images total to load. loadedOne will be true when one
        // is done, and we are just waiting for one more.
        let loadedOne = false;

        const onError = function () {
            // eslint-disable-next-line no-use-before-define
            removeEventListeners();
            reject('Costume load failed. Asset could not be read.');
        };
        const onLoad = function () {
            if (loadedOne) {
                // eslint-disable-next-line no-use-before-define
                removeEventListeners();
                resolve([baseImageElement, textImageElement]);
            } else {
                loadedOne = true;
            }
        };

        const removeEventListeners = function () {
            baseImageElement.removeEventListener('error', onError);
            baseImageElement.removeEventListener('load', onLoad);
            if (textImageElement) {
                textImageElement.removeEventListener('error', onError);
                textImageElement.removeEventListener('load', onLoad);
            }
        };

        baseImageElement.addEventListener('load', onLoad);
        baseImageElement.addEventListener('error', onError);
        if (costume.textLayerAsset) {
            textImageElement = new Image();
            textImageElement.addEventListener('load', onLoad);
            textImageElement.addEventListener('error', onError);
            textImageElement.src = costume.textLayerAsset.encodeDataURI();
        } else {
            loadedOne = true;
        }
        baseImageElement.src = costume.asset.encodeDataURI();
    }).then(imageElements => {
        const [baseImageElement, textImageElement] = imageElements;

        let canvas = document.createElement('canvas');
        const scale = costume.bitmapResolution === 1 ? 2 : 1;
        canvas.width = baseImageElement.width;
        canvas.height = baseImageElement.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(baseImageElement, 0, 0);
        if (textImageElement) {
            ctx.drawImage(textImageElement, 0, 0);
        }
        if (scale !== 1) {
            canvas = runtime.v2BitmapAdapter.resize(canvas, canvas.width * scale, canvas.height * scale);
        }

        // By scaling, we've converted it to bitmap resolution 2
        if (rotationCenter) {
            rotationCenter[0] = rotationCenter[0] * scale;
            rotationCenter[1] = rotationCenter[1] * scale;
            costume.rotationCenterX = rotationCenter[0];
            costume.rotationCenterY = rotationCenter[1];
        }
        costume.bitmapResolution = 2;

        return {
            canvas: canvas,
            rotationCenter: rotationCenter,
            // True if the asset matches the base layer; false if it required adjustment
            assetMatchesBase: scale === 1 && !textImageElement
        };
    })
        .finally(() => {
            // Clean up the costume object
            delete costume.textLayerMD5;
            delete costume.textLayerAsset;
        });
};

const loadBitmap_ = function (costume, runtime, rotationCenter) {
    return fetchBitmapCanvas_(costume, runtime, rotationCenter).then(fetched => new Promise(resolve => {
        rotationCenter = fetched.rotationCenter;

        const updateCostumeAsset = function (dataURI) {
            if (!runtime.v2BitmapAdapter) {
                return Promise.reject('No V2 Bitmap adapter present.');
            }

            const storage = runtime.storage;
            costume.asset = storage.createAsset(
                storage.AssetType.ImageBitmap,
                storage.DataFormat.PNG,
                runtime.v2BitmapAdapter.convertDataURIToBinary(dataURI),
                null,
                true // generate md5
            );
            costume.assetId = costume.asset.assetId;
            costume.md5 = `${costume.assetId}.${costume.dataFormat}`;
        };

        if (!fetched.assetMatchesBase) {
            updateCostumeAsset(fetched.canvas.toDataURL());
        }
        resolve(fetched.canvas);
    }))
        .then(canvas => {
            // createBitmapSkin does the right thing if costume.bitmapResolution or rotationCenter are undefined...
            costume.skinId = runtime.renderer.createBitmapSkin(canvas, costume.bitmapResolution, rotationCenter);
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
 * @property {!Asset} costume.asset - the asset of the costume loaded from storage.
 * @param {!Runtime} runtime - Scratch runtime, used to access the storage module.
 * @param {?int} optVersion - Version of Scratch that the costume comes from. If this is set
 *     to 2, scratch 3 will perform an upgrade step to handle quirks in SVGs from Scratch 2.0.
 * @returns {?Promise} - a promise which will resolve after skinId is set, or null on error.
 */
const loadCostumeFromAsset = function (costume, runtime, optVersion) {
    costume.assetId = costume.asset.assetId;
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
    if (costume.asset.assetType === AssetType.ImageVector) {
        return loadVector_(costume, runtime, rotationCenter, optVersion);
    }
    return loadBitmap_(costume, runtime, rotationCenter, optVersion);
};

/**
 * Load a costume's asset into memory asynchronously.
 * Do not call this unless there is a renderer attached.
 * @param {!string} md5ext - the MD5 and extension of the costume to be loaded.
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
    const idParts = StringUtil.splitFirst(md5ext, '.');
    const md5 = idParts[0];
    const ext = idParts[1].toLowerCase();
    costume.dataFormat = ext;

    if (costume.asset) {
        // Costume comes with asset. It could be coming from camera, image upload, drag and drop, or file
        return loadCostumeFromAsset(costume, runtime, optVersion);
    }

    // Need to load the costume from storage. The server should have a reference to this md5.
    if (!runtime.storage) {
        log.error('No storage module present; cannot load costume asset: ', md5ext);
        return Promise.resolve(costume);
    }

    const AssetType = runtime.storage.AssetType;
    const assetType = (ext === 'svg') ? AssetType.ImageVector : AssetType.ImageBitmap;

    const costumePromise = runtime.storage.load(assetType, md5, ext);
    if (!costumePromise) {
        log.error(`Couldn't fetch costume asset: ${md5ext}`);
        return;
    }

    let textLayerPromise;
    if (costume.textLayerMD5) {
        textLayerPromise = runtime.storage.load(AssetType.ImageBitmap, costume.textLayerMD5, 'png');
    } else {
        textLayerPromise = Promise.resolve(null);
    }

    return Promise.all([costumePromise, textLayerPromise]).then(assetArray => {
        costume.asset = assetArray[0];
        if (assetArray[1]) {
            costume.textLayerAsset = assetArray[1];
        }
        return loadCostumeFromAsset(costume, runtime, optVersion);
    })
        .catch(e => {
            log.error(e);
        });
};

module.exports = {
    loadCostume,
    loadCostumeFromAsset
};
