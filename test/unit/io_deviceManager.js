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

test('cancel searchAndConnect', t => {
    const deviceManager = new DeviceManager();

    const finder = deviceManager.searchAndConnect('test extension', 'test device');

    let resolved = false;
    let rejected = false;
    const testPromise = finder.promise
        .then(
            () => {
                resolved = true;
            },
            () => {
                rejected = true;
            }
        )
        .then(() => {
            t.strictEqual(resolved, false);
            t.strictEqual(rejected, true);
        });
    finder.cancel();

    return testPromise;
});
