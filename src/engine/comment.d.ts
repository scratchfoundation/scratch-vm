export = Comment;
declare class Comment {
    static get MIN_WIDTH(): number;
    static get MIN_HEIGHT(): number;
    static get DEFAULT_WIDTH(): number;
    static get DEFAULT_HEIGHT(): number;
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
    constructor(id: string, text: string, x: number, y: number, width: number, height: number, minimized: boolean);
    id: string;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    minimized: boolean;
    blockId: any;
    toXML(): string;
}
