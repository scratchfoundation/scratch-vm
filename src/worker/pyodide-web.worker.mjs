/* eslint-disable no-restricted-syntax */
// /* eslint-disable no-func-assign */
import { loadPyodide, version as npmVersion } from "pyodide";
import { detect } from "detect-browser";
import PrimProxy from "./prim-proxy.js";
import WorkerMessages from "./worker-messages.mjs";

const browser = detect();

/**
 * Mapping of message token to Promise resolve function.
 * @type {Object.<string, Promise>}
 * @private
 */
const _pendingTokens = {};

/**
 * Final token of the last run.
 * @type {string}
 */
const _lastTokens = {};

/**
 * Inital pyodide state. This is saved so we can reset globals without having to completely reload pyodide which is very expensive
 * @type {Object}
 */
let _initPyodideState = null;

/**
 * Dict of threadId and threadFunc
 * @type {Object}
 */
let _threads = {};

/**
 * Dict of eventId to array of associated thread ids
 * @type {Object}
 */
let _eventMap = {};

const _postWorkerMessage = postMessage;

async function _webPyodideLoader(version = npmVersion) {
    const indexURL = `https://cdn.jsdelivr.net/pyodide/v${version}/full/`;
    const result = await loadPyodide({ indexURL });
    if (result.version !== version) {
        throw new Error(`loadPyodide loaded version ${result.version} instead of ${version}`);
    }
    return result;
}
async function _nodePyodideLoader() {
    const indexURL = "./node_modules/pyodide";
    const result = await loadPyodide({
        indexURL: indexURL,
    });
    return result;
}

function _postMessage(id, threadId, opCode, args, token) {
    _postWorkerMessage({ id, threadId, opCode, args, token });
}

function _postMessageError(id, error) {
    _postWorkerMessage({ id, error });
}

function _postStatusMessage(id) {
    _postMessage(id, null, null, null, null);
}

function _postThreadStatusMessage(id, threadId) {
    _postMessage(id, threadId, null, null, null);
}

function _postError(error) {
    _postMessageError(WorkerMessages.ToVM.PythonError, error);
}

async function _initPyodide() {
    _postStatusMessage(WorkerMessages.ToVM.PyodideLoading);
    if (browser.name === "node") {
        self.pyodide = await _nodePyodideLoader();
    } else {
        self.pyodide = await _webPyodideLoader();
    }
    _initPyodideState = self.pyodide._api.saveState();
    _postStatusMessage(WorkerMessages.ToVM.PyodideLoaded);
}

// This is a shit function for this purpose, but it works for now.
function _getToken() {
    return Math.random().toString(36).substring(2);
}

function _resolvePendingToken(token, value) {
    if (_pendingTokens) {
        if (_pendingTokens[token]) {
            _pendingTokens[token](value);
            delete _pendingTokens[token];
        }
    }
    if (_lastTokens[token]) {
        _postThreadStatusMessage(WorkerMessages.ToVM.ThreadDone, _lastTokens[token]);
    }
}

function _postBlockOpMessage(threadId, opCode, args) {
    const token = _getToken();
    const id = WorkerMessages.ToVM.BlockOP;
    return new Promise((resolve) => {
        _pendingTokens[token] = resolve;
        if (opCode === PrimProxy.opcodeMap.endThread) {
            _lastTokens[token] = threadId;
        }
        _postMessage(id, threadId, opCode, args, token);
    });
}

function _registerThreads(pythonScript, eventMap) {
    _eventMap = eventMap;
    // Don't need this line as we will be passing the bridge module in as a parameter as we execute
    // await self.pyodide.loadPackagesFromImports(python);
    // _postStatusMessage(WorkerMessages.ToVM.PythonLoading);

    // This will load the initial state of pyodide and reset the globals of pyodide. This is so previously added global functions are not re-run
    self.pyodide._api.restoreState(_initPyodideState);

    // This is load each async function into the global scope of the pyodide instance
    self.pyodide.runPython(pythonScript);
    // _postStatusMessage(WorkerMessages.ToVM.PythonRunning);

    _threads = {};

    for (const globalFunction of self.pyodide.globals) {
        if (globalFunction.includes("thread")) {
            const threadId = globalFunction.substring("thread_".length, globalFunction.length);
            _threads[threadId] = self.pyodide.globals.get(globalFunction);
        }
    }
    _postStatusMessage(WorkerMessages.ToVM.ThreadsRegistered);
}

function _startThreads(threadIds) {
    if (threadIds) {
        threadIds.forEach((threadId) => {
            const runThread = _threads[threadId];
            if (runThread) {
                const endThreadPost = (_threadId) => {
                    _postBlockOpMessage(_threadId, PrimProxy.opcodeMap.endThread, {});
                };
                runThread(new PrimProxy(threadId, _postBlockOpMessage)).then(endThreadPost.bind(null, threadId));
            } else {
                throw new Error(`Trying to start non existent thread with threadid ${threadId}`);
            }
        });
    }
}

function onVMMessage(event) {
    const id = event.data?.id;

    if (id === WorkerMessages.FromVM.RegisterThreads) {
        const { python } = event.data;
        _registerThreads(python);
    } else if (id === WorkerMessages.FromVM.ResultValue) {
        const { token, value } = event.data;
        _resolvePendingToken(token, value);
    } else if (id === WorkerMessages.FromVM.StartThreads) {
        const { threadIds } = event.data;
        _startThreads(threadIds);
    } else if (id === WorkerMessages.FromVM.VMConnected) {
        console.log("Undefined Functionality");
    } else if (id === WorkerMessages.FromVM.InitPyodide) {
        _initPyodide();
    } else {
        throw new Error(`${id} is not a valid worker message id`);
    }
}

self.onmessage = onVMMessage;
