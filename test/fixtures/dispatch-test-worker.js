const dispatch = require('../../src/dispatch/worker-dispatch');
const DispatchTestService = require('./dispatch-test-service');
const log = require('../../src/util/log');

dispatch.setService('RemoteDispatchTest', new DispatchTestService());

dispatch.waitForConnection.then(() => {
    dispatch.call('test', 'onWorkerReady').catch(e => {
        log(`Test worker failed to call onWorkerReady: ${JSON.stringify(e)}`);
    });
});
