let _TextEncoder;
if (typeof TextEncoder === 'undefined') {
    _TextEncoder = import('text-encoding').TextEncoder;
} else {
    /* global TextEncoder */
    _TextEncoder = TextEncoder;
}
import EventEmitter from 'events';

import Runtime from './engine/runtime.mjs';

import 'canvas-toBlob';

import PyatchLinker from './linker/pyatch-linker.mjs';

import WorkerMessages from './worker/worker-messages.mjs';

const RESERVED_NAMES = ['_mouse_', '_stage_', '_edge_', '_myself_', '_random_'];

const CORE_EXTENSIONS = [
    // 'motion',
    // 'looks',
    // 'sound',
    // 'events',
    // 'control',
    // 'sensing',
    // 'operators',
    // 'variables',
    // 'myBlocks'
];

/**
 * Handles connections between blocks, stage, and extensions.
 * @constructor
 */
export default class VirtualMachine extends EventEmitter {

    constructor (pathToPyodide, pathToWorker) {
        super();

        /**
         * VM runtime, to store blocks, I/O devices, sprites/targets, etc.
         * @type {!Runtime}
         */
        this.runtime = new Runtime();

        this.pyatchWorker = null;
        this._initWorker(pathToPyodide, pathToWorker);

        this.pyatchLinker = new PyatchLinker();
    }

    _initWorker(pathToPyodide, pathToWorker) {

        const initMessage = {
            id: WorkerMessages.FromVM.InitPyodide,
            pyodideURL: pathToPyodide,
        }

        const url = new URL(pathToWorker, import.meta.url);
        this.pyatchWorker = new Worker(url, { type: 'module' });  
        
        this.pyatchWorker.onmessage = this._onWorkerMessage;
        this.pyatchWorker.postMessage(initMessage);
    }

    /**
     * Start running the VM - do this before anything else.
     */
    start () {
        this.runtime.start();
    }

    /**
     * Quit the VM, clearing any handles which might keep the process alive.
     * Do not use the runtime after calling this method. This method is meant for test shutdown.
     */
    quit () {
        this.runtime.quit();
    }

    /**
     * "Green flag" handler - start all threads starting with a green flag.
     */
    greenFlag () {
        this.runtime.greenFlag();
    }

    /**
     * Stop all threads and running activities.
     */
    stopAll () {
        this.runtime.stopAll();
    }

    /**
     * Clear out current running project data.
     */
    clear () {
        this.runtime.dispose();
    }

    /**
     * Set the audio engine for the VM/runtime
     * @param {!AudioEngine} audioEngine The audio engine to attach
     */
    attachAudioEngine (audioEngine) {
        this.runtime.attachAudioEngine(audioEngine);
    }

    /**
     * Set the renderer for the VM/runtime
     * @param {!RenderWebGL} renderer The renderer to attach
     */
    attachRenderer (renderer) {
        this.runtime.attachRenderer(renderer);
    }

    /**
     * @returns {RenderWebGL} The renderer attached to the vm
     */
    get renderer () {
        return this.runtime && this.runtime.renderer;
    }

    /**
     * Set the storage module for the VM/runtime
     * @param {!ScratchStorage} storage The storage module to attach
     */
    attachStorage (storage) {
        this.runtime.attachStorage(storage);
    }

    /**
     * Handles a message from the python worker.
     * @param {object} message The message from the worker.
     * @private
     */
    _onWorkerMessage (message) {
        const {id, targetID, opCode, args, token} = message;
        if (id === WorkerMessages.ToVM.BlockOP) {
            const returnVal = this.runtime.exec_block_primitive(targetID, opCode, args, token);
            returnVal.then(value => {
                this._postResultValue(message, value);
            });
        }
    }

    /**
     * Post a ResultValue message to a worker in reply to a particular message.
     * The outgoing message's reply token will be copied from the provided message.
     * @param {object} message The originating message to which this is a reply.
     * @param {*} value The value to send as a result.
     * @private
     */
    _postResultValue (message, value) {
        this.pyatchWorker.postMessage({id: WorkerMessages.FromVM.ResultValue, value: value, token: message.token});
    }

    run (targetsAndCode) {
        const targetArr = [];
        targetsAndCode.forEach(target => {
            targetArr.push(target);
        });
        const pythonCode = this.pyatchLinker.generatePython(targetsAndCode);
        const message = {
            id: 'AsyncRun',
            token: 'token',
            python: pythonCode,
            targets: targetArr
        };

        this.pyatchWorker.postMessage(message);
    }
    
}
