/* eslint-disable */
import {PyodideStates, PYODIDE_INDEX_URL} from './pyodideConstants'
import { Bridge } from require('pyatch-api');
import { WorkerMessages } from './WorkerMessages';

importScripts(PYODIDE_INDEX_URL + "pyodide.js");

const context = {
  bridge: Bridge,
}

async function loadPyodideAndPackages() {
  self.pyodide = await loadPyodide();
  // await self.pyodide.loadPackage(["numpy", "pytz"]);
}
let pyodideReadyPromise = loadPyodideAndPackages();

self.onmessage = _onVMMessage;

/**
 * Mapping of message token to Promise resolve function.
 * @type {Object.<string, Promise>}
 * @private
 */
self._pendingTokens = {};

// ---------------Internal Funcitons-------------

function _initWorker() {
  console.log("Initializing worker...");
}

// This is a shit function for this purpose, but it works for now.
function _getToken() {
  return Math.random().toString(36).substring(2);
}

function _resolvePendingToken(token, value) {
  if (self._pendingTokens[token]) {
    self._pendingTokens[token](value);
    delete self._pendingTokens[token];
  }
}

function _postBlockOpMessage(targetID, op_code, args) {
    return new Promise(function (resolve) {
        var token = self._getToken();
        self._pendingTokens[token] = resolve;
        self._postMessage(WorkerMessages.ToVM.BlockOP, targetID, op_code, args, token)
    });
}

function _postStatusMessage(id) {
  _postMessage(id, null, null, null, null)
}

function _postMessage(id, targetID, op_code, args, token) {
  self.postMessage({ id, targetID, op_code, args, token });
}

async function _asyncRun(pythonScript) {
  _postStatusMessage(WorkerMessages.ToVM.PythonLoading)
  for (const key of Object.keys(context)) {
    self[key] = context[key];
  }
  try {
    // Don't need this line as we will be passing the bridge module in as a parameter as we execute 
    //await self.pyodide.loadPackagesFromImports(python);
    _postStatusMessage(WorkerMessages.ToVM.PythonLoading)
    // This is load each async function into the global scope of the pyodide instance
    let results = await self.pyodide.runPythonAsync(python);
    _postStatusMessage(WorkerMessages.ToVM.PythonRunning);
    // TODO: Need to loop through each async function in the global scope and run them concurrently
  } catch (error) {
    self.postMessage({ error: error.message, id });
  }
}

_onVMMessage = (event) => {
  const { id, token, ...data } = event.data;
  if (id === WorkerMessages.FromVM.AsyncRun) {
    _asyncRun(data.python);
  } else if (id === WorkerMessages.FromVM.ResultValue) {
    _resolvePendingToken(token, data.value);
  } else if (id === WorkerMessages.FromVM.VMConnected) {
    _initWorker();
  }
}