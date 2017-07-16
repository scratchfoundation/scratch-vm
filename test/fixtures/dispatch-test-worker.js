const dispatch = require('../../src/dispatch/worker-dispatch');
const DispatchTestService = require('./dispatch-test-service');

dispatch.setService('RemoteDispatchTest', new DispatchTestService());

dispatch.waitForConnection.then(() => {
    dispatch.call('test', 'onWorkerReady');
});
