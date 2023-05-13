import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import PyatchWorker from '../../src/worker/pyatch-worker.mjs';
import WorkerMessages from '../../src/worker/worker-messages.mjs';

let expect = chai.expect;
chai.use(sinonChai);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Just posts a null value result back to the worker every block OP it receives to worker can finish python execution.
const blockOPTestCallback = (spy) => {
	return function (message) {
		spy(message);
		this._worker.postMessage({
			id: WorkerMessages.FromVM.ResultValue,
			token: message.token,
			value: null,
		});
	}
}

let spy = null;
let pyatchWorker = null;

before( async () => {  
	spy = sinon.spy();
	pyatchWorker = new PyatchWorker(blockOPTestCallback(spy));	

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
		describe('Looks Primitive Functions', () => {
			it('Say', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'looks', 'single-target-say.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);

				expect(spy).to.be.calledTwice;
		
				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('looks_say')
				expect(blockOpCall.args).to.eql({ MESSAGE: 'Hello World' })
				expect(blockOpCall.token).to.be.a('string')

				
			});

			it('Say For Seconds', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'looks', 'single-target-sayfor.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('looks_sayforsecs')
				expect(blockOpCall.args).to.eql({ MESSAGE: 'Hello World', SECS: 5 })
				expect(blockOpCall.token).to.be.a('string')

				
			});

			it('Think', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'looks', 'single-target-think.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('looks_think')
				expect(blockOpCall.args).to.eql({ MESSAGE: 'Hello World' })
				expect(blockOpCall.token).to.be.a('string')

				
			});

			it('Think For Seconds', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'looks', 'single-target-thinkfor.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('looks_thinkforsecs')
				expect(blockOpCall.args).to.eql({ MESSAGE: 'Hello World', SECS: 5 })
				expect(blockOpCall.token).to.be.a('string')

				
			});

			it('Show', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'looks', 'single-target-show.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('looks_show')
				expect(blockOpCall.args).to.eql({ })
				expect(blockOpCall.token).to.be.a('string')

				
			});

			it('Hide', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'looks', 'single-target-hide.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('looks_hide')
				expect(blockOpCall.args).to.eql({ })
				expect(blockOpCall.token).to.be.a('string')

				
			});

			it('Set Costume To', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'looks', 'single-target-setcostumeto.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('looks_switchcostumeto')
				expect(blockOpCall.args).to.eql({ COSTUME: 1 })
				expect(blockOpCall.token).to.be.a('string')

				
			});

			it('Set Backdrop To', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'looks', 'single-target-setbackdropto.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('looks_switchbackdropto')
				expect(blockOpCall.args).to.eql({ BACKDROP: 1 })
				expect(blockOpCall.token).to.be.a('string')

				
			});

			it('Set Backdrop To And Wait', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'looks', 'single-target-setbackdroptoandwait.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('looks_switchbackdroptoandwait')
				expect(blockOpCall.args).to.eql({ BACKDROP: 1 })
				expect(blockOpCall.token).to.be.a('string')

				
			});

			it('Next Costume', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'looks', 'single-target-nextcostume.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('looks_nextcostume')
				expect(blockOpCall.args).to.eql({})
				expect(blockOpCall.token).to.be.a('string')

				
			});

			it('Next Backdrop', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'looks', 'single-target-nextbackdrop.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('looks_nextbackdrop')
				expect(blockOpCall.args).to.eql({})
				expect(blockOpCall.token).to.be.a('string')

				
			});

			it('Change Graphic Effect By', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'looks', 'single-target-changegraphiceffectby.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('looks_changeeffectby')
				expect(blockOpCall.args).to.eql({ EFFECT: 'ghost', CHANGE: -10 })
				expect(blockOpCall.token).to.be.a('string')

				
			});

			it('Set Graphic Effect To', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'looks', 'single-target-setgraphiceffectto.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('looks_seteffectto')
				expect(blockOpCall.args).to.eql({ EFFECT: 'ghost', VALUE: 10 })
				expect(blockOpCall.token).to.be.a('string')

				
			});

			it('Clear Graphics Effects', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'looks', 'single-target-cleargraphiceffects.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('looks_cleargraphiceffects')
				expect(blockOpCall.args).to.eql({})
				expect(blockOpCall.token).to.be.a('string')

				
			});

			it('Change Size By', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'looks', 'single-target-changesizeby.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('looks_changesizeby')
				expect(blockOpCall.args).to.eql({ CHANGE: 10 })
				expect(blockOpCall.token).to.be.a('string')

				
			});

			it('Set Size To', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'looks', 'single-target-setsizeto.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('looks_setsizeto')
				expect(blockOpCall.args).to.eql({ SIZE: 100 })
				expect(blockOpCall.token).to.be.a('string')

				
			});

			it('Set Layer To', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'looks', 'single-target-setlayerto.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('looks_gotofrontback')
				expect(blockOpCall.args).to.eql({ FRONT_BACK: 'front' })
				expect(blockOpCall.token).to.be.a('string')

				
			});

			it('Change Layer By', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, 'python', 'looks', 'single-target-changelayerby.py'), 'utf8');
				const threads = ['id_0'];	

				await pyatchWorker.run(pythonCode, threads);

				expect(spy).to.be.calledTwice;

				const blockOpCall = spy.getCalls().slice(-2)[0].firstArg;
				expect(blockOpCall.id).to.equal('BlockOP')
				expect(blockOpCall.threadId).to.equal(threads[0])
				expect(blockOpCall.opCode).to.equal('looks_goforwardbackwardlayers')
				expect(blockOpCall.args).to.eql({ NUM: 2 })
				expect(blockOpCall.token).to.be.a('string')

				
			});
		});
	});
});
