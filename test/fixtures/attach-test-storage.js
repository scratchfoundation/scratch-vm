var ScratchStorage = require('scratch-storage');

var ASSET_SERVER = 'https://cdn.assets.scratch.mit.edu/';
var PROJECT_SERVER = 'https://cdn.projects.scratch.mit.edu/';

/**
 * @param {Asset} asset - calculate a URL for this asset.
 * @returns {string} a URL to download a project file.
 */
var getProjectUrl = function (asset) {
    var assetIdParts = asset.assetId.split('.');
    var assetUrlParts = [PROJECT_SERVER, 'internalapi/project/', assetIdParts[0], '/get/'];
    if (assetIdParts[1]) {
        assetUrlParts.push(assetIdParts[1]);
    }
    return assetUrlParts.join('');
};

/**
 * @param {Asset} asset - calculate a URL for this asset.
 * @returns {string} a URL to download a project asset (PNG, WAV, etc.)
 */
var getAssetUrl = function (asset) {
    var assetUrlParts = [
        ASSET_SERVER,
        'internalapi/asset/',
        asset.assetId,
        '.',
        asset.assetType.runtimeFormat,
        '/get/'
    ];
    return assetUrlParts.join('');
};

/**
 * Construct a new instance of ScratchStorage, provide it with default web sources, and attach it to the provided VM.
 * @param {VirtualMachine} vm - the VM which will own the new ScratchStorage instance.
 */
var attachTestStorage = function (vm) {
    var storage = new ScratchStorage();
    var AssetType = ScratchStorage.AssetType;
    storage.addWebSource([AssetType.Project], getProjectUrl);
    storage.addWebSource([AssetType.ImageVector, AssetType.ImageBitmap, AssetType.Sound], getAssetUrl);
    vm.attachStorage(storage);
};

module.exports = attachTestStorage;
