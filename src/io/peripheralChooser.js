const log = require('../util/log');

class PeripheralChooser {

    get choosePeripheral () {
        // should return a promise
        return this._choosePromise;
    }

    get chosenPeripheralId () {
        return this._chosenPeripheralId;
    }

    constructor () {
        this._choosePromise = new Promise((resolve, reject) => {
            this._discoverCallback = resolve; // TODO: what about UI?
            this._cancel = reject; // TODO: when to use this callback?
        });

        this._chosenPeripheralId = null;
    }

    updatePeripheral (peripheralId /* , RSSI */) {
        this._chosenPeripheralId = peripheralId;

        this._discoverCallback(this._chosenPeripheralId);
    }

}

module.exports = PeripheralChooser;
