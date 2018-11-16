/**
 * @fileoverview
 * Object representing a Scratch Comment (block or workspace).
 */

const uid = require('../util/uid');
const xmlEscape = require('../util/xml-escape');

class Comment {
    /**
     * @param {string} id Id of the comment.
     * @param {string} text Text content of the comment.
     * @param {number} x X position of the comment on the workspace.
     * @param {number} y Y position of the comment on the workspace.
     * @param {number} width The width of the comment when it is full size.
     * @param {number} height The height of the comment when it is full size.
     * @param {boolean} minimized Whether the comment is minimized.
     * @constructor
     */
    constructor (id, text, x, y, width, height, minimized) {
        this.id = id || uid();
        this.text = text;
        this.x = x;
        this.y = y;
        this.width = Math.max(Number(width), Comment.MIN_WIDTH);
        this.height = Math.max(Number(height), Comment.MIN_HEIGHT);
        this.minimized = minimized || false;
        this.blockId = null;
    }

    toXML () {
        return `<comment id="${this.id}" x="${this.x}" y="${
            this.y}" w="${this.width}" h="${this.height}" pinned="${
            this.blockId !== null}" minimized="${this.minimized}">${xmlEscape(this.text)}</comment>`;
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
