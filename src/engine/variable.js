/**
 * @fileoverview
 * Object representing a Scratch variable.
 */

const uid = require('../util/uid');

class Variable {
    /**
     * @param {string} id Id of the variable.
     * @param {string} name Name of the variable.
     * @param {(string|number)} value Value of the variable.
     * @param {boolean} isCloud Whether the variable is stored in the cloud.
     * @constructor
     */
    constructor (id, name, value, isCloud, type) {
        this.id = id || uid();
        this.name = name;
        this.value = value;
        this.isCloud = isCloud;
        this.type = type || '';
    }

    toXML () {
        return `<variable type="${this.type}" id="${this.id}">${this.name}</variable>`;
    }
}

module.exports = Variable;
