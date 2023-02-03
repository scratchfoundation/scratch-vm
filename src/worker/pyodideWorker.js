/*
* This is object that the pyatchVM will use to communicate with the Pyodide worker
* ACTUALLY I don't think this file is needed as the vm handles all the communication right now
*/
class PyodideWorker {
  
  static curId = 0;

  constructor() {
    console.log("PyodideWorker constructor ran");

    this.worker = new Worker(new URL('./pyodideWebWorker.js', import.meta.url));

    this.callbacks = {};

    this.id = (PyodideWorker.curId + 1) % Number.MAX_SAFE_INTEGER;
    PyodideWorker.curId++;
  }



  halt() {
    this.worker.terminate();
  }
}

const pyodideWorker = new PyodideWorker();

export { pyodideWorker };