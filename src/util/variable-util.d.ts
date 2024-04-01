export = VariableUtil;
declare class VariableUtil {
    static _mergeVarRefObjects(accum: any, obj2: any): any;
    /**
     * Get all variable/list references in the given list of targets
     * in the project.
     * @param {Array.<Target>} targets The list of targets to get the variable
     * and list references from.
     * @param {boolean} shouldIncludeBroadcast Whether to include broadcast message fields.
     * @return {object} An object with variable ids as the keys and a list of block fields referencing
     * the variable.
     */
    static getAllVarRefsForTargets(targets: Array<Target>, shouldIncludeBroadcast: boolean): object;
    /**
     * Give all variable references provided a new id and possibly new name.
     * @param {Array<object>} referencesToUpdate Context of the change, the object containing variable
     * references to update.
     * @param {string} newId ID of the variable that the old references should be replaced with
     * @param {?string} optNewName New variable name to merge with. The old
     * variable name in the references being updated should be replaced with this new name.
     * If this parameter is not provided or is '', no name change occurs.
     */
    static updateVariableIdentifiers(referencesToUpdate: Array<object>, newId: string, optNewName: string | null): void;
}
