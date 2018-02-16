const JSZip = require('jszip');
const log = require('../util/log');

/**
 * Deserializes sound from file into storage cache so that it can
 * be loaded into the runtime.
 * @param {object} sound Descriptor for sound from sb3 file
 * @param {Runtime} runtime The runtime containing the storage to cache the sounds in
 * @param {JSZip} zip The zip containing the sound file being described by `sound`
 * @return {Promise} Promise that resolves after the described sound has been stored
 * into the runtime storage cache, the sound was already stored, or an error has
 * occurred.
 */
const deserializeSound = function (sound, runtime, zip) {
    const fileName = sound.md5; // The md5 property has the full file name
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
 * @return {Promise} Promise that resolves after the described costume has been stored
 * into the runtime storage cache, the costume was already stored, or an error has
 * occurred.
 */
const deserializeCostume = function (costume, runtime, zip) {
    const storage = runtime.storage;
    const assetId = costume.assetId;
    const fileName = costume.md5 ?
        costume.md5 :
        `${assetId}.${costume.dataFormat}`; // The md5 property has the full file name

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

    const costumeFile = zip.file(fileName);
    if (!costumeFile) {
        log.error(`Could not find costume file associated with the ${costume.name} costume.`);
        return Promise.resolve(null);
    }
    let dataFormat = null;
    let assetType = null;
    const costumeFormat = costume.dataFormat.toLowerCase();
    if (costumeFormat === 'svg') {
        dataFormat = storage.DataFormat.SVG;
        assetType = storage.AssetType.ImageVector;
    } else if (costumeFormat === 'png') {
        dataFormat = storage.DataFormat.PNG;
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
            dataFormat,
            data,
            assetId
        );
    });
};

module.exports = {
    deserializeSound,
    deserializeCostume
};
