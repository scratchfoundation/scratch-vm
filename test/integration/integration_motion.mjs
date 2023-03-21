/* eslint-disable no-undefined */
/* eslint-disable no-undef */
import VirtualMachine from '../../src/virtual-machine.mjs';
import Sprite from '../../src/sprites/sprite.mjs';
import RenderedTarget from '../../src/sprites/rendered-target.mjs';

import chai from 'chai';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);
const expect = chai.expect;

describe('Pyatch VM Linker & Worker Integration', () => {
    describe('Motion Blocks', () => {
        it('Move', async () => {
            const vm = new VirtualMachine();
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);
            vm.runtime.addTarget(target);

            targetAndCode = {
                target1: 'move(10)'
            };

            expect(vm.run(targetAndCode)).not.to.Throw('Error');
        });
    });
});
