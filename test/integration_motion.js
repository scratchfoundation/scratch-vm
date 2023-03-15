/* eslint-disable no-undefined */
/* eslint-disable no-undef */
const VirtualMachine = require('../src/virtual-machine');
const Sprite = require('../src/sprites/sprite.js');
const RenderedTarget = require('../src/sprites/rendered-target.js');
const PyatchWorker = require('pyatch-worker');
const PyatchLinker = require('pyatch-linker');

const chai = require('chai');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const expect = chai.expect;

describe('Pyatch VM Linker & Worker Integration', () => {
    describe('Motion Blocks', () => {
        it('Move', async () => {
            const vm = new VirtualMachine();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            vm.runtime.addTarget(target);

            const pyatchWorker = new PyatchWorker();
            vm.attachWorker(pyatchWorker);
            
            const pyatchLinker = new PyatchLinker();
            vm.attachLinker(pyatchLinker);

            targetAndCode = {
                target1: 'move(10)'
            };

            expect(vm.run(targetAndCode)).not.to.Throw('Error');
        });
    });
});
