/**
 * @fileoverview
 * Object representing a Scratch list.
 */

 /**
  * @param {!string} name Name of the list.
  * @param {Array} contents Contents of the list, as an array.
  * @constructor
  */
class List {
    constructor (name, contents) {
        this.name = name;
        this.contents = contents;
    }
}

module.exports = List;
