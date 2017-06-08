const StringUtil = require('../util/string-util');
const log = require('../util/log');

/**
 * Load a sound's asset into memory asynchronously.
 * @param {!object} sound - the Scratch sound object.
 * @property {string} md5 - the MD5 and extension of the sound to be loaded.
 * @property {Buffer} data - sound data will be written here once loaded.
 * @param {!Runtime} runtime - Scratch runtime, used to access the storage module.
 * @returns {!Promise} - a promise which will resolve to the sound when ready.
 */
const loadSound = function (sound, runtime) {
    if (!runtime.storage) {
        log.error('No storage module present; cannot load sound asset: ', sound.md5);
        return Promise.resolve(sound);
    }
    if (!runtime.audioEngine) {
        log.error('No audio engine present; cannot load sound asset: ', sound.md5);
        return Promise.resolve(sound);
    }
    const idParts = StringUtil.splitFirst(sound.md5, '.');
    const md5 = idParts[0];
    const ext = idParts[1].toLowerCase();
    return runtime.storage.load(runtime.storage.AssetType.Sound, md5, ext)
        .then(soundAsset => {
            sound.assetId = soundAsset.assetId;
            sound.dataFormat = ext;
            return runtime.audioEngine.decodeSound(Object.assign(
                {},
                sound,
                {data: soundAsset.data}
            ));
        })
        .then(() => sound);
};

module.exports = loadSound;
