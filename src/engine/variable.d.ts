export = Variable;
declare class Variable {
    /**
     * Type representation for scalar variables.
     * This is currently represented as ''
     * for compatibility with blockly.
     * @const {string}
     */
    static get SCALAR_TYPE(): string;
    /**
     * Type representation for list variables.
     * @const {string}
     */
    static get LIST_TYPE(): string;
    /**
     * Type representation for list variables.
     * @const {string}
     */
    static get BROADCAST_MESSAGE_TYPE(): string;
    /**
     * @param {string} id Id of the variable.
     * @param {string} name Name of the variable.
     * @param {string} type Type of the variable, one of '' or 'list'
     * @param {boolean} isCloud Whether the variable is stored in the cloud.
     * @constructor
     */
    constructor(id: string, name: string, type: string, isCloud: boolean);
    id: string;
    name: string;
    type: string;
    isCloud: boolean;
    value: string | number | any[];
    toXML(isLocal: any): string;
}
