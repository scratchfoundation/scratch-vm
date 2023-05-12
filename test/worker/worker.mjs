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

const PATH_TO_WORKER = path.join(__dirname, '../../src/worker/pyodide-web.worker.mjs');

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
	pyatchWorker = new PyatchWorker(PATH_TO_WORKER, blockOPTestCallback(spy));	

	await pyatchWorker.loadPyodide();
});

beforeEach(async () => {
	spy.resetHistory();
});

after( async () => {
	pyatchWorker.terminate();
});

describe('Pyatch Worker Functionality', () => {
	describe('Async Run', () => {
		describe('Motion Primitive Functions', () => {
			it('Move', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-move.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;
		
				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('motion_movesteps')
				expect(lastCallData.args).to.eql({ STEPS: 10 })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Go To XY', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-gotoxy.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('motion_gotoxy')
				expect(lastCallData.args).to.eql({ X: 10, Y: 5 })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Go To', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-goto.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('motion_goto')
				expect(lastCallData.args).to.eql({ TO: 'target1' })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Turn Right', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-turnright.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('motion_turnright')
				expect(lastCallData.args).to.eql({ DEGREES: 90 })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Turn Left', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-turnleft.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('motion_turnleft')
				expect(lastCallData.args).to.eql({ DEGREES: 90 })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Point In Direction', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-pointindirection.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('motion_pointindirection')
				expect(lastCallData.args).to.eql({ DIRECTION: 90 })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Point Towards', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-pointtowards.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('motion_pointtowards')
				expect(lastCallData.args).to.eql({ TOWARDS: 'target1' })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Glide', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-glide.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('motion_glidesecstoxy')
				expect(lastCallData.args).to.eql({ SECS: 1, X: 10, Y:5 })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Glide To', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-glideto.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('motion_glideto')
				expect(lastCallData.args).to.eql({ SECS: 1, TO: 'target1' })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('If On Edge Bounce', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-ifonedgebounce.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('motion_ifonedgebounce')
				expect(lastCallData.args).to.eql({})
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Set Rotation Style', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-setrotationstyle.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('motion_setrotationstyle')
				expect(lastCallData.args).to.eql({ STYLE: 'free' })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Change X', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-changex.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('motion_changexby')
				expect(lastCallData.args).to.eql({ DX: 10 })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Set X', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-setx.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('motion_setx')
				expect(lastCallData.args).to.eql({ X: 10 })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Change Y', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-changey.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('motion_changeyby')
				expect(lastCallData.args).to.eql({ DY: 10 })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Set Y', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-sety.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('motion_sety')
				expect(lastCallData.args).to.eql({ Y: 10 })
				expect(lastCallData.token).to.be.a('string')

				
			});
		});

		describe('Looks Primitive Functions', () => {
			it('Say', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-say.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;
		
				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('looks_say')
				expect(lastCallData.args).to.eql({ MESSAGE: 'Hello World' })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Say For Seconds', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-sayfor.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('looks_sayforsecs')
				expect(lastCallData.args).to.eql({ MESSAGE: 'Hello World', SECS: 5 })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Think', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-think.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('looks_think')
				expect(lastCallData.args).to.eql({ MESSAGE: 'Hello World' })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Think For Seconds', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-thinkfor.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('looks_thinkforsecs')
				expect(lastCallData.args).to.eql({ MESSAGE: 'Hello World', SECS: 5 })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Show', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-show.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('looks_show')
				expect(lastCallData.args).to.eql({ })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Hide', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-hide.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('looks_hide')
				expect(lastCallData.args).to.eql({ })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Set Costume To', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-setcostumeto.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('looks_switchcostumeto')
				expect(lastCallData.args).to.eql({ COSTUME: 1 })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Set Backdrop To', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-setbackdropto.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('looks_switchbackdropto')
				expect(lastCallData.args).to.eql({ BACKDROP: 1 })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Set Backdrop To And Wait', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-setbackdroptoandwait.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('looks_switchbackdroptoandwait')
				expect(lastCallData.args).to.eql({ BACKDROP: 1 })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Next Costume', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-nextcostume.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('looks_nextcostume')
				expect(lastCallData.args).to.eql({})
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Next Backdrop', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-nextbackdrop.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('looks_nextbackdrop')
				expect(lastCallData.args).to.eql({})
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Change Graphic Effect By', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-changegraphiceffectby.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('looks_changeeffectby')
				expect(lastCallData.args).to.eql({ EFFECT: 'ghost', CHANGE: -10 })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Set Graphic Effect To', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-setgraphiceffectto.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('looks_seteffectto')
				expect(lastCallData.args).to.eql({ EFFECT: 'ghost', VALUE: 10 })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Clear Graphics Effects', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-cleargraphiceffects.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('looks_cleargraphiceffects')
				expect(lastCallData.args).to.eql({})
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Change Size By', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-changesizeby.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('looks_changesizeby')
				expect(lastCallData.args).to.eql({ CHANGE: 10 })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Set Size To', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-setsizeto.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('looks_setsizeto')
				expect(lastCallData.args).to.eql({ SIZE: 100 })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Set Layer To', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-setlayerto.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('looks_gotofrontback')
				expect(lastCallData.args).to.eql({ FRONT_BACK: 'front' })
				expect(lastCallData.token).to.be.a('string')

				
			});

			it('Change Layer By', async () => {
				const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-changelayerby.py'), 'utf8');
				const targetArr = ['target1'];	

				const runResult = await pyatchWorker.run(pythonCode, targetArr);
				expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

				expect(spy).to.be.calledOnce;

				let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
				expect(lastCallData.id).to.equal('BlockOP')
				expect(lastCallData.targetID).to.equal(targetArr[0])
				expect(lastCallData.opCode).to.equal('looks_goforwardbackwardlayers')
				expect(lastCallData.args).to.eql({ NUM: 2 })
				expect(lastCallData.token).to.be.a('string')

				
			});
		});
	});
});
