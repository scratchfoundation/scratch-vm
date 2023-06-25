import _ from "lodash";
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
    registerProxyPrims(functionNames) {
        let registerPrimsCode = "";
        functionNames.forEach((name) => {
            registerPrimsCode += `${linkConstants.python_tab_char + name} = ${linkConstants.vm_proxy}.${name}\n`;
        });

        return registerPrimsCode;
    }

    /**
     * Checks if the given functions are called within the provided Python code.
     *
     * @param {string[]} functionNames - An array of function names to check.
     * @param {string} pythonCode - A string containing the Python code to search for function calls.
     * @returns {string[]} - An array of function names that were called within the Python code.
     */
    getFunctionCalls(functionNames, pythonCode) {
        const calledFunctions = [];
        functionNames.forEach((functionName) => {
            const regex = new RegExp(`(^|\\W)${functionName}\\(`);
            if (regex.test(pythonCode)) {
                calledFunctions.push(functionName);
            }
        });
        return calledFunctions;
    }

    /**
     * Generates the line of python code to unpack all the pyatch api primitives
     * @returns {string} - the line of python
     */
    generateGlobalsAssignments(globalVars) {
        let snippet = "";
        Object.keys(globalVars).forEach((name) => {
            const value = globalVars[name];
            const valueValidated = typeof value !== "number" ? `'${value}'` : `${value}`;
            snippet += `${name} = ${valueValidated}\n`;
        });

        return snippet;
    }

    /**
     * Generates the line of python code to unpack all the pyatch api primitives
     * @returns {string} - the line of python
     */
    registerGlobalsImports(globalVariables) {
        let snippet = "";
        if (globalVariables) {
            Object.keys(globalVariables).forEach((name) => {
                snippet += `${linkConstants.python_tab_char}global ${name}\n`;
            });
        }

        return snippet;
    }

    /**
     * Adds the "await" keyword before certain function names in the provided Python code.
     *
     * @param {string} pythonCode - A string containing the Python code to modify.
     * @param {string[]} functionNames - An array of function names to add "await" before.
     * @returns {string} - The modified Python code with "await" added before specified function names.
     */
    addAwaitToPythonFunctions(pythonCode, functionNames) {
        const regex = new RegExp(`(?<!\\bawait\\s*)\\b(${functionNames.join("|")})\\(`, "g");
        return pythonCode.replace(regex, "await $&");
    }

    wrapThreadCode(threadId, script, globalVariables) {
        const calledPatchPrimitiveFunctions = this.getFunctionCalls(Object.keys(PrimProxy.opcodeMap), script);

        const passedCode = script || "pass";
        const awaitedCode = this.addAwaitToPythonFunctions(passedCode, calledPatchPrimitiveFunctions);
        const tabbedCode = awaitedCode.replaceAll("\n", `\n${linkConstants.python_tab_char}`);

        const header = this.generateAsyncFuncHeader(threadId);
        const registerPrimsSnippet = this.registerProxyPrims(calledPatchPrimitiveFunctions);
        const registerGlobalsImports = this.registerGlobalsImports(globalVariables);

        return `${header + registerGlobalsImports + registerPrimsSnippet + linkConstants.python_tab_char + tabbedCode}\n\n`;
    }

    /**
     * BAD FUNCTION PLEASE REFACTOR FOR FALL MVP
     */
    generateInterruptSnippet() {
        return `def throw_interrupt_error():\n${linkConstants.python_tab_char}raise RuntimeError("Thread Interrupted")\n\n`;
    }

    /**
     * Generate the fully linked executable python code.
     * @param {Object} executionObject - Dict with thread id as key and code.
     *
     */
    generatePython(threadId, script, globalVariables) {
        return this.wrapThreadCode(threadId, script, globalVariables);
    }
}
export default PyatchLinker;
