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

    vm.start();

});


describe('Pyatch VM Linker & Worker Integration', () => {
    describe('Sound Blocks', () => {
        it('Play Sound', async () => {
            

            const targetAndCode = {
                target1: ['playSound("meow")'],
            };

            await vm.run(targetAndCode);

        });
        
        it('Play Sound Until Done', async () => {
            

            const targetAndCode = {
                target1: ['playSoundUntilDone("meow")'],
            };

            await vm.run(targetAndCode);

        });

        it('Stop All Sounds', async () => {
            

            const targetAndCode = {
                target1: ['stopAllSounds()'],
            };

            await vm.run(targetAndCode);

        });

        it('Set Effect To', async () => {
            

            const targetAndCode = {
                target1: ['setSoundEffectTo("pitch", 135)'],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].getCustomState('Scratch.sound').effects.pitch).to.equal(135);
        });

        it('Change Effect By', async () => {
            

            const targetAndCode = {
                target1: ['changeSoundEffectBy("pan", -50)'],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].getCustomState('Scratch.sound').effects.pan).to.equal(-50);
        });

        it('Set Volume To', async () => {
            

            const targetAndCode = {
                target1: ['setVolumeTo(70)'],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].volume).to.equal(70);
        });

        it('Change Volume By', async () => {
            

            const targetAndCode = {
                target1: ['setVolumeTo(100)\nchangeVolumeBy(-40)'],
            };

            await vm.run(targetAndCode);

            expect(vm.runtime.targets[0].volume).to.equal(60);
        });

    });
});
