import Worker from "web-worker";
import _ from "lodash";
import WorkerMessages from "./worker-messages.mjs";
import InterruptError from "./errors/interruptError.mjs";
import PrimProxy from "./prim-proxy.js";
import PyatchLinker from "../linker/pyatch-linker.mjs";
import uid from "../util/uid.mjs";

class PyatchWorker {
    constructor(errorCallback) {
        this._worker = new Worker(new URL("./pyodide-web.worker.mjs", import.meta.url), { type: "module" });

        this._worker.onmessage = this.handleWorkerMessage.bind(this);
        this._blockOPCallbackMap = {};
        this._errorCallback = errorCallback;
        this._threadErrorCallbackMap = {};

        this._threadInterruptMap = {};

        this._pyodidePromiseResolve = null;
        this._loadingPromiseMap = {};
        this._threadPromiseMap = {};

        this.pyatchLinker = new PyatchLinker();
    }

    handleWorkerMessage(event) {
        if (event.data.id === WorkerMessages.ToVM.PyodideLoaded) {
            this._pyodidePromiseResolve();
        } else if (event.data.id === WorkerMessages.ToVM.PromiseLoaded) {
            const { loadPromiseId } = event.data;
            this._loadingPromiseMap[loadPromiseId].resolve();
        } else if (event.data.id === WorkerMessages.ToVM.BlockOP) {
            const { threadId, opCode, args, token } = event.data;
            this._blockOPCallbackMap[threadId](opCode, args).then((result) => {
                this.postResultValue(result, token);
            });
        } else if (event.data.id === WorkerMessages.ToVM.ThreadDone) {
            const { threadId } = event.data;
            this._threadPromiseMap[threadId].resolve();
        } else if (event.data.id === WorkerMessages.ToVM.PythonError) {
            const { threadId, message, lineNumber, type } = event.data;
            if (this._threadErrorCallbackMap[threadId]) {
                this._threadErrorCallbackMap[threadId](threadId, message, lineNumber, type);
                if (type === "CompileTimeError") {
                    const { loadPromiseId } = event.data;
                    this._loadingPromiseMap[loadPromiseId].reject();
                }
            } else {
                this._errorCallback(threadId, message, lineNumber);
            }
        }
    }

    async loadPyodide() {
        const initMessage = {
            id: WorkerMessages.FromVM.InitPyodide,
            interruptBuffer: this._pythonInterruptBuffer,
        };
        await new Promise((resolve, reject) => {
            this._pyodidePromiseResolve = resolve;
            this._worker.postMessage(initMessage);
            setTimeout(() => {
                reject(new Error("Pyodide load timed out."));
            }, 10000);
        });
    }

    async loadWorker() {
        await this.loadPyodide();
        await this.loadInterruptFunction();
    }

    async loadGlobal(script, threadId = "") {
        await this._worker;
        const loadPromiseId = uid();
        const message = {
            id: WorkerMessages.FromVM.LoadGlobal,
            script,
            loadPromiseId,
            threadId,
        };

        return new Promise((resolve, reject) => {
            this._loadingPromiseMap[loadPromiseId] = { resolve, reject };
            this._worker.postMessage(message);
        });
    }

    async loadInterruptFunction() {
        const script = this.pyatchLinker.generateInterruptSnippet();
        await this.loadGlobal(script);
    }

    async loadThread(threadId, script, globalVaraibles) {
        const wrappedScript = this.pyatchLinker.generatePython(threadId, script, globalVaraibles);
        const transformError = this.pyatchLinker.generateErrorTransform(script, globalVaraibles);
        this._threadErrorCallbackMap[threadId] = (...args) => this._errorCallback(...transformError(args[0], args[1], args[2]), args[3]);
        let success = true;
        try {
            await this.loadGlobal(wrappedScript, threadId);
        } catch (e) {
            success = false;
        }
        return success;
    }

    async loadGlobalVariable(name, value) {
        const script = this.pyatchLinker.generateGlobalsAssignments({ [name]: value });
        await this.loadGlobal(script);
    }

    async startThread(threadId, blockOpertationCallback) {
        const threadPromise = new Promise((resolve, reject) => {
            this._threadPromiseMap[threadId] = { resolve, reject };
        });

        this._blockOPCallbackMap[threadId] = blockOpertationCallback;

        const message = {
            id: WorkerMessages.FromVM.StartThread,
            threadId,
        };
        this._worker.postMessage(message);
        await threadPromise;
    }

    async stopThread(threadId) {
        const endThreadPromise = this._threadPromiseMap[threadId];
        await endThreadPromise;
    }

    /**
     * Post a ResultValue message to a worker in reply to a particular message.
     * The outgoing message's reply token will be copied from the provided message.
     * @param {object} message The originating message to which this is a reply.
     * @param {*} value The value to send as a result.
     * @private
     */
    postResultValue(value, token) {
        this._worker.postMessage({
            id: WorkerMessages.FromVM.ResultValue,
            value,
            token,
        });
    }

    async terminate() {
        this._worker.terminate();
    }

    postMessage(message) {
        this._worker.postMessage(message);
    }
}

export default PyatchWorker;
