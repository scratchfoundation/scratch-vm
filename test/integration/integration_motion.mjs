/* eslint-disable no-undefined */
/* eslint-disable no-undef */
import path from 'path';
import { fileURLToPath } from 'url';

import VirtualMachine from '../../src/virtual-machine.mjs';
import Sprite from '../../src/sprites/sprite.mjs';
import RenderedTarget from '../../src/sprites/rendered-target.mjs';

import WorkerMessages from '../../src/worker/worker-messages.mjs';

import chai from 'chai';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);
const expect = chai.expect;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PATH_TO_PYODIDE = path.join(__dirname, '../../node_modules/pyodide');
const PATH_TO_WORKER = path.join(__dirname, '../../src/worker/pyodide-web-worker.mjs');

describe('Pyatch VM Linker & Worker Integration', () => {
    describe('Motion Blocks', () => {
        it('Move', async () => {
            const vm = new VirtualMachine(PATH_TO_PYODIDE, PATH_TO_WORKER);
            const sprite = new Sprite(null, vm.runtime);
            const target = new RenderedTarget(sprite, vm.runtime);
            target.id = 'target1';
            vm.runtime.addTarget(target);

            const targetAndCode = {
                target1: ['move(10)'],
            };

            const result = await vm.run(targetAndCode);

            expect(result).to.equal(WorkerMessages.ToVM.PythonFinished);
            expect(vm.runtime.targets[0].x).to.equal(10);
            expect(vm.runtime.targets[0].y).to.equal(0);
        });
    });
});
