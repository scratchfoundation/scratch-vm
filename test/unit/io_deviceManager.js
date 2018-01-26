const test = require('tap').test;
const DeviceManager = require('../../src/io/deviceManager');

test('spec', t => {
    const deviceManager = new DeviceManager();

    t.type(DeviceManager, 'function');
    t.type(deviceManager, 'object');
    t.type(deviceManager.list, 'function');
    t.type(deviceManager.open, 'function');
    t.type(deviceManager.searchAndConnect, 'function');
    t.type(deviceManager.isConnected, 'boolean');
    t.end();
});

test('default connected', t => {
    const deviceManager = new DeviceManager();

    t.strictEqual(deviceManager.isConnected, true);
    t.end();
});

test('list', t => {
    const deviceManager = new DeviceManager();
    deviceManager
        .list('test', 'test', null)
        .then(
            body => {
                // SDM is running
                t.type(body, 'object');
                t.end();
            },
            err => {
                // If SDM is not running error is expected, continue
                t.true(typeof err === 'object' || typeof err === 'undefined');
                t.end();
            }
        );
});
