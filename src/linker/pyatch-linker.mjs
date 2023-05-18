import linkConstants from "./linker-constants.mjs";
import PrimProxy from "../worker/prim-proxy.js";

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
    generateAsyncFuncHeader(targetId) {
        return `${linkConstants.async_func_header + targetId}(${linkConstants.vm_proxy}):\n`;
    }

    /**
     * Generates comment header that signifies the beginning of a target's threads
     * @param {string} targetId - The id of the target.
     * @returns {string} - comment header
     */
    generateTargetHeader(targetId) {
        return `## -- ${targetId} -- ##\n\n`;
    }

    /**
     * Generates the line of python code to unpack all the pyatch api primitives
     * @returns {string} - the line of python
     */
    registerProxyPrims(funcCode) {
        // let prims = PyatchAPI.getPrimNames();
        const prims = Object.keys(PrimProxy.opcodeMap);

        let registerPrimsCode = "";
        prims.forEach((prim) => {
            if (funcCode.includes(`${prim}(`)) {
                registerPrimsCode += `${linkConstants.python_tab_char + prim} = ${linkConstants.vm_proxy}.${prim}\n`;
            }
        });

        return registerPrimsCode;
    }

    /**
     * Generate the fully linked executable python code.
     * @param {Object} threadsCode - Dict with thread id as key and code.
     *
     */
    generatePython(threadsCode) {
        let codeString = "";

        const threadIds = [];

        Object.keys(threadsCode).forEach((id) => {
            threadIds.push(id);

            const threadCode = threadsCode[id];

            const code = threadCode.replaceAll("\n", `\n${linkConstants.python_tab_char}`);
            const header = this.generateAsyncFuncHeader(id);
            const registerPrimsCode = this.registerProxyPrims(threadCode);
            codeString += `${header + registerPrimsCode + linkConstants.python_tab_char + code}\n\n`;
        });

        return [threadIds, codeString];
    }
}
export default PyatchLinker;
