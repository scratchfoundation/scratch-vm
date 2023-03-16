import Worker from 'web-worker';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

let expect = chai.expect;
chai.use(sinonChai);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//import WorkerMessages from '../src/WorkerMessages';

const sleep = t =>
	new Promise(r => {
		setTimeout(r, t);
	});

describe('Pyatch Worker Async Run', () => {
	describe('Motion Primitive Functions', () => {
		it('Move', async () => {

			const url = new URL('../src/pyodideWebWorker.mjs', import.meta.url);
			const worker = new Worker(url, { type: 'module' });
			const spy = sinon.spy();
			worker.onmessage = spy;

			const pythonCode = fs.readFileSync(path.join(__dirname, './python', 'single-target-move.py'), 'utf8');
			const targetArr = ['target1'];	

			const message = {
				id: "AsyncRun",
				token: "token",
				python: pythonCode,
				targets: targetArr,
			}

			worker.postMessage(message);

			await sleep(1000);

			let lastCallData = spy.getCalls().slice(-1)[0].firstArg.data;
			expect(lastCallData.id).to.equal('BlockOP')
			expect(lastCallData.targetID).to.equal(targetArr[0])
			expect(lastCallData.op_code).to.equal('motion_movesteps')
			expect(lastCallData.args).to.eql({ STEPS: 10 })
			expect(lastCallData.token).to.be.a('string')
		});

		it('Go To XY', async () => {

			const url = new URL('../src/pyodideWebWorker.mjs', import.meta.url);
			const worker = new Worker(url, { type: 'module' });
			const spy = sinon.spy();
			worker.onmessage = spy;

			const python_code = fs.readFileSync(path.join(__dirname, './python', 'single-target-gotoxy.py'), 'utf8');
			const target_arr = ['target1'];	

			const message = {
				id: "AsyncRun",
				token: "token",
				python: python_code,
				targets: target_arr,
			}

			worker.postMessage(message);

			await sleep(1000);

			let last_call_data = spy.getCalls().slice(-1)[0].firstArg.data;
			expect(last_call_data.id).to.equal('BlockOP')
			expect(last_call_data.targetID).to.equal(target_arr[0])
			expect(last_call_data.op_code).to.equal('motion_gotoxy')
			expect(last_call_data.args).to.eql({ X: 10, Y: 5 })
			expect(last_call_data.token).to.be.a('string')
		});

		it('Go To', async () => {

			const url = new URL('../src/pyodideWebWorker.mjs', import.meta.url);
			const worker = new Worker(url, { type: 'module' });
			const spy = sinon.spy();
			worker.onmessage = spy;

			const python_code = fs.readFileSync(path.join(__dirname, './python', 'single-target-goto.py'), 'utf8');
			const target_arr = ['target1'];	

			const message = {
				id: "AsyncRun",
				token: "token",
				python: python_code,
				targets: target_arr,
			}

			worker.postMessage(message);

			await sleep(1000);

			let last_call_data = spy.getCalls().slice(-1)[0].firstArg.data;
			expect(last_call_data.id).to.equal('BlockOP')
			expect(last_call_data.targetID).to.equal(target_arr[0])
			expect(last_call_data.op_code).to.equal('motion_goto')
			expect(last_call_data.args).to.eql({ TO: 'target1' })
			expect(last_call_data.token).to.be.a('string')
		});

		it('Turn Right', async () => {

			const url = new URL('../src/pyodideWebWorker.mjs', import.meta.url);
			const worker = new Worker(url, { type: 'module' });
			const spy = sinon.spy();
			worker.onmessage = spy;

			const python_code = fs.readFileSync(path.join(__dirname, './python', 'single-target-turnright.py'), 'utf8');
			const target_arr = ['target1'];	

			const message = {
				id: "AsyncRun",
				token: "token",
				python: python_code,
				targets: target_arr,
			}

			worker.postMessage(message);

			await sleep(1000);

			let last_call_data = spy.getCalls().slice(-1)[0].firstArg.data;
			expect(last_call_data.id).to.equal('BlockOP')
			expect(last_call_data.targetID).to.equal(target_arr[0])
			expect(last_call_data.op_code).to.equal('motion_turnright')
			expect(last_call_data.args).to.eql({ DEGREES: 90 })
			expect(last_call_data.token).to.be.a('string')
		});

		it('Turn Left', async () => {

			const url = new URL('../src/pyodideWebWorker.mjs', import.meta.url);
			const worker = new Worker(url, { type: 'module' });
			const spy = sinon.spy();
			worker.onmessage = spy;

			const python_code = fs.readFileSync(path.join(__dirname, './python', 'single-target-turnleft.py'), 'utf8');
			const target_arr = ['target1'];	

			const message = {
				id: "AsyncRun",
				token: "token",
				python: python_code,
				targets: target_arr,
			}

			worker.postMessage(message);

			await sleep(1000);

			let last_call_data = spy.getCalls().slice(-1)[0].firstArg.data;
			expect(last_call_data.id).to.equal('BlockOP')
			expect(last_call_data.targetID).to.equal(target_arr[0])
			expect(last_call_data.op_code).to.equal('motion_turnleft')
			expect(last_call_data.args).to.eql({ DEGREES: 90 })
			expect(last_call_data.token).to.be.a('string')
		});

		it('Point In Direction', async () => {

			const url = new URL('../src/pyodideWebWorker.mjs', import.meta.url);
			const worker = new Worker(url, { type: 'module' });
			const spy = sinon.spy();
			worker.onmessage = spy;

			const python_code = fs.readFileSync(path.join(__dirname, './python', 'single-target-pointindirection.py'), 'utf8');
			const target_arr = ['target1'];	

			const message = {
				id: "AsyncRun",
				token: "token",
				python: python_code,
				targets: target_arr,
			}

			worker.postMessage(message);

			await sleep(1000);

			let last_call_data = spy.getCalls().slice(-1)[0].firstArg.data;
			expect(last_call_data.id).to.equal('BlockOP')
			expect(last_call_data.targetID).to.equal(target_arr[0])
			expect(last_call_data.op_code).to.equal('motion_pointindirection')
			expect(last_call_data.args).to.eql({ DIRECTION: 90 })
			expect(last_call_data.token).to.be.a('string')
		});

		it('Point Towards', async () => {

			const url = new URL('../src/pyodideWebWorker.mjs', import.meta.url);
			const worker = new Worker(url, { type: 'module' });
			const spy = sinon.spy();
			worker.onmessage = spy;

			const python_code = fs.readFileSync(path.join(__dirname, './python', 'single-target-pointtowards.py'), 'utf8');
			const target_arr = ['target1'];	

			const message = {
				id: "AsyncRun",
				token: "token",
				python: python_code,
				targets: target_arr,
			}

			worker.postMessage(message);

			await sleep(1000);

			let last_call_data = spy.getCalls().slice(-1)[0].firstArg.data;
			expect(last_call_data.id).to.equal('BlockOP')
			expect(last_call_data.targetID).to.equal(target_arr[0])
			expect(last_call_data.op_code).to.equal('motion_pointtowards')
			expect(last_call_data.args).to.eql({ TOWARDS: 'target1' })
			expect(last_call_data.token).to.be.a('string')
		});

		it('Glide', async () => {

			const url = new URL('../src/pyodideWebWorker.mjs', import.meta.url);
			const worker = new Worker(url, { type: 'module' });
			const spy = sinon.spy();
			worker.onmessage = spy;

			const python_code = fs.readFileSync(path.join(__dirname, './python', 'single-target-glide.py'), 'utf8');
			const target_arr = ['target1'];	

			const message = {
				id: "AsyncRun",
				token: "token",
				python: python_code,
				targets: target_arr,
			}

			worker.postMessage(message);

			await sleep(1000);

			let last_call_data = spy.getCalls().slice(-1)[0].firstArg.data;
			expect(last_call_data.id).to.equal('BlockOP')
			expect(last_call_data.targetID).to.equal(target_arr[0])
			expect(last_call_data.op_code).to.equal('motion_glidesecstoxy')
			expect(last_call_data.args).to.eql({ SECS: 1, X: 10, Y:5 })
			expect(last_call_data.token).to.be.a('string')
		});

		it('Glide To', async () => {

			const url = new URL('../src/pyodideWebWorker.mjs', import.meta.url);
			const worker = new Worker(url, { type: 'module' });
			const spy = sinon.spy();
			worker.onmessage = spy;

			const python_code = fs.readFileSync(path.join(__dirname, './python', 'single-target-glideto.py'), 'utf8');
			const target_arr = ['target1'];	

			const message = {
				id: "AsyncRun",
				token: "token",
				python: python_code,
				targets: target_arr,
			}

			worker.postMessage(message);

			await sleep(1000);

			let last_call_data = spy.getCalls().slice(-1)[0].firstArg.data;
			expect(last_call_data.id).to.equal('BlockOP')
			expect(last_call_data.targetID).to.equal(target_arr[0])
			expect(last_call_data.op_code).to.equal('motion_glideto')
			expect(last_call_data.args).to.eql({ SECS: 1, TO: 'target1' })
			expect(last_call_data.token).to.be.a('string')
		});

		it('If On Edge Bounce', async () => {

			const url = new URL('../src/pyodideWebWorker.mjs', import.meta.url);
			const worker = new Worker(url, { type: 'module' });
			const spy = sinon.spy();
			worker.onmessage = spy;

			const python_code = fs.readFileSync(path.join(__dirname, './python', 'single-target-ifonedgebounce.py'), 'utf8');
			const target_arr = ['target1'];	

			const message = {
				id: "AsyncRun",
				token: "token",
				python: python_code,
				targets: target_arr,
			}

			worker.postMessage(message);

			await sleep(1000);

			let last_call_data = spy.getCalls().slice(-1)[0].firstArg.data;
			expect(last_call_data.id).to.equal('BlockOP')
			expect(last_call_data.targetID).to.equal(target_arr[0])
			expect(last_call_data.op_code).to.equal('motion_ifonedgebounce')
			expect(last_call_data.args).to.eql({})
			expect(last_call_data.token).to.be.a('string')
		});

		it('Set Rotation Style', async () => {

			const url = new URL('../src/pyodideWebWorker.mjs', import.meta.url);
			const worker = new Worker(url, { type: 'module' });
			const spy = sinon.spy();
			worker.onmessage = spy;

			const python_code = fs.readFileSync(path.join(__dirname, './python', 'single-target-setrotationstyle.py'), 'utf8');
			const target_arr = ['target1'];	

			const message = {
				id: "AsyncRun",
				token: "token",
				python: python_code,
				targets: target_arr,
			}

			worker.postMessage(message);

			await sleep(1000);

			let last_call_data = spy.getCalls().slice(-1)[0].firstArg.data;
			expect(last_call_data.id).to.equal('BlockOP')
			expect(last_call_data.targetID).to.equal(target_arr[0])
			expect(last_call_data.op_code).to.equal('motion_setrotationstyle')
			expect(last_call_data.args).to.eql({ STYLE: 'free' })
			expect(last_call_data.token).to.be.a('string')
		});

		it('Change X', async () => {

			const url = new URL('../src/pyodideWebWorker.mjs', import.meta.url);
			const worker = new Worker(url, { type: 'module' });
			const spy = sinon.spy();
			worker.onmessage = spy;

			const python_code = fs.readFileSync(path.join(__dirname, './python', 'single-target-changex.py'), 'utf8');
			const target_arr = ['target1'];	

			const message = {
				id: "AsyncRun",
				token: "token",
				python: python_code,
				targets: target_arr,
			}

			worker.postMessage(message);

			await sleep(1000);

			let last_call_data = spy.getCalls().slice(-1)[0].firstArg.data;
			expect(last_call_data.id).to.equal('BlockOP')
			expect(last_call_data.targetID).to.equal(target_arr[0])
			expect(last_call_data.op_code).to.equal('motion_changexby')
			expect(last_call_data.args).to.eql({ DX: 10 })
			expect(last_call_data.token).to.be.a('string')
		});

		it('Set X', async () => {

			const url = new URL('../src/pyodideWebWorker.mjs', import.meta.url);
			const worker = new Worker(url, { type: 'module' });
			const spy = sinon.spy();
			worker.onmessage = spy;

			const python_code = fs.readFileSync(path.join(__dirname, './python', 'single-target-setx.py'), 'utf8');
			const target_arr = ['target1'];	

			const message = {
				id: "AsyncRun",
				token: "token",
				python: python_code,
				targets: target_arr,
			}

			worker.postMessage(message);

			await sleep(1000);

			let last_call_data = spy.getCalls().slice(-1)[0].firstArg.data;
			expect(last_call_data.id).to.equal('BlockOP')
			expect(last_call_data.targetID).to.equal(target_arr[0])
			expect(last_call_data.op_code).to.equal('motion_setx')
			expect(last_call_data.args).to.eql({ X: 10 })
			expect(last_call_data.token).to.be.a('string')
		});

		it('Change Y', async () => {

			const url = new URL('../src/pyodideWebWorker.mjs', import.meta.url);
			const worker = new Worker(url, { type: 'module' });
			const spy = sinon.spy();
			worker.onmessage = spy;

			const python_code = fs.readFileSync(path.join(__dirname, './python', 'single-target-changey.py'), 'utf8');
			const target_arr = ['target1'];	

			const message = {
				id: "AsyncRun",
				token: "token",
				python: python_code,
				targets: target_arr,
			}

			worker.postMessage(message);

			await sleep(1000);

			let last_call_data = spy.getCalls().slice(-1)[0].firstArg.data;
			expect(last_call_data.id).to.equal('BlockOP')
			expect(last_call_data.targetID).to.equal(target_arr[0])
			expect(last_call_data.op_code).to.equal('motion_changeyby')
			expect(last_call_data.args).to.eql({ DY: 10 })
			expect(last_call_data.token).to.be.a('string')
		});

		it('Set Y', async () => {

			const url = new URL('../src/pyodideWebWorker.mjs', import.meta.url);
			const worker = new Worker(url, { type: 'module' });
			const spy = sinon.spy();
			worker.onmessage = spy;

			const python_code = fs.readFileSync(path.join(__dirname, './python', 'single-target-sety.py'), 'utf8');
			const target_arr = ['target1'];	

			const message = {
				id: "AsyncRun",
				token: "token",
				python: python_code,
				targets: target_arr,
			}

			worker.postMessage(message);

			await sleep(1000);

			let last_call_data = spy.getCalls().slice(-1)[0].firstArg.data;
			expect(last_call_data.id).to.equal('BlockOP')
			expect(last_call_data.targetID).to.equal(target_arr[0])
			expect(last_call_data.op_code).to.equal('motion_sety')
			expect(last_call_data.args).to.eql({ Y: 10 })
			expect(last_call_data.token).to.be.a('string')
		});
	});
});
