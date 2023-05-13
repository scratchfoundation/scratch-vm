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

let vm = null;
let sprite = null;
let target = null;

before( async () => {  
    vm = new VirtualMachine();

    sprite = new Sprite(null, vm.runtime);
    target = new RenderedTarget(sprite, vm.runtime);
    target.id = 'target1';
    vm.runtime.addTarget(target);

});

const resetVm = () => {
    vm.runtime.targets.map((target) => {
        target.x = 0;
        target.y = 0;
        target.direction = 90;

        return target;
    });
}

beforeEach(async () => {
    resetVm();
});


describe('Pyatch VM Linker & Worker Integration', () => {
    describe('Sound Blocks', () => {
        it('Play Sound', async () => {
            

            const targetAndCode = {
                target1: ['playSound("meow")'],
            };

            const result = await vm.run(targetAndCode);

            expect(result).to.equal(WorkerMessages.ToVM.PythonFinished);
        });
        
        it('Play Sound Until Done', async () => {
            

            const targetAndCode = {
                target1: ['playSoundUntilDone("meow")'],
            };

            const result = await vm.run(targetAndCode);

            expect(result).to.equal(WorkerMessages.ToVM.PythonFinished);
        });

        it('Stop All Sounds', async () => {
            

            const targetAndCode = {
                target1: ['stopAllSounds()'],
            };

            const result = await vm.run(targetAndCode);

            expect(result).to.equal(WorkerMessages.ToVM.PythonFinished);
        });

        it('Set Effect To', async () => {
            

            const targetAndCode = {
                target1: ['setSoundEffectTo("pitch", 135)'],
            };

            const result = await vm.run(targetAndCode);

            expect(result).to.equal(WorkerMessages.ToVM.PythonFinished);
            expect(vm.runtime.targets[0].getCustomState('Scratch.sound').effects.pitch).to.equal(135);
        });

        it('Change Effect By', async () => {
            

            const targetAndCode = {
                target1: ['changeSoundEffectBy("pan", -50)'],
            };

            const result = await vm.run(targetAndCode);

            expect(result).to.equal(WorkerMessages.ToVM.PythonFinished);
            expect(vm.runtime.targets[0].getCustomState('Scratch.sound').effects.pan).to.equal(-50);
        });

        it('Set Volume To', async () => {
            

            const targetAndCode = {
                target1: ['setVolumeTo(70)'],
            };

            const result = await vm.run(targetAndCode);

            expect(result).to.equal(WorkerMessages.ToVM.PythonFinished);
            expect(vm.runtime.targets[0].volume).to.equal(70);
        });

        it('Change Volume By', async () => {
            

            const targetAndCode = {
                target1: ['setVolumeTo(100)\nchangeVolumeBy(-40)'],
            };

            const result = await vm.run(targetAndCode);

            expect(result).to.equal(WorkerMessages.ToVM.PythonFinished);
            expect(vm.runtime.targets[0].volume).to.equal(60);
        });
    });
});
