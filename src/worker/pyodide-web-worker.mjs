/* eslint-disable no-func-assign */

import PrimProxy from './prim-proxy.js';
import WorkerMessages from './worker-messages.mjs';
import { loadPyodide } from 'pyodide';


/**
 * Mapping of message token to Promise resolve function.
 * @type {Object.<string, Promise>}
 * @private
 */
let _pendingTokens = {};

/**
 * Final token of the last run.
 * @type {string}
 */
let _lastToken = null;


async function _initPyodide(indexURL) {
  _postStatusMessage(WorkerMessages.ToVM.PyodideLoading)
  self.pyodide = await loadPyodide({
    indexURL: indexURL,
  });
  self.pyodide.setStderr({batched: _postError});
  _postStatusMessage(WorkerMessages.ToVM.PyodideLoaded)
}

// This is a shit function for this purpose, but it works for now.
function _getToken() {
  return Math.random().toString(36).substring(2);
}

function _resolvePendingToken(token, value) {
  if (_pendingTokens){
    if (_pendingTokens[token]) {
      _pendingTokens[token](value);
      delete _pendingTokens[token];
    }
  }
  if (token === _lastToken) {
    _postStatusMessage(WorkerMessages.ToVM.PythonFinished);
  }
}

function _postBlockOpMessage(targetID, op_code, args) {
  let token = _getToken();
  let id = WorkerMessages.ToVM.BlockOP
  return new Promise((resolve) => {
    _pendingTokens[token] = resolve;
    _lastToken = token;
    _postMessage(id, targetID, op_code, args, token)
    });
}

function _postStatusMessage(id) {
  _postMessage(id, null, null, null, null)
}

function _postError(error) {
  _postMessageError(WorkerMessages.ToVM.PythonError, error)
}

function _postMessageError(id, error) {
  _postWorkerMessage({id, error})
}

function _postMessage(id, targetID, opCode, args, token) {
  _postWorkerMessage({id, targetID, opCode, args, token});
}

function _postWorkerMessage(message) {
  return;
}

function _run(pythonScript,  targets) {

  // Don't need this line as we will be passing the bridge module in as a parameter as we execute 
  //await self.pyodide.loadPackagesFromImports(python);
  _postStatusMessage(WorkerMessages.ToVM.PythonLoading)

  // This is load each async function into the global scope of the pyodide instance
  self.pyodide.runPython(pythonScript);
  _postStatusMessage(WorkerMessages.ToVM.PythonRunning);

  let target_func_arr = []

  // TODO: Need to loop through each async function in the global scope and run them concurrently
  for(let global of self.pyodide.globals) {
    if (global.includes('target')) {
      target_func_arr.push(self.pyodide.globals.get(global))
    }
  }

  for(let target_func of target_func_arr) {
    target_func(new PrimProxy(targets[0], _postBlockOpMessage))
  }

}

function onVMMessage(event) {
  const { id, token, ...data } = event.data;
  if (id === WorkerMessages.FromVM.AsyncRun) {
    _run(data.python, data.targets);
  } else if (id === WorkerMessages.FromVM.ResultValue) {
    _resolvePendingToken(token, data.value);
  } else if (id === WorkerMessages.FromVM.VMConnected) {
    console.log('Undefined Functionality');
  } else if (id === WorkerMessages.FromVM.InitPyodide) {
    _initPyodide(data.pyodideURL);
  }

}

self.onmessage = onVMMessage;
_postWorkerMessage = postMessage;