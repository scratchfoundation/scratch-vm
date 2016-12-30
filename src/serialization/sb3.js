/**
 * @fileoverview
 * Partial implementation of a SB3 serializer and deserializer. Parses provided
 * JSON and then generates all needed scratch-vm runtime structures.
 */

var package = require('../../package.json');

/**
 * Serializes the specified VM runtime.
 * @param  {!Runtime} runtime VM runtime instance to be serialized.
 * @return {string}    Serialized runtime instance.
 */
var serialize = function (runtime) {
    // Fetch targets
    var obj = Object.create(null);
    obj.targets = runtime.targets;

    // Assemble metadata
    var meta = Object.create(null);
    meta.semver = '3.0.0';
    meta.vm = package.version;

    // Attach full user agent string to metadata if available
    meta.agent = null;
    if (typeof navigator !== 'undefined') meta.agent = navigator.userAgent;

    // Assemble payload and return
    obj.meta = meta;
    return obj;
};

/**
 * Deserializes the specified representation of a VM runtime and loads it into
 * the provided runtime instance.
 * @param  {string}  json    Stringified JSON representation of a VM runtime.
 * @param  {Runtime} runtime Runtime instance
 */
var deserialize = function (json, runtime) {

};

module.exports = {
    serialize: serialize,
    deserialize: deserialize
};
