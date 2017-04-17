const AssetType = require('scratch-storage').AssetType;
const log = require('../util/log');

/**
 * Load a sound's asset into memory asynchronously.
 * @param {!object} sound - the Scratch sound object.
 * @property {string} md5 - the MD5 and extension of the sound to be loaded.
 * @property {Buffer} data - sound data will be written here once loaded.
 * @param {!Runtime} runtime - Scratch runtime, used to access the storage module.
 * @returns {!Promise} - a promise which will resolve after sound is loaded
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
    const idParts = sound.md5.split('.');
    const md5 = idParts[0];
    return runtime.storage.load(AssetType.Sound, md5).then(soundAsset => {
        sound.data = soundAsset.data;
        return runtime.audioEngine.decodeSound(sound);
    });
};

module.exports = loadSound;
