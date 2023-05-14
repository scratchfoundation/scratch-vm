import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import PyatchWorker from '../../src/worker/pyatch-worker.mjs';
import WorkerMessages from '../../src/worker/worker-messages.mjs';

import extractCallsSpy from '../fixtures/extract-calls-spy.mjs';

let expect = chai.expect;
chai.use(sinonChai);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Just posts a null value result back to the worker every block OP it receives to worker can finish python execution.
const createBlockOPTestCallback = (spy, returnValue) => {
	return function (message) {
		spy(message);
		this._worker.postMessage({
			id: WorkerMessages.FromVM.ResultValue,
			token: message.token,
			value: returnValue,
		});
	}
}

let spy = null;
let pyatchWorker = null;

before( async () => {  
	spy = sinon.spy();
	pyatchWorker = new PyatchWorker(createBlockOPTestCallback(spy, null));	

	await pyatchWorker.loadPyodide();
});

beforeEach(async () => {
	spy.resetHistory();
});

after( async () => {
	pyatchWorker.terminate();
});

describe('Patch Worker Functionality', () => {
	describe('Run Patch Functions', () => {
		describe('Threading Messages', () => {
			it('End Of Thread Message', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'motion', 'single-target-move.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);
				

				expect(spy).to.be.calledTwice;
		
				let endOfThreadCall = spy.getCalls().slice(-1)[0].firstArg;
				expect(endOfThreadCall.id).to.equal('BlockOP')
				expect(endOfThreadCall.threadId).to.equal(threads[0])
				expect(endOfThreadCall.opCode).to.equal('core_endthread')
				expect(endOfThreadCall.args).to.eql({})
				expect(endOfThreadCall.token).to.be.a('string')
			});
		});
		describe('Motion Primitive Functions', () => {
			it('Move', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'motion', 'single-target-move.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);
				

				expect(spy).to.be.calledTwice;
		
				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('motion_movesteps')
				expect(blockOpCall.args).to.eql({ STEPS: 10 })
				expect(blockOpCall.token).to.be.a('string')
			});

			it('Go To XY', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'motion', 'single-target-gotoxy.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);
				

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('motion_gotoxy')
				expect(blockOpCall.args).to.eql({ X: 10, Y: 5 })
				expect(blockOpCall.token).to.be.a('string')
			});

			it('Go To', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'motion', 'single-target-goto.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);
				

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('motion_goto')
				expect(blockOpCall.args).to.eql({ TO: 'target1' })
				expect(blockOpCall.token).to.be.a('string')
			});

			it('Turn Right', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'motion', 'single-target-turnright.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);
				

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('motion_turnright')
				expect(blockOpCall.args).to.eql({ DEGREES: 90 })
				expect(blockOpCall.token).to.be.a('string')
			});

			it('Turn Left', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'motion', 'single-target-turnleft.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);
				

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('motion_turnleft')
				expect(blockOpCall.args).to.eql({ DEGREES: 90 })
				expect(blockOpCall.token).to.be.a('string')
			});

			it('Point In Direction', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'motion', 'single-target-pointindirection.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);
				

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('motion_pointindirection')
				expect(blockOpCall.args).to.eql({ DIRECTION: 90 })
				expect(blockOpCall.token).to.be.a('string')
			});

			it('Point Towards', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'motion', 'single-target-pointtowards.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);
				

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('motion_pointtowards')
				expect(blockOpCall.args).to.eql({ TOWARDS: 'target1' })
				expect(blockOpCall.token).to.be.a('string')
			});

			it('Glide', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'motion', 'single-target-glide.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);
				

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('motion_glidesecstoxy')
				expect(blockOpCall.args).to.eql({ SECS: 1, X: 10, Y:5 })
				expect(blockOpCall.token).to.be.a('string')
			});

			it('Glide To', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'motion', 'single-target-glideto.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);
				

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('motion_glideto')
				expect(blockOpCall.args).to.eql({ SECS: 1, TO: 'target1' })
				expect(blockOpCall.token).to.be.a('string')
			});

			it('If On Edge Bounce', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'motion', 'single-target-ifonedgebounce.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);
				

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('motion_ifonedgebounce')
				expect(blockOpCall.args).to.eql({})
				expect(blockOpCall.token).to.be.a('string')
			});

			it('Set Rotation Style', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'motion', 'single-target-setrotationstyle.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);
				

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('motion_setrotationstyle')
				expect(blockOpCall.args).to.eql({ STYLE: 'free' })
				expect(blockOpCall.token).to.be.a('string')
			});

			it('Change X', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'motion', 'single-target-changex.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);
				

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('motion_changexby')
				expect(blockOpCall.args).to.eql({ DX: 10 })
				expect(blockOpCall.token).to.be.a('string')
			});

			it('Set X', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'motion', 'single-target-setx.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);
				

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('motion_setx')
				expect(blockOpCall.args).to.eql({ X: 10 })
				expect(blockOpCall.token).to.be.a('string')
			});

			it('Change Y', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'motion', 'single-target-changey.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);
				

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('motion_changeyby')
				expect(blockOpCall.args).to.eql({ DY: 10 })
				expect(blockOpCall.token).to.be.a('string')
			});

			it('Set Y', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'motion', 'single-target-sety.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);
				

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('motion_sety')
				expect(blockOpCall.args).to.eql({ Y: 10 })
				expect(blockOpCall.token).to.be.a('string')
			});			

			it('Get X', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'motion', 'single-target-getx.py'), 'utf8');
				const threads = ['id_0'];	

				const mockedX = 5;

				pyatchWorker._blockOPCallback = createBlockOPTestCallback(spy, mockedX)

				await pyatchWorker.run(pythonCode, threads);
				

				expect(spy).to.be.calledThrice;

				const blockOpCalls = extractCallsSpy(spy);

				expect(blockOpCalls[2].id).to.equal('BlockOP')
				expect(blockOpCalls[2].threadId).to.equal(threads[0])
				expect(blockOpCalls[2].opCode).to.equal('motion_xposition')
				expect(blockOpCalls[2].args).to.eql({})
				expect(blockOpCalls[2].token).to.be.a('string')

				// The reason for this test is to ensure that the proper value was returned in the python env
				expect(blockOpCalls[1].id).to.equal('BlockOP')
				expect(blockOpCalls[1].threadId).to.equal(threads[0])
				expect(blockOpCalls[1].opCode).to.equal('motion_setx')
				expect(blockOpCalls[1].args).to.eql({ X: mockedX })
				expect(blockOpCalls[1].token).to.be.a('string')

			});

			it('Get Y', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'motion', 'single-target-gety.py'), 'utf8');
				const threads = ['id_0'];	

				const mockedY = 5;

				pyatchWorker._blockOPCallback = createBlockOPTestCallback(spy, mockedY)

				await pyatchWorker.run(pythonCode, threads);
				

				expect(spy).to.be.calledThrice;

				const blockOpCalls = extractCallsSpy(spy);

				expect(blockOpCalls[2].id).to.equal('BlockOP')
				expect(blockOpCalls[2].threadId).to.equal(threads[0])
				expect(blockOpCalls[2].opCode).to.equal('motion_yposition')
				expect(blockOpCalls[2].args).to.eql({})
				expect(blockOpCalls[2].token).to.be.a('string')

				expect(blockOpCalls[1].id).to.equal('BlockOP')
				expect(blockOpCalls[1].threadId).to.equal(threads[0])
				expect(blockOpCalls[1].opCode).to.equal('motion_sety')
				expect(blockOpCalls[1].args).to.eql({ Y: mockedY })
				expect(blockOpCalls[1].token).to.be.a('string')
			});

			it('Get Direction', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'motion', 'single-target-getdirection.py'), 'utf8');
				const threads = ['id_0'];	

				const mockedDirection = 90;

				pyatchWorker._blockOPCallback = createBlockOPTestCallback(spy, mockedDirection)

				await pyatchWorker.run(pythonCode, threads);
				

				expect(spy).to.be.calledThrice;

				const blockOpCalls = extractCallsSpy(spy);

				expect(blockOpCalls[2].id).to.equal('BlockOP')
				expect(blockOpCalls[2].threadId).to.equal(threads[0])
				expect(blockOpCalls[2].opCode).to.equal('motion_direction')
				expect(blockOpCalls[2].args).to.eql({})
				expect(blockOpCalls[2].token).to.be.a('string')

				expect(blockOpCalls[1].id).to.equal('BlockOP')
				expect(blockOpCalls[1].threadId).to.equal(threads[0])
				expect(blockOpCalls[1].opCode).to.equal('motion_pointindirection')
				expect(blockOpCalls[1].args).to.eql({ DIRECTION: mockedDirection })
				expect(blockOpCalls[1].token).to.be.a('string')
			});
		});
	});
});
