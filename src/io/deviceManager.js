const nets = require('nets');
const io = require('socket.io-client/dist/socket.io');
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
        /**
         * The DeviceManager client which wants to open a device.
         * @type {DeviceManager}
         * @private
         */
        this._deviceManager = deviceManager;

        /**
         * Callback to be called if the device is successfully found, connected, and opened.
         * @type {Function}
         * @private
         */
        this._resolve = resolve;

        /**
         * Callback to be called if an error or timeout is encountered.
         * @type {Function}
         * @private
         */
        this._reject = reject;

        /**
         * The socket for the device being opened.
         * @type {Socket}
         * @private
         */
        this._socket = null;

        /**
         * If this timeout expires before a successful connection, the connection attempt will be canceled.
         * @type {Object}
         * @private
         */
        this._connectionTimeout = null;
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
        this._socket = io(`${this._deviceManager._serverURL}/${deviceType}`);

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
     * @param {string} deviceType - the type of device to find, such as 'wedo2'.
     * @param {object} [deviceSpec] - optional additional information about the specific devices to list
     */
    constructor (deviceManager, extensionName, deviceType, deviceSpec) {
        /**
         * The Device Manager client which wants to find a device.
         * @type {DeviceManager}
         * @private
         */
        this._deviceManager = deviceManager;

        /**
         * The human-readable name of the extension requesting the search.
         * @type {string}
         * @private
         */
        this._extensionName = extensionName;

        /**
         * The type of device to find, such as 'wedo2'.
         * @type {string}
         * @private
         */
        this._deviceType = deviceType;

        /**
         * Optional additional information about the specific devices to list.
         * @type {Object}
         * @private
         */
        this._deviceSpec = deviceSpec;

        /**
         * Flag indicating that the search should be canceled.
         * @type {boolean}
         * @private
         */
        this._cancel = false;

        /**
         * The promise representing this search's results.
         * @type {Promise}
         * @private
         */
        this._promise = null;

        /**
         * The fulfillment function for `this._promise`.
         * @type {Function}
         * @private
         */
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
            .then(
                listResult => this._listResultHandler(listResult),
                () => this._listResultHandler(null)
            );
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
        /**
         * The URL this client will use for Device Manager communication both HTTP(S) and WS(S).
         * @type {string}
         * @private
         */
        this._serverURL = DeviceManager.DEFAULT_SERVER_URL;

        /**
         * True if there is no known problem connecting to the Scratch Device Manager, false otherwise.
         * @type {boolean}
         * @private
         */
        this._isConnected = true;
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
        return new Promise((resolve, reject) => {
            nets({
                method: 'GET',
                url: url,
                json: {}
            }, (err, res, body) => {
                if (err) return reject(err);
                if (res.statusCode !== 200) return reject(body);
                resolve(body);
            });
        });
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
