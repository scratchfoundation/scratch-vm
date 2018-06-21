/**
 * Serialize all the assets of the given type ('sounds' or 'costumes')
 * in the provided runtime into an array of file descriptors.
 * A file descriptor is an object containing the name of the file
 * to be written and the contents of the file, the serialized asset.
 * @param {Runtime} runtime The runtime with the assets to be serialized
 * @param {string} assetType The type of assets to be serialized: 'sounds' | 'costumes'
 * @returns {Array<object>} An array of file descriptors for each asset
 */
const serializeAssets = function (runtime, assetType) {
    const targets = runtime.targets;
    const assetDescs = [];
    for (let i = 0; i < targets.length; i++) {
        const currTarget = targets[i];
        const currAssets = currTarget.sprite[assetType];
        for (let j = 0; j < currAssets.length; j++) {
            const currAsset = currAssets[j];
            const assetId = currAsset.assetId;
            const storage = runtime.storage;
            const storedAsset = storage.get(assetId);
            assetDescs.push({
                fileName: `${assetId}.${storedAsset.dataFormat}`,
                fileContent: storedAsset.data});
        }
    }
    return assetDescs;
};

/**
 * Serialize all the sounds in the provided runtime into an array of file
 * descriptors. A file descriptor is an object containing the name of the file
 * to be written and the contents of the file, the serialized sound.
 * @param {Runtime} runtime The runtime with the sounds to be serialized
 * @returns {Array<object>} An array of file descriptors for each sound
 */
const serializeSounds = function (runtime) {
    return serializeAssets(runtime, 'sounds');
};

/**
 * Serialize all the costumes in the provided runtime into an array of file
 * descriptors. A file descriptor is an object containing the name of the file
 * to be written and the contents of the file, the serialized costume.
 * @param {Runtime} runtime The runtime with the costumes to be serialized
 * @returns {Array<object>} An array of file descriptors for each costume
 */
const serializeCostumes = function (runtime) {
    return serializeAssets(runtime, 'costumes');
};

module.exports = {
    serializeSounds,
    serializeCostumes
};
