// import path from 'path';
// import { fileURLToPath } from 'url';

// import PyatchWorker from '../../src/worker/pyatch-worker.mjs';


// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const PATH_TO_PYODIDE = path.join(__dirname, '../../node_modules/pyodide');
// const PATH_TO_WORKER = path.join(__dirname, '../../src/worker/pyodide-web-worker.mjs');

// const pyatchWorker = new PyatchWorker(PATH_TO_WORKER, console.log);

// const loadResult = await pyatchWorker.loadPyodide(PATH_TO_PYODIDE);

// console.log(loadResult);

// const python_code = 'move(10)'
// const target_arr = ['target1'];

// const runResult = await pyatchWorker.run(python_code, target_arr);

// console.log(runResult);

// pyatchWorker.terminate();

