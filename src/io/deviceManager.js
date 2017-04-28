const got = require('got');
const io = require('socket.io-client');
const querystring = require('querystring');

/**
 * Internal class used by the Device Manager client to manage making a connection to a particular device.
 */
class DeviceOpener {
    /**
     * @return {number} - The number of milliseconds to allow before deciding a connection attempt has timed out.
     */
    static get CONNECTION_TIMEOUT_MS () {
        return 10 * 1000;
    }

    /**
     * Construct a DeviceOpener to help connect to a particular device.
     * @param {DeviceManager} deviceManager - the Device Manager client which instigated this action.
     * @param {function} resolve - callback to be called if the device is successfully found, connected, and opened.
     * @param {function} reject - callback to be called if an error or timeout is encountered.
     */
    constructor (deviceManager, resolve, reject) {
        this._deviceManager = deviceManager;
        this._resolve = resolve;
        this._reject = reject;
    }

    /**
     * Attempt to open a particular device. This will cause `resolve` or `reject` to be called.
     * Note that in some cases it's possible that both `resolve` and `reject` will be called. In that event, ignore all
     * calls after the first. If `resolve` and `reject` are from a Promise, then the Promise will do this for you.
     * @param {string} extensionName - human-readable name of the extension requesting the device
     * @param {string} deviceType - the type of device to open, such as 'wedo2'
     * @param {string} deviceId - the ID of the particular device to open, usually from list results
     */
    open (extensionName, deviceType, deviceId) {
        this._socket = /** @type {Socket} */ io(`${this._deviceManager._serverURL}/${deviceType}`);
        this._deviceManager._sockets.push(this._socket);

        this._socket.on('deviceWasOpened', () => this.onDeviceWasOpened());
        this._socket.on('disconnect', () => this.onDisconnect());
        this._connectionTimeout = setTimeout(() => this.onTimeout(), DeviceOpener.CONNECTION_TIMEOUT_MS);

        this._socket.emit('open', {deviceId: deviceId, name: extensionName});
    }

    /**
     * React to a 'deviceWasOpened' message from the Device Manager application.
     */
    onDeviceWasOpened () {
        this.clearConnectionTimeout();
        this._resolve(this._socket);
    }

    /**
     * React to the socket becoming disconnected.
     */
    onDisconnect () {
        this.removeSocket();
        this.clearConnectionTimeout();
        this._reject('device disconnected');
    }

    /**
     * React to the connection timeout expiring. This could mean that the socket itself timed out, or that the Device
     * Manager took too long to send a 'deviceWasOpened' message back.
     */
    onTimeout () {
        this.clearConnectionTimeout();

        // `socket.disconnect()` triggers `onDisconnect` only for connected sockets
        if (this._socket.connected) {
            this._socket.disconnect();
        } else {
            this.removeSocket();
            this._reject('connection attempt timed out');
        }
    }

    /**
     * Cancel the connection timeout.
     */
    clearConnectionTimeout () {
        if (this._connectionTimeout !== null) {
            clearTimeout(this._connectionTimeout);
            this._connectionTimeout = null;
        }
    }

    /**
     * Remove the socket we were using for a now-failed connection attempt.
     */
    removeSocket () {
        const socketIndex = this._deviceManager._sockets.indexOf(this._socket);
        if (socketIndex >= 0) {
            this._deviceManager._sockets.splice(socketIndex, 1);
        }
    }
}

/**
 * A DeviceFinder implements the Device Manager client's `searchAndConnect` functionality.
 * Use the `promise` property to access a promise for a device socket.
 * Call `cancel()` to cancel the search. Once the search finds a device it cannot be canceled.
 */
class DeviceFinder {
    /**
     * @return {number} - the number of milliseconds to wait between search attempts (calls to 'list')
     */
    static get SEARCH_RETRY_MS () {
        return 1000;
    }

    /**
     * Construct a DeviceFinder to help find and connect to a device satisfying specific conditions.
     * @param {DeviceManager} deviceManager - the Device Manager client which instigated this action.
     * @param {string} extensionName - human-readable name of the extension requesting the search
     * @param {string} deviceType - the type of device to list, such as 'wedo2'
     * @param {object} [deviceSpec] - optional additional information about the specific devices to list
     */
    constructor (deviceManager, extensionName, deviceType, deviceSpec) {
        this._deviceManager = deviceManager;
        this._extensionName = extensionName;
        this._deviceType = deviceType;
        this._deviceSpec = deviceSpec;
        this._cancel = false;
        this._promise = null;
        this._fulfill = null;
    }

    /**
     * @return {Promise} - A promise for a device socket.
     */
    get promise () {
        return this._promise;
    }

    /**
     * Start searching for a device.
     */
    start () {
        this._promise = new Promise((fulfill, reject) => {
            this._fulfill = fulfill;
            this._reject = reject;
            this._getList();
        });
    }

    /**
     * Cancel the search for a device. Effective only before the promise resolves.
     */
    cancel () {
        this._cancel = true;
        this._reject('canceled');
    }

    /**
     * Fetch the list of devices matching the parameters provided in the constructor.
     * @private
     */
    _getList () {
        this._deviceManager
            .list(this._extensionName, this._deviceType, this._deviceSpec)
            .then(listResult => this._listResultHandler(listResult));
    }

    /**
     * Handle the list of devices returned by the Device Manager.
     * @param {Array} listResult - an array of device information objects.
     * @private
     */
    _listResultHandler (listResult) {
        if (this._cancel) {
            return;
        }

        if (listResult && listResult.length > 0) {
            for (const deviceInfo of listResult) {
                if (!deviceInfo.connected) {
                    this._fulfill(this._deviceManager.open(this._extensionName, this._deviceType, deviceInfo.id));
                    return;
                }
            }
        }

        setTimeout(() => this._getList(), DeviceFinder.SEARCH_RETRY_MS);
    }
}

/**
 * A Scratch 3.0 "I/O Device" representing a client for the Scratch Device Manager.
 */
class DeviceManager {
    /**
     * @return {string} - The default Scratch Device Manager connection URL.
     */
    static get DEFAULT_SERVER_URL () {
        return 'https://device-manager.scratch.mit.edu:3030';
    }

    constructor () {
        this._serverURL = DeviceManager.DEFAULT_SERVER_URL;
        this._isConnected = true;
        this._sockets = [];
    }

    /**
     * @return {boolean} - True if there is no known problem connecting to the Scratch Device Manager, false otherwise.
     */
    get isConnected () {
        return this._isConnected;
    }

    /**
     * High-level request to find and connect to a device satisfying the specified characteristics.
     * This function will repeatedly call list() until the list is non-empty, then it will open() the first suitable
     * item in the list and provide the socket for that device.
     * @todo Offer a way to filter results. See the Scratch 2.0 PicoBoard extension for details on why that's important.
     * @param {string} extensionName - human-readable name of the extension requesting the search
     * @param {string} deviceType - the type of device to list, such as 'wedo2'
     * @param {object} [deviceSpec] - optional additional information about the specific devices to list
     * @return {DeviceFinder} - An object providing a Promise for an opened device and a way to cancel the search.
     */
    searchAndConnect (extensionName, deviceType, deviceSpec) {
        const finder = new DeviceFinder(this, extensionName, deviceType, deviceSpec);
        finder.start();
        return finder;
    }

    /**
     * Request a list of available devices.
     * @param {string} extensionName - human-readable name of the extension requesting the list
     * @param {string} deviceType - the type of device to list, such as 'wedo2'
     * @param {object} [deviceSpec] - optional additional information about the specific devices to list
     * @return {Promise} - A Promise for an Array of available devices.
     */
    list (extensionName, deviceType, deviceSpec) {
        const queryObject = {
            name: extensionName
        };
        if (deviceSpec) queryObject.spec = deviceSpec;
        const url = `${this._serverURL}/${encodeURIComponent(deviceType)}/list?${querystring.stringify(queryObject)}`;
        return got(url).then(response => JSON.parse(response.body));
    }

    /**
     * Attempt to open a particular device.
     * @param {string} extensionName - human-readable name of the extension requesting the device
     * @param {string} deviceType - the type of device to open, such as 'wedo2'
     * @param {string} deviceId - the ID of the particular device to open, usually from list results
     * @return {Promise} - A Promise for a Socket which can be used to communicate with the device
     */
    open (extensionName, deviceType, deviceId) {
        return new Promise((resolve, reject) => {
            const opener = new DeviceOpener(this, resolve, reject);
            opener.open(extensionName, deviceType, deviceId);
        });
    }
}

module.exports = DeviceManager;
