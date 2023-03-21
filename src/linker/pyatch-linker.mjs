import linkConstants from './linker-constants.mjs';

/**
 * @fileoverview
 * @author Elliot Roe
 * 
 * Class for linking the raw python code inputted through the editor for each target to template that can be run in a single web worker.
 * This code is almost definitely not safe. Eventually, each targets python code will be executed in a separate worker.
 */
class PyatchLinker {
    constructor() {
        this._baseImports = [];
    }

    /**
     * Set the base imports for the linker.
     * @param {string[]} imports
     * @returns {void}
     */
    set setBaseImports(imports) {
        this._baseImports = imports;
    }

    /**
     * Generates the method header for a target aysnc function.
     * @param {string} targetId - The id of the target.
     * @returns {string} - The method header for the target async function.
     */
    generateAsyncFuncHeader(targetId, postfix = '0') {
        return linkConstants.async_func_header + targetId + '_' + postfix + '(' + linkConstants.bridge_param + '):\n';
    }

    /**
     * Generates comment header that signifies the beginning of a target's threads
     * @param {string} targetId - The id of the target.
     * @returns {string} - comment header
     */
    generateTargetHeader(targetId) {
        return "## -- " + targetId + " -- ##\n\n";
    }

    /**
     * Generates the line of python code to unpack all the pyatch api primitives
     * @returns {string} - the line of python
     */
    generateApiUnpackLine() {
        //let prims = PyatchAPI.getPrimNames();
        let prims = ["say", "move", "think"]

        let inner = prims.join();
        let unpackLine = "[" + inner + "] = " + linkConstants.bridge_param + "\n";

        return unpackLine;
    }

    /**
     * Generate the fully linked executable python code.
     * @param {Object} targets - The target id and python code.
     * @returns {string} - The fully linked python code.
     * 
     * @example
     * const linker = new PyatchLinker();
     * const target1 = {
     *    id: 'target1',
     *   code: ['print("Hello World!")', 'print("Hello World 2!")']
     * }
     * const target2 = {
     *    id: 'target2',
     *   code: ['print("Hello Universe!")', 'print("Hello Universe 2!")']
     * }
     * const linkedCode = linker.generatePython(target1, target2);
     */
    generatePython(...targets) {
        const imports = this._baseImports;

        let codeString = "";

        for (const target of targets) {
            const targetId = target.id;
            const targetCode = target.code;

            codeString += this.generateTargetHeader(targetId);

            for (let i = 0; i < targetCode.length; i++) {
                const code = targetCode[i].replace('\n', '\n' + linkConstants.python_tab_char);
                const header = this.generateAsyncFuncHeader(targetId, i.toString());
                const unpackLine = this.generateApiUnpackLine();
                codeString += header + linkConstants.python_tab_char + unpackLine + linkConstants.python_tab_char + code + '\n\n';
            }
        }

       return codeString; 
    }
}
export default PyatchLinker;