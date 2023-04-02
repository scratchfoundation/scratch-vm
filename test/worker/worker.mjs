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

const PATH_TO_PYODIDE = path.join(__dirname, '../../node_modules/pyodide');
const PATH_TO_WORKER = path.join(__dirname, '../../src/worker/pyodide-web-worker.mjs');

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

describe('Pyatch Worker Async Run', () => {
	describe('Motion Primitive Functions', () => {
		it('Move', async () => {

			const spy = sinon.spy();
			const pyatchWorker = new PyatchWorker(PATH_TO_WORKER, blockOPTestCallback(spy));

			const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-move.py'), 'utf8');
			const targetArr = ['target1'];	

			const loadResult = await pyatchWorker.loadPyodide(PATH_TO_PYODIDE);
			expect(loadResult).to.equal(WorkerMessages.ToVM.PyodideLoaded);

			const runResult = await pyatchWorker.run(pythonCode, targetArr);
			expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

			expect(spy).to.be.calledOnce;
	
			let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
			expect(lastCallData.id).to.equal('BlockOP')
			expect(lastCallData.targetID).to.equal(targetArr[0])
			expect(lastCallData.opCode).to.equal('motion_movesteps')
			expect(lastCallData.args).to.eql({ STEPS: 10 })
			expect(lastCallData.token).to.be.a('string')

			pyatchWorker.terminate();
		});

		it('Go To XY', async () => {

			const spy = sinon.spy();
			const pyatchWorker = new PyatchWorker(PATH_TO_WORKER, blockOPTestCallback(spy));

			const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-gotoxy.py'), 'utf8');
			const targetArr = ['target1'];	

			const loadResult = await pyatchWorker.loadPyodide(PATH_TO_PYODIDE);
			expect(loadResult).to.equal(WorkerMessages.ToVM.PyodideLoaded);

			const runResult = await pyatchWorker.run(pythonCode, targetArr);
			expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

			expect(spy).to.be.calledOnce;

			let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
			expect(lastCallData.id).to.equal('BlockOP')
			expect(lastCallData.targetID).to.equal(targetArr[0])
			expect(lastCallData.opCode).to.equal('motion_gotoxy')
			expect(lastCallData.args).to.eql({ X: 10, Y: 5 })
			expect(lastCallData.token).to.be.a('string')

			pyatchWorker.terminate();
		});

		it('Go To', async () => {

			const spy = sinon.spy();
			const pyatchWorker = new PyatchWorker(PATH_TO_WORKER, blockOPTestCallback(spy));

			const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-goto.py'), 'utf8');
			const targetArr = ['target1'];	

			const loadResult = await pyatchWorker.loadPyodide(PATH_TO_PYODIDE);
			expect(loadResult).to.equal(WorkerMessages.ToVM.PyodideLoaded);

			const runResult = await pyatchWorker.run(pythonCode, targetArr);
			expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

			expect(spy).to.be.calledOnce;

			let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
			expect(lastCallData.id).to.equal('BlockOP')
			expect(lastCallData.targetID).to.equal(targetArr[0])
			expect(lastCallData.opCode).to.equal('motion_goto')
			expect(lastCallData.args).to.eql({ TO: 'target1' })
			expect(lastCallData.token).to.be.a('string')

			pyatchWorker.terminate();
		});

		it('Turn Right', async () => {

			const spy = sinon.spy();
			const pyatchWorker = new PyatchWorker(PATH_TO_WORKER, blockOPTestCallback(spy));

			const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-turnright.py'), 'utf8');
			const targetArr = ['target1'];	

			const loadResult = await pyatchWorker.loadPyodide(PATH_TO_PYODIDE);
			expect(loadResult).to.equal(WorkerMessages.ToVM.PyodideLoaded);

			const runResult = await pyatchWorker.run(pythonCode, targetArr);
			expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

			expect(spy).to.be.calledOnce;

			let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
			expect(lastCallData.id).to.equal('BlockOP')
			expect(lastCallData.targetID).to.equal(targetArr[0])
			expect(lastCallData.opCode).to.equal('motion_turnright')
			expect(lastCallData.args).to.eql({ DEGREES: 90 })
			expect(lastCallData.token).to.be.a('string')

			pyatchWorker.terminate();
		});

		it('Turn Left', async () => {

			const spy = sinon.spy();
			const pyatchWorker = new PyatchWorker(PATH_TO_WORKER, blockOPTestCallback(spy));

			const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-turnleft.py'), 'utf8');
			const targetArr = ['target1'];	

			const loadResult = await pyatchWorker.loadPyodide(PATH_TO_PYODIDE);
			expect(loadResult).to.equal(WorkerMessages.ToVM.PyodideLoaded);

			const runResult = await pyatchWorker.run(pythonCode, targetArr);
			expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

			expect(spy).to.be.calledOnce;

			let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
			expect(lastCallData.id).to.equal('BlockOP')
			expect(lastCallData.targetID).to.equal(targetArr[0])
			expect(lastCallData.opCode).to.equal('motion_turnleft')
			expect(lastCallData.args).to.eql({ DEGREES: 90 })
			expect(lastCallData.token).to.be.a('string')

			pyatchWorker.terminate();
		});

		it('Point In Direction', async () => {

			const spy = sinon.spy();
			const pyatchWorker = new PyatchWorker(PATH_TO_WORKER, blockOPTestCallback(spy));

			const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-pointindirection.py'), 'utf8');
			const targetArr = ['target1'];	

			const loadResult = await pyatchWorker.loadPyodide(PATH_TO_PYODIDE);
			expect(loadResult).to.equal(WorkerMessages.ToVM.PyodideLoaded);

			const runResult = await pyatchWorker.run(pythonCode, targetArr);
			expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

			expect(spy).to.be.calledOnce;

			let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
			expect(lastCallData.id).to.equal('BlockOP')
			expect(lastCallData.targetID).to.equal(targetArr[0])
			expect(lastCallData.opCode).to.equal('motion_pointindirection')
			expect(lastCallData.args).to.eql({ DIRECTION: 90 })
			expect(lastCallData.token).to.be.a('string')

			pyatchWorker.terminate();
		});

		it('Point Towards', async () => {

			const spy = sinon.spy();
			const pyatchWorker = new PyatchWorker(PATH_TO_WORKER, blockOPTestCallback(spy));

			const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-pointtowards.py'), 'utf8');
			const targetArr = ['target1'];	

			const loadResult = await pyatchWorker.loadPyodide(PATH_TO_PYODIDE);
			expect(loadResult).to.equal(WorkerMessages.ToVM.PyodideLoaded);

			const runResult = await pyatchWorker.run(pythonCode, targetArr);
			expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

			expect(spy).to.be.calledOnce;

			let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
			expect(lastCallData.id).to.equal('BlockOP')
			expect(lastCallData.targetID).to.equal(targetArr[0])
			expect(lastCallData.opCode).to.equal('motion_pointtowards')
			expect(lastCallData.args).to.eql({ TOWARDS: 'target1' })
			expect(lastCallData.token).to.be.a('string')

			pyatchWorker.terminate();
		});

		it('Glide', async () => {

			const spy = sinon.spy();
			const pyatchWorker = new PyatchWorker(PATH_TO_WORKER, blockOPTestCallback(spy));

			const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-glide.py'), 'utf8');
			const targetArr = ['target1'];	

			const loadResult = await pyatchWorker.loadPyodide(PATH_TO_PYODIDE);
			expect(loadResult).to.equal(WorkerMessages.ToVM.PyodideLoaded);

			const runResult = await pyatchWorker.run(pythonCode, targetArr);
			expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

			expect(spy).to.be.calledOnce;

			let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
			expect(lastCallData.id).to.equal('BlockOP')
			expect(lastCallData.targetID).to.equal(targetArr[0])
			expect(lastCallData.opCode).to.equal('motion_glidesecstoxy')
			expect(lastCallData.args).to.eql({ SECS: 1, X: 10, Y:5 })
			expect(lastCallData.token).to.be.a('string')

			pyatchWorker.terminate();
		});

		it('Glide To', async () => {

			const spy = sinon.spy();
			const pyatchWorker = new PyatchWorker(PATH_TO_WORKER, blockOPTestCallback(spy));

			const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-glideto.py'), 'utf8');
			const targetArr = ['target1'];	

			const loadResult = await pyatchWorker.loadPyodide(PATH_TO_PYODIDE);
			expect(loadResult).to.equal(WorkerMessages.ToVM.PyodideLoaded);

			const runResult = await pyatchWorker.run(pythonCode, targetArr);
			expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

			expect(spy).to.be.calledOnce;

			let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
			expect(lastCallData.id).to.equal('BlockOP')
			expect(lastCallData.targetID).to.equal(targetArr[0])
			expect(lastCallData.opCode).to.equal('motion_glideto')
			expect(lastCallData.args).to.eql({ SECS: 1, TO: 'target1' })
			expect(lastCallData.token).to.be.a('string')

			pyatchWorker.terminate();
		});

		it('If On Edge Bounce', async () => {

			const spy = sinon.spy();
			const pyatchWorker = new PyatchWorker(PATH_TO_WORKER, blockOPTestCallback(spy));

			const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-ifonedgebounce.py'), 'utf8');
			const targetArr = ['target1'];	

			const loadResult = await pyatchWorker.loadPyodide(PATH_TO_PYODIDE);
			expect(loadResult).to.equal(WorkerMessages.ToVM.PyodideLoaded);

			const runResult = await pyatchWorker.run(pythonCode, targetArr);
			expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

			expect(spy).to.be.calledOnce;

			let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
			expect(lastCallData.id).to.equal('BlockOP')
			expect(lastCallData.targetID).to.equal(targetArr[0])
			expect(lastCallData.opCode).to.equal('motion_ifonedgebounce')
			expect(lastCallData.args).to.eql({})
			expect(lastCallData.token).to.be.a('string')

			pyatchWorker.terminate();
		});

		it('Set Rotation Style', async () => {

			const spy = sinon.spy();
			const pyatchWorker = new PyatchWorker(PATH_TO_WORKER, blockOPTestCallback(spy));

			const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-setrotationstyle.py'), 'utf8');
			const targetArr = ['target1'];	

			const loadResult = await pyatchWorker.loadPyodide(PATH_TO_PYODIDE);
			expect(loadResult).to.equal(WorkerMessages.ToVM.PyodideLoaded);

			const runResult = await pyatchWorker.run(pythonCode, targetArr);
			expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

			expect(spy).to.be.calledOnce;

			let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
			expect(lastCallData.id).to.equal('BlockOP')
			expect(lastCallData.targetID).to.equal(targetArr[0])
			expect(lastCallData.opCode).to.equal('motion_setrotationstyle')
			expect(lastCallData.args).to.eql({ STYLE: 'free' })
			expect(lastCallData.token).to.be.a('string')

			pyatchWorker.terminate();
		});

		it('Change X', async () => {

			const spy = sinon.spy();
			const pyatchWorker = new PyatchWorker(PATH_TO_WORKER, blockOPTestCallback(spy));

			const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-changex.py'), 'utf8');
			const targetArr = ['target1'];	

			const loadResult = await pyatchWorker.loadPyodide(PATH_TO_PYODIDE);
			expect(loadResult).to.equal(WorkerMessages.ToVM.PyodideLoaded);

			const runResult = await pyatchWorker.run(pythonCode, targetArr);
			expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

			expect(spy).to.be.calledOnce;

			let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
			expect(lastCallData.id).to.equal('BlockOP')
			expect(lastCallData.targetID).to.equal(targetArr[0])
			expect(lastCallData.opCode).to.equal('motion_changexby')
			expect(lastCallData.args).to.eql({ DX: 10 })
			expect(lastCallData.token).to.be.a('string')

			pyatchWorker.terminate();
		});

		it('Set X', async () => {

			const spy = sinon.spy();
			const pyatchWorker = new PyatchWorker(PATH_TO_WORKER, blockOPTestCallback(spy));

			const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-setx.py'), 'utf8');
			const targetArr = ['target1'];	

			const loadResult = await pyatchWorker.loadPyodide(PATH_TO_PYODIDE);
			expect(loadResult).to.equal(WorkerMessages.ToVM.PyodideLoaded);

			const runResult = await pyatchWorker.run(pythonCode, targetArr);
			expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

			expect(spy).to.be.calledOnce;

			let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
			expect(lastCallData.id).to.equal('BlockOP')
			expect(lastCallData.targetID).to.equal(targetArr[0])
			expect(lastCallData.opCode).to.equal('motion_setx')
			expect(lastCallData.args).to.eql({ X: 10 })
			expect(lastCallData.token).to.be.a('string')

			pyatchWorker.terminate();
		});

		it('Change Y', async () => {

			const spy = sinon.spy();
			const pyatchWorker = new PyatchWorker(PATH_TO_WORKER, blockOPTestCallback(spy));

			const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-changey.py'), 'utf8');
			const targetArr = ['target1'];	

			const loadResult = await pyatchWorker.loadPyodide(PATH_TO_PYODIDE);
			expect(loadResult).to.equal(WorkerMessages.ToVM.PyodideLoaded);

			const runResult = await pyatchWorker.run(pythonCode, targetArr);
			expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

			expect(spy).to.be.calledOnce;

			let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
			expect(lastCallData.id).to.equal('BlockOP')
			expect(lastCallData.targetID).to.equal(targetArr[0])
			expect(lastCallData.opCode).to.equal('motion_changeyby')
			expect(lastCallData.args).to.eql({ DY: 10 })
			expect(lastCallData.token).to.be.a('string')

			pyatchWorker.terminate();
		});

		it('Set Y', async () => {

			const spy = sinon.spy();
			const pyatchWorker = new PyatchWorker(PATH_TO_WORKER, blockOPTestCallback(spy));

			const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-sety.py'), 'utf8');
			const targetArr = ['target1'];	

			const loadResult = await pyatchWorker.loadPyodide(PATH_TO_PYODIDE);
			expect(loadResult).to.equal(WorkerMessages.ToVM.PyodideLoaded);

			const runResult = await pyatchWorker.run(pythonCode, targetArr);
			expect(runResult).to.equal(WorkerMessages.ToVM.PythonFinished);

			expect(spy).to.be.calledOnce;

			let lastCallData = spy.getCalls().slice(-1)[0].firstArg;
			expect(lastCallData.id).to.equal('BlockOP')
			expect(lastCallData.targetID).to.equal(targetArr[0])
			expect(lastCallData.opCode).to.equal('motion_sety')
			expect(lastCallData.args).to.eql({ Y: 10 })
			expect(lastCallData.token).to.be.a('string')

			pyatchWorker.terminate();
		});
	});
});
