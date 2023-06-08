import Worker from "web-worker";
import _ from "lodash";
import WorkerMessages from "./worker-messages.mjs";

class PyatchWorker {
    constructor(blockOPCallback) {
        this._worker = new Worker(new URL("./pyodide-web.worker.mjs", import.meta.url), { type: "module" });

        this._worker.onmessage = this.handleWorkerMessage.bind(this);
        this._worker.onerror = this.handleWorkerError.bind(this);
        this._blockOPCallback = blockOPCallback.bind(this);

        this._pyodidePromiseResolve = null;
        this._registerThreadsPromise = {
            resolve: null,
            reject: null,
        };

        this._eventMap = null;
        this._eventPromiseResolveMap = {};
        this._threadPromiseResolveMap = {};
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
            this._threadPromiseResolveMap[event.data.threadId]();
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
        this._eventMap = _.cloneDeep(eventMap);

        const message = {
            id: WorkerMessages.FromVM.RegisterThreads,
            token: token,
            python: String(pythonScript),
        };

        return new Promise((resolve, reject) => {
            this._registerThreadsPromise.resolve = resolve;
            this._registerThreadsPromise.reject = reject;
            this._worker.postMessage(message);
        });
    }

    async startHats(hat, option) {
        if (!this._eventMap) {
            throw new Error("Must register threads before running startHats");
        }
        if (hat) {
            let threadIds = this._eventMap[hat];
            if (threadIds) {
                if (option) {
                    threadIds = threadIds[option];
                }
                const threadPromises = [];
                threadIds.forEach((id) => {
                    threadPromises.push(
                        new Promise((resolve) => {
                            this._threadPromiseResolveMap[id] = resolve;
                        })
                    );
                });
                const message = {
                    id: WorkerMessages.FromVM.StartThreads,
                    threadIds: threadIds,
                    options: option,
                };
                this._worker.postMessage(message);
                await Promise.all(threadPromises);
            }
        }
    }

    async terminate() {
        this._worker.terminate();
    }

    postMessage(message) {
        this._worker.postMessage(message);
    }
}

export default PyatchWorker;
