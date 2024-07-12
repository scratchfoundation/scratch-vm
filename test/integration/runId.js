const Worker = require('web-worker');
const path = require('path');
const test = require('tap').test;

const VirtualMachine = require('../../src/index');
const dispatch = require('../../src/dispatch/central-dispatch');

const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;

// it doesn't really matter which project we use: we're testing side effects of loading any project
const uri = path.resolve(__dirname, '../fixtures/default.sb3');
const project = readFileToBuffer(uri);

// By default Central Dispatch works with the Worker class built into the browser. Tell it to use TinyWorker instead.
dispatch.workerClass = Worker;

test('runId', async t => {
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    const isGuid = data => guidRegex.test(data);

    const storage = makeTestStorage();

    // add to this list every time the RunId should have changed
    const runIdLog = [];
    const pushRunId = () => {
        const runId = storage.scratchFetch.getMetadata(storage.scratchFetch.RequestMetadata.RunId);
        t.ok(isGuid(runId), 'Run IDs should always be a properly-formatted GUID', {runId});
        runIdLog.push(runId);
    };

    const vm = new VirtualMachine();
    vm.attachStorage(storage);
    pushRunId(); // check that the initial run ID is valid

    vm.start(); // starts the VM, not the project, so this doesn't change the run ID

    vm.clear();
    pushRunId(); // clearing the project conceptually changes the project identity does it DOES change the run ID

    vm.setCompatibilityMode(false);
    vm.setTurboMode(false);
    await vm.loadProject(project);
    pushRunId();

    vm.greenFlag();
    pushRunId();

    // Turn the playgroundData event into a Promise that we can await
    const playgroundDataPromise = new Promise(resolve => {
        vm.on('playgroundData', data => resolve(data));
    });

    // Let the project run for a bit, then get playground data and stop the project
    // This test doesn't need the playground data but it does need to run & stop the project
    setTimeout(() => {
        vm.getPlaygroundData();
        vm.stopAll();
        pushRunId();
    }, 100);

    // wait for the project to run to completion
    await playgroundDataPromise;

    for (let i = 0; i < runIdLog.length - 1; ++i) {
        for (let j = i + 1; j < runIdLog.length; ++j) {
            t.notSame(runIdLog[i], runIdLog[j], 'Run IDs should always be unique', {runIdLog});
        }
    }

    vm.quit();
    t.end();
});
