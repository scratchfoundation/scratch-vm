// import path from 'path';
// import { fileURLToPath } from 'url';
// import fs from 'fs';

// import PyatchWorker from '../../src/worker/pyatch-worker.mjs';

// import WorkerMessages from '../../src/worker/worker-messages.mjs'


// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const PATH_TO_PYODIDE = path.join(__dirname, '../../node_modules/pyodide');
// const PATH_TO_WORKER = path.join(__dirname, '../../src/worker/pyodide-web-worker.mjs');

// const pyatchWorker = new PyatchWorker(PATH_TO_WORKER, function (message) {
//     this._worker.postMessage({
//         id: WorkerMessages.FromVM.ResultValue,
//         token: message.token,
//         value: null,
//     }
// )});

// const loadResult = await pyatchWorker.loadPyodide(PATH_TO_PYODIDE);

// console.log(loadResult);

// const python_code = fs.readFileSync(path.join(__dirname, './python', 'single-target-move.py'), 'utf8');
// const target_arr = ['target1'];	

// const runResult = await pyatchWorker.run(python_code, target_arr);

// console.log("Run finished");
// console.log(runResult);

// pyatchWorker.terminate();

