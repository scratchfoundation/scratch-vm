import Worker from "web-worker";
import _ from "lodash";
import WorkerMessages from "./worker-messages.mjs";
import InterruptError from "./errors/interruptError.mjs";
import PrimProxy from "./prim-proxy.js";
import PyatchLinker from "../linker/pyatch-linker.mjs";

class PyatchWorker {
    constructor(blockOPCallback) {
        this._worker = new Worker(new URL("./pyodide-web.worker.mjs", import.meta.url), { type: "module" });

        this._worker.onmessage = this.handleWorkerMessage.bind(this);
        this._worker.onerror = this.handleWorkerError.bind(this);
        this._blockOPCallback = blockOPCallback.bind(this);

        // eslint-disable-next-line no-undef
        this._pythonInterruptBuffer = new Uint8Array(new SharedArrayBuffer(1));

        this._pyodidePromiseResolve = null;
        this._loadingThreadPromiseMap = {};
        this._threadPromiseMap = {};

        this.pyatchLinker = new PyatchLinker();
    }

    handleWorkerMessage(event) {
        if (event.data.id === WorkerMessages.ToVM.PyodideLoaded) {
            this._pyodidePromiseResolve();
        } else if (event.data.id === WorkerMessages.ToVM.ThreadLoaded) {
            const { threadId } = event.data;
            this._loadingThreadPromiseMap[threadId].resolve();
        } else if (event.data.id === WorkerMessages.ToVM.PythonCompileTimeError) {
            this._loadingThreadPromiseMap.reject(event.data.error);
        } else if (event.data.id === WorkerMessages.ToVM.BlockOP) {
            this._blockOPCallback(event.data);
        } else if (event.data.id === WorkerMessages.ToVM.ThreadDone) {
            const { threadId } = event.data;
            this._threadPromiseMap[threadId].resolve();
        }
    }

    handleWorkerError(event) {
        throw new Error(`Worker error with event: ${event}`);
    }

    async loadPyodide() {
        const initMessage = {
            id: WorkerMessages.FromVM.InitPyodide,
            interruptBuffer: this._pythonInterruptBuffer,
        };
        return new Promise((resolve, reject) => {
            this._pyodidePromiseResolve = resolve;
            this._worker.postMessage(initMessage);
            setTimeout(() => {
                reject(new Error("Pyodide load timed out."));
            }, 10000);
        });
    }

    async loadThread(threadId, script) {
        const wrappedScript = this.pyatchLinker.generatePython(threadId, script);

        await this._worker;

        const message = {
            id: WorkerMessages.FromVM.LoadThread,
            script: wrappedScript,
            threadId: threadId,
        };

        return new Promise((resolve, reject) => {
            this._loadingThreadPromiseMap[threadId] = { resolve, reject };
            this._worker.postMessage(message);
        });
    }

    async startThread(threadId, threadInterruptBuffer) {
        // eslint-disable-next-line no-param-reassign
        threadInterruptBuffer[0] = 0;
        const threadPromise = new Promise((resolve, reject) => {
            this._threadPromiseMap[threadId] = { resolve, reject };
        });

        const message = {
            id: WorkerMessages.FromVM.StartThread,
            threadId,
            threadInterruptBuffer: threadInterruptBuffer,
        };
        this._worker.postMessage(message);
        await threadPromise;
    }

    async stopThread(threadId, threadInterruptBuffer) {
        // eslint-disable-next-line no-param-reassign
        threadInterruptBuffer[0] = 2;
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
    postResultValue(message, value) {
        this._worker.postMessage({
            id: WorkerMessages.FromVM.ResultValue,
            value: value,
            token: message.token,
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
