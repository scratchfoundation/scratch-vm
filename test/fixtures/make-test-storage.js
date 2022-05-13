const ScratchStorage = require('scratch-storage');

const ASSET_SERVER = 'https://cdn.assets.scratch.mit.edu/';
const PROJECT_SERVER = 'https://cdn.projects.scratch.mit.edu/';

/**
 * @param {Asset} asset - calculate a URL for this asset.
 * @returns {string} a URL to download a project file.
 */
const getProjectUrl = function (asset) {
    const assetIdParts = asset.assetId.split('.');
    const assetUrlParts = [PROJECT_SERVER, 'internalapi/project/', assetIdParts[0], '/get/'];
    if (assetIdParts[1]) {
        assetUrlParts.push(assetIdParts[1]);
    }
    return assetUrlParts.join('');
};

/**
 * @param {Asset} asset - calculate a URL for this asset.
 * @returns {string} a URL to download a project asset (PNG, WAV, etc.)
 */
const getAssetUrl = function (asset) {
    const assetUrlParts = [
        ASSET_SERVER,
        'internalapi/asset/',
        asset.assetId,
        '.',
        asset.dataFormat,
        '/get/'
    ];
    return assetUrlParts.join('');
};

/**
 * Construct a new instance of ScratchStorage and provide it with default web sources.
 * @returns {ScratchStorage} - an instance of ScratchStorage, ready to be used for tests.
 */
const makeTestStorage = function () {
    const storage = new ScratchStorage();
    const AssetType = storage.AssetType;
    storage.addWebStore([AssetType.Project], getProjectUrl);
    storage.addWebStore([AssetType.ImageVector, AssetType.ImageBitmap, AssetType.Sound], getAssetUrl);
    return storage;
};

module.exports = makeTestStorage;
