/**
 * @fileoverview
 * Object representing a Scratch variable.
 */

class Variable {
    /**
     * @param {!string} name Name of the variable.
     * @param {(string|number)} value Value of the variable.
     * @param {boolean} isCloud Whether the variable is stored in the cloud.
     * @constructor
     */
    constructor (name, value, isCloud) {
        this.name = name;
        this.value = value;
        this.isCloud = isCloud;
    }

    toXML () {
        return `<variable type="">${this.name}</variable>`;
    }
}

module.exports = Variable;
