import Worker from "web-worker";
import WorkerMessages from "./worker-messages.mjs";

class PyatchWorker {
    constructor(blockOPCallback) {
        this._worker = new Worker(new URL("./pyodide-web.worker.mjs", import.meta.url), { type: "module" });
        this._worker.onmessage = this.handleWorkerMessage;
        this._worker.onerror = this.handleWorkerError;

        this._blockOPCallback = blockOPCallback.bind(this);

        this._pyodidePromiseResolve = null;
        this._registerThreadsPromise = {
            resolve: null,
            reject: null,
        };

        this._eventMap = null;
        this._eventPromiseResolveMap = {};
    }

    handleWorkerMessage(event) {
        if (event.data.id === WorkerMessages.ToVM.PyodideLoaded) {
            this._pyodidePromiseResolve();
        } else if (event.data.id === WorkerMessages.ToVM.ThreadsRegistered) {
            this._registerThreadsPromise.resolve();
        } else if (event.data.id === WorkerMessages.ToVM.PythonCompileTimeError) {
            this._registerThreadsPromise.reject(event.data.error);
        } else if (event.data.id === WorkerMessages.ToVM.BlockOP) {
            this._blockOPCallback(event.data);
        } else if (event.data.id === WorkerMessages.ToVM.ThreadDone) {
            Object.keys(this._eventMap).forEach((eventId) => {
                const eventThreads = this._eventMap[eventId];
                eventThreads.includes(event.data.threadId);
                delete this._eventMap[eventId];
                if (!eventThreads.length) {
                    const resolve = this._eventPromiseResolveMap[eventId];
                    resolve();
                }
            });
        }
    }

    handleWorkerError(event) {
        throw new Error(`Worker error with event: ${event}`);
    }

    async loadPyodide() {
        const initMessage = {
            id: WorkerMessages.FromVM.InitPyodide,
        };
        return new Promise((resolve, reject) => {
            this._pyodidePromiseResolve = resolve;
            this._worker.postMessage(initMessage);
            setTimeout(() => {
                reject(new Error("Pyodide load timed out."));
            }, 10000);
        });
    }

    async registerThreads(pythonScript, eventMap, token = "") {
        await this._worker;
        this._eventMap = eventMap;

        const message = {
            id: WorkerMessages.FromVM.RegisterThreads,
            token: token,
            python: String(pythonScript),
            eventMap: eventMap,
        };

        return new Promise((resolve, reject) => {
            this._worker.postMessage(message);
            setTimeout(() => {
                reject(new Error("Python run timed out."));
            }, 10000);
        });
    }

    async startHats(hat, option) {
        if (!this._eventMap) {
            throw new Error("Must register threads before running startHats");
        }
        const message = {
            id: WorkerMessages.FromVM.StartHats,
            eventId: hat,
            options: option,
        };
        return new Promise((resolve) => {
            this._eventPromiseResolveMap[hat] = resolve;
            this._worker.postMessage(message);
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
