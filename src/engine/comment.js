/**
 * @fileoverview
 * Object representing a Scratch Comment (block or workspace).
 */

const uid = require('../util/uid');
const cast = require('../util/cast');

class Comment {
    /**
     * @param {string} id Id of the variable.
     * @param {string} name Name of the variable.
     * @param {string} type Type of the variable, one of '' or 'list'
     * @param {boolean} isCloud Whether the variable is stored in the cloud.
     * @constructor
     */ /* TODO should the comment constructor take in an id? will we need this for sb3? */
    constructor (id, text, x, y, width, height, minimized) {
        this.id = id || uid();
        this.text = text;
        this.x = x;
        this.y = y;
        this.width = Math.max(cast.toNumber(width), Comment.MIN_WIDTH);
        this.height = Math.max(cast.toNumber(height), Comment.MIN_HEIGHT);
        this.minimized = minimized || false;
        this.blockId = null;
    }

    toXML () {
        return `<comment id="${this.id}" x="${this.x}" y="${
            this.y}" w="${this.width}" h="${this.height}" pinned="${
            this.blockId !== null}" minimized="${this.minimized}">${this.text}</comment>`;
    }

    // TODO choose min and defaults for width and height
    static get MIN_WIDTH () {
        return 20;
    }

    static get MIN_HEIGHT () {
        return 20;
    }

    static get DEFAULT_WIDTH () {
        return 100;
    }

    static get DEFAULT_HEIGHT () {
        return 100;
    }

}

module.exports = Comment;
