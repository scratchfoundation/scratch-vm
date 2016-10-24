/**
 * @fileoverview
 * Object representing a Scratch variable.
 */

/**
 * @param {!string} name Name of the variable.
 * @param {(string|Number)} value Value of the variable.
 * @param {boolean} isCloud Whether the variable is stored in the cloud.
 * @constructor
 */
var Variable = function (name, value, isCloud) {
    this.name = name;
    this.value = value;
    this.isCloud = isCloud;
};

module.exports = Variable;
