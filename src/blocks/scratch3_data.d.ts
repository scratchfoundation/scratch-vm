export = Scratch3DataBlocks;
declare class Scratch3DataBlocks {
    /**
     * Type representation for list variables.
     * @const {number}
     */
    static get LIST_ITEM_LIMIT(): number;
    constructor(runtime: any);
    /**
     * The runtime instantiating this block package.
     * @type {Runtime}
     */
    runtime: Runtime;
    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives(): object<string, Function>;
    getVariable(args: any, util: any): any;
    setVariableTo(args: any, util: any): void;
    changeVariableBy(args: any, util: any): void;
    changeMonitorVisibility(id: any, visible: any): void;
    showVariable(args: any): void;
    hideVariable(args: any): void;
    showList(args: any): void;
    hideList(args: any): void;
    getListContents(args: any, util: any): any;
    addToList(args: any, util: any): void;
    deleteOfList(args: any, util: any): void;
    deleteAllOfList(args: any, util: any): void;
    insertAtList(args: any, util: any): void;
    replaceItemOfList(args: any, util: any): void;
    getItemOfList(args: any, util: any): any;
    getItemNumOfList(args: any, util: any): number;
    lengthOfList(args: any, util: any): any;
    listContainsItem(args: any, util: any): boolean;
}
