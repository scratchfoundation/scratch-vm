const JSZip = require('jszip');
const log = require('../util/log');

/**
 * Deserializes sound from file into storage cache so that it can
 * be loaded into the runtime.
 * @param {object} sound Descriptor for sound from sb3 file
 * @param {Runtime} runtime The runtime containing the storage to cache the sounds in
 * @param {JSZip} zip The zip containing the sound file being described by `sound`
 * @param {string} assetFileName Optional file name for the given asset
 * (sb2 files have filenames of the form [int].[ext],
 * sb3 files have filenames of the form [md5].[ext])
 * @return {Promise} Promise that resolves after the described sound has been stored
 * into the runtime storage cache, the sound was already stored, or an error has
 * occurred.
 */
const deserializeSound = function (sound, runtime, zip, assetFileName) {
    const fileName = assetFileName ? assetFileName : sound.md5;
    const storage = runtime.storage;
    if (!storage) {
        log.error('No storage module present; cannot load sound asset: ', fileName);
        return Promise.resolve(null);
    }

    const assetId = sound.assetId;

    // TODO Is there a faster way to check that this asset
    // has already been initialized?
    if (storage.get(assetId)) {
        // This sound has already been cached.
        return Promise.resolve(null);
    }
    if (!zip) {
        // TODO adding this case to make integration tests pass, need to rethink
        // the entire structure of saving/loading here (w.r.t. differences between
        // loading from local zip file or from server)
        log.error('Zipped assets were not provided.');
        return Promise.resolve(null);
    }
    const soundFile = zip.file(fileName);
    if (!soundFile) {
        log.error(`Could not find sound file associated with the ${sound.name} sound.`);
        return Promise.resolve(null);
    }
    let dataFormat = null;
    if (sound.dataFormat.toLowerCase() === 'wav') {
        dataFormat = storage.DataFormat.WAV;
    }
    if (!JSZip.support.uint8array) {
        log.error('JSZip uint8array is not supported in this browser.');
        return Promise.resolve(null);
    }

    return soundFile.async('uint8array').then(data => {
        storage.builtinHelper.cache(
            storage.AssetType.Sound,
            dataFormat,
            data,
            assetId
        );
    });
};

/**
 * Deserializes costume from file into storage cache so that it can
 * be loaded into the runtime.
 * @param {object} costume Descriptor for costume from sb3 file
 * @param {Runtime} runtime The runtime containing the storage to cache the costumes in
 * @param {JSZip} zip The zip containing the costume file being described by `costume`
 * @param {string} assetFileName Optional file name for the given asset
 * (sb2 files have filenames of the form [int].[ext],
 * sb3 files have filenames of the form [md5].[ext])
 * @return {Promise} Promise that resolves after the described costume has been stored
 * into the runtime storage cache, the costume was already stored, or an error has
 * occurred.
 */
const deserializeCostume = function (costume, runtime, zip, assetFileName) {
    const storage = runtime.storage;
    const assetId = costume.assetId;
    const fileName = assetFileName ? assetFileName :
        `${assetId}.${costume.dataFormat}`;

    if (!storage) {
        log.error('No storage module present; cannot load costume asset: ', fileName);
        return Promise.resolve(null);
    }


    // TODO Is there a faster way to check that this asset
    // has already been initialized?
    if (storage.get(assetId)) {
        // This costume has already been cached.
        return Promise.resolve(null);
    }

    if (!zip) {
        // TODO adding this case to make integration tests pass, need to rethink
        // the entire structure of saving/loading here (w.r.t. differences between
        // loading from local zip file or from server)
        log.error('Zipped assets were not provided.');
        return Promise.resolve(null);
    }

    const costumeFile = zip.file(fileName);
    if (!costumeFile) {
        log.error(`Could not find costume file associated with the ${costume.name} costume.`);
        return Promise.resolve(null);
    }
    let assetType = null;
    const costumeFormat = costume.dataFormat.toLowerCase();
    if (costumeFormat === 'svg') {
        assetType = storage.AssetType.ImageVector;
    } else if (['png', 'bmp', 'jpeg', 'jpg', 'gif'].indexOf(costumeFormat) >= 0) {
        assetType = storage.AssetType.ImageBitmap;
    } else {
        log.error(`Unexpected file format for costume: ${costumeFormat}`);
    }
    if (!JSZip.support.uint8array) {
        log.error('JSZip uint8array is not supported in this browser.');
        return Promise.resolve(null);
    }

    return costumeFile.async('uint8array').then(data => {
        storage.builtinHelper.cache(
            assetType,
            // TODO eventually we want to map non-png's to their actual file types?
            costumeFormat,
            data,
            assetId
        );
    });
};

module.exports = {
    deserializeSound,
    deserializeCostume
};
