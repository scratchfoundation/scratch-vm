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
        
        it('Go To XY', async () => {
            const vm = new VirtualMachine(PATH_TO_PYODIDE, PATH_TO_WORKER);
            const sprite = new Sprite(null, vm.runtime);
            const target = new RenderedTarget(sprite, vm.runtime);
            target.id = 'target1';
            vm.runtime.addTarget(target);

            const targetAndCode = {
                target1: ['goToXY(10, 5)'],
            };

            const result = await vm.run(targetAndCode);

            expect(result).to.equal(WorkerMessages.ToVM.PythonFinished);
            expect(vm.runtime.targets[0].x).to.equal(10);
            expect(vm.runtime.targets[0].y).to.equal(5);
        });

        it('Go To', async () => {
            const vm = new VirtualMachine(PATH_TO_PYODIDE, PATH_TO_WORKER);
            const sprite = new Sprite(null, vm.runtime);
            const target = new RenderedTarget(sprite, vm.runtime);
            target.id = 'target1';
            vm.runtime.addTarget(target);

            const targetAndCode = {
                target1: ['goTo("target2")'],
            };

            const sprite2 = new Sprite(null, vm.runtime);
            const target2 = new RenderedTarget(sprite2, vm.runtime);
            target2.id = 'target2';
            sprite2.name = 'target2';
            target2.x = 10;
            target2.y = 5;
            vm.runtime.addTarget(target2);

            const result = await vm.run(targetAndCode);

            expect(result).to.equal(WorkerMessages.ToVM.PythonFinished);
            expect(vm.runtime.targets[0].x).to.equal(10);
            expect(vm.runtime.targets[0].y).to.equal(5);
        });

        it('Turn Right', async () => {
            const vm = new VirtualMachine(PATH_TO_PYODIDE, PATH_TO_WORKER);
            const sprite = new Sprite(null, vm.runtime);
            const target = new RenderedTarget(sprite, vm.runtime);
            target.id = 'target1';
            vm.runtime.addTarget(target);

            const targetAndCode = {
                target1: ['turnRight(90)'],
            };

            const result = await vm.run(targetAndCode);

            expect(result).to.equal(WorkerMessages.ToVM.PythonFinished);
            expect(vm.runtime.targets[0].direction).to.equal(180);
        });

        it('Turn Left', async () => {
            const vm = new VirtualMachine(PATH_TO_PYODIDE, PATH_TO_WORKER);
            const sprite = new Sprite(null, vm.runtime);
            const target = new RenderedTarget(sprite, vm.runtime);
            target.id = 'target1';
            vm.runtime.addTarget(target);

            const targetAndCode = {
                target1: ['turnLeft(90)'],
            };

            const result = await vm.run(targetAndCode);

            expect(result).to.equal(WorkerMessages.ToVM.PythonFinished);
            expect(vm.runtime.targets[0].direction).to.equal(0);
        });

        it('Point In Direction', async () => {
            const vm = new VirtualMachine(PATH_TO_PYODIDE, PATH_TO_WORKER);
            const sprite = new Sprite(null, vm.runtime);
            const target = new RenderedTarget(sprite, vm.runtime);
            target.id = 'target1';
            vm.runtime.addTarget(target);

            const targetAndCode = {
                target1: ['pointInDirection(90)'],
            };

            const result = await vm.run(targetAndCode);

            expect(result).to.equal(WorkerMessages.ToVM.PythonFinished);
            expect(vm.runtime.targets[0].direction).to.equal(90);
        });


        it('pointTowards', async () => {
            const vm = new VirtualMachine(PATH_TO_PYODIDE, PATH_TO_WORKER);
            const sprite = new Sprite(null, vm.runtime);
            const target = new RenderedTarget(sprite, vm.runtime);
            target.id = 'target1';
            vm.runtime.addTarget(target);

            const targetAndCode = {
                target1: ['pointTowards("target2")'],
            };

            const sprite2 = new Sprite(null, vm.runtime);
            const target2 = new RenderedTarget(sprite2, vm.runtime);
            target2.id = 'target2';
            sprite2.name = 'target2';
            target2.x = 5;
            target2.y = 5;
            vm.runtime.addTarget(target2);

            const result = await vm.run(targetAndCode);

            expect(result).to.equal(WorkerMessages.ToVM.PythonFinished);
            expect(vm.runtime.targets[0].direction).to.equal(45);
        });

        it('Glide', async () => {
            const vm = new VirtualMachine(PATH_TO_PYODIDE, PATH_TO_WORKER);
            const sprite = new Sprite(null, vm.runtime);
            const target = new RenderedTarget(sprite, vm.runtime);
            target.id = 'target1';
            vm.runtime.addTarget(target);

            const targetAndCode = {
                target1: ['glide(10, 5, 1)'],
            };

            const result = await vm.run(targetAndCode);

            expect(result).to.equal(WorkerMessages.ToVM.PythonFinished);
            expect(vm.runtime.targets[0].x).to.equal(10);
            expect(vm.runtime.targets[0].y).to.equal(5);
        });

        it('Glide To', async () => {
            const vm = new VirtualMachine(PATH_TO_PYODIDE, PATH_TO_WORKER);
            const sprite = new Sprite(null, vm.runtime);
            const target = new RenderedTarget(sprite, vm.runtime);
            target.id = 'target1';
            vm.runtime.addTarget(target);

            const targetAndCode = {
                target1: ['glideTo("target2", 1)'],
            };

            const sprite2 = new Sprite(null, vm.runtime);
            const target2 = new RenderedTarget(sprite2, vm.runtime);
            target2.id = 'target2';
            target2.x = 10;
            target2.y = 5;
            vm.runtime.addTarget(target2);

            const result = await vm.run(targetAndCode);

            expect(result).to.equal(WorkerMessages.ToVM.PythonFinished);
            expect(vm.runtime.targets[0].x).to.equal(10);
            expect(vm.runtime.targets[0].y).to.equal(5);
        });

        it('If On Edge Bounce', async () => {
            const vm = new VirtualMachine(PATH_TO_PYODIDE, PATH_TO_WORKER);
            const sprite = new Sprite(null, vm.runtime);
            const target = new RenderedTarget(sprite, vm.runtime);
            target.id = 'target1';
            vm.runtime.addTarget(target);

            const targetAndCode = {
                target1: ['ifOnEdgeBounce()'],
            };

            const result = await vm.run(targetAndCode);

            expect(result).to.equal(WorkerMessages.ToVM.PythonFinished);
            expect(vm.runtime.targets[0].direction).to.equal(180);
        });

        it('Set Rotation Style', async () => {
            const vm = new VirtualMachine(PATH_TO_PYODIDE, PATH_TO_WORKER);
            const sprite = new Sprite(null, vm.runtime);
            const target = new RenderedTarget(sprite, vm.runtime);
            target.id = 'target1';
            vm.runtime.addTarget(target);

            const targetAndCode = {
                target1: ['setRotationStyle("leftRight")'],
            };

            const result = await vm.run(targetAndCode);

            expect(result).to.equal(WorkerMessages.ToVM.PythonFinished);
            expect(vm.runtime.targets[0].rotationStyle).to.equal('leftRight');
        });

        it('Change X', async () => {
            const vm = new VirtualMachine(PATH_TO_PYODIDE, PATH_TO_WORKER);
            const sprite = new Sprite(null, vm.runtime);
            const target = new RenderedTarget(sprite, vm.runtime);
            target.id = 'target1';
            vm.runtime.addTarget(target);

            const oldX = target.x;
            const dx = 10;
            const oldY = target.y;

            const targetAndCode = {
                target1: ['changeX(' + dx + ')'],
            }

            const result = await vm.run(targetAndCode);

            expect(result).to.equal(WorkerMessages.ToVM.PythonFinished);
            expect(vm.runtime.targets[0].x).to.equal(oldX + dx);
            expect(vm.runtime.targets[0].y).to.equal(oldY);
        });

        it('Change Y', async () => {
            const vm = new VirtualMachine(PATH_TO_PYODIDE, PATH_TO_WORKER);
            const sprite = new Sprite(null, vm.runtime);
            const target = new RenderedTarget(sprite, vm.runtime);
            target.id = 'target1';
            vm.runtime.addTarget(target);

            const oldX = target.x;
            const oldY = target.y;
            const dy = 10;

            const targetAndCode = {
                target1: ['changeY(' + dy + ')'],
            }

            const result = await vm.run(targetAndCode);

            expect(result).to.equal(WorkerMessages.ToVM.PythonFinished);
            expect(vm.runtime.targets[0].x).to.equal(oldX);
            expect(vm.runtime.targets[0].y).to.equal(oldY + dy);
        });

        it('Set X', async () => {
            const vm = new VirtualMachine(PATH_TO_PYODIDE, PATH_TO_WORKER);
            const sprite = new Sprite(null, vm.runtime);
            const target = new RenderedTarget(sprite, vm.runtime);
            target.id = 'target1';
            vm.runtime.addTarget(target);

            const eX = 10;
            const oldY = target.y;

            const targetAndCode = {
                target1: ['setX(' + eX + ')'],
            }

            const result = await vm.run(targetAndCode);

            expect(result).to.equal(WorkerMessages.ToVM.PythonFinished);
            expect(vm.runtime.targets[0].x).to.equal(eX);
            expect(vm.runtime.targets[0].y).to.equal(oldY);
        });

        it('Set Y', async () => {
            const vm = new VirtualMachine(PATH_TO_PYODIDE, PATH_TO_WORKER);
            const sprite = new Sprite(null, vm.runtime);
            const target = new RenderedTarget(sprite, vm.runtime);
            target.id = 'target1';
            vm.runtime.addTarget(target);

            const oldX = target.x;
            const eY = 10;

            const targetAndCode = {
                target1: ['setY(' + eY + ')'],
            }

            const result = await vm.run(targetAndCode);

            expect(result).to.equal(WorkerMessages.ToVM.PythonFinished);
            expect(vm.runtime.targets[0].x).to.equal(oldX);
            expect(vm.runtime.targets[0].y).to.equal(eY);
        });

    });
});
