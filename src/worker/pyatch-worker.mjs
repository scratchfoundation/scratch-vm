import WorkerMessages from './worker-messages.mjs';
import Worker from 'web-worker';

class PyatchWorker {
    constructor(pathToWorker, blockOPCallback) {
        const url = new URL(pathToWorker, import.meta.url);
        this._worker = new Worker(url, { type: 'module' });
        this._blockOPCallback = blockOPCallback.bind(this);
    }
    
    async loadPyodide(indexURL) {
        const initMessage = {
            id: WorkerMessages.FromVM.InitPyodide,
            pyodideURL: indexURL,
        }
        return new Promise((resolve, reject) => {
            this._worker.onmessage = (event) => {
                if (event.data.id === WorkerMessages.ToVM.PyodideLoaded) {
                    resolve(WorkerMessages.ToVM.PyodideLoaded);
                }
            };
            this._worker.onerror = (event) => {
                reject(event.error);
            };
            this._worker.postMessage(initMessage);
            setTimeout(() => {
                reject(new Error('Pyodide load timed out.'));
            }, 10000);
        });
    }

    async run(pythonScript, targets, token='') {
        const message = {
            id: WorkerMessages.FromVM.AsyncRun,
            token: token,
            python: String(pythonScript),
            targets: targets,
        }
        // console.log(message);
        return new Promise((resolve, reject) => {
            let pythonRunning = false;
            this._worker.onmessage = (event) => {
                // console.log('event', event);
                if (event.data.id === WorkerMessages.ToVM.BlockOP) {
                    this._blockOPCallback(event.data);
                } else if (event.data.id === WorkerMessages.ToVM.PythonFinished) {
                    resolve(WorkerMessages.ToVM.PythonFinished);
                } else if (event.data.id === WorkerMessages.ToVM.PythonRunning) {
                    pythonRunning = true;
                } else if (event.data.id === WorkerMessages.ToVM.PythonError) {
                    reject(event.data.error);
                } else {
                    // console.log('Unknown message from worker', event.data);
                }
            };
            this._worker.onerror = (event) => {
                reject(event.error);
            };
            this._worker.postMessage(message);
            setTimeout(() => {
                if (!pythonRunning) {
                    reject(new Error('Python run timed out.'));
                }
            }, 10000);
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