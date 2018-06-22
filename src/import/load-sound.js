const StringUtil = require('../util/string-util');
const log = require('../util/log');

/**
 * Initialize a sound from an asset asynchronously.
 * @param {!object} sound - the Scratch sound object.
 * @property {string} md5 - the MD5 and extension of the sound to be loaded.
 * @property {Buffer} data - sound data will be written here once loaded.
 * @param {!Asset} soundAsset - the asset loaded from storage.
 * @param {!Runtime} runtime - Scratch runtime, used to access the storage module.
 * @param {Sprite} sprite - Scratch sprite to add sounds to.
 * @returns {!Promise} - a promise which will resolve to the sound when ready.
 */
const loadSoundFromAsset = function (sound, soundAsset, runtime, sprite) {
    sound.assetId = soundAsset.assetId;
    if (!runtime.audioEngine) {
        log.error('No audio engine present; cannot load sound asset: ', sound.md5);
        return Promise.resolve(sound);
    }
    return runtime.audioEngine.decodeSoundPlayer(Object.assign(
        {},
        sound,
        {data: soundAsset.data}
    )).then(soundPlayer => {
        sound.soundId = soundPlayer.id;
        // Set the sound sample rate and sample count based on the
        // the audio buffer from the audio engine since the sound
        // gets resampled by the audio engine
        const soundBuffer = soundPlayer.buffer;
        sound.rate = soundBuffer.sampleRate;
        sound.sampleCount = soundBuffer.length;

        if (sprite.soundBank !== null) {
            sprite.soundBank.addSoundPlayer(soundPlayer);
        }

        return sound;
    });
};

/**
 * Load a sound's asset into memory asynchronously.
 * @param {!object} sound - the Scratch sound object.
 * @property {string} md5 - the MD5 and extension of the sound to be loaded.
 * @property {Buffer} data - sound data will be written here once loaded.
 * @param {!Runtime} runtime - Scratch runtime, used to access the storage module.
 * @param {Sprite} sprite - Scratch sprite to add sounds to.
 * @returns {!Promise} - a promise which will resolve to the sound when ready.
 */
const loadSound = function (sound, runtime, sprite) {
    if (!runtime.storage) {
        log.error('No storage module present; cannot load sound asset: ', sound.md5);
        return Promise.resolve(sound);
    }
    const idParts = StringUtil.splitFirst(sound.md5, '.');
    const md5 = idParts[0];
    const ext = idParts[1].toLowerCase();
    return runtime.storage.load(runtime.storage.AssetType.Sound, md5, ext)
        .then(soundAsset => {
            sound.dataFormat = ext;
            return loadSoundFromAsset(sound, soundAsset, runtime, sprite);
        });
};

module.exports = {
    loadSound,
    loadSoundFromAsset
};
