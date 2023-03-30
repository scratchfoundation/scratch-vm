// import path from 'path';
// import { fileURLToPath } from 'url';

// import VirtualMachine from '../../src/virtual-machine.mjs';
// import Sprite from '../../src/sprites/sprite.mjs';
// import RenderedTarget from '../../src/sprites/rendered-target.mjs';

// import WorkerMessages from '../../src/worker/worker-messages.mjs';

// import { readFileToBuffer }  from '../fixtures/readProjectFile.mjs';

// import chai from 'chai';
// import sinonChai from 'sinon-chai';

// chai.use(sinonChai);
// const expect = chai.expect;

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const PATH_TO_PYODIDE = path.join(__dirname, '../../node_modules/pyodide');
// const PATH_TO_WORKER = path.join(__dirname, '../../src/worker/pyodide-web-worker.mjs');

// const vm = new VirtualMachine(PATH_TO_PYODIDE, PATH_TO_WORKER);
        
// const sprite3Uri = path.resolve(__dirname, '../fixtures/cat.sprite3');
// const sprite3 = readFileToBuffer(sprite3Uri);

// const result = await vm.addSprite(sprite3);