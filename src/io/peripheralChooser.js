class PeripheralChooser {

    get choosePeripheral () {
        return this._choosePromise;
    }

    get chosenPeripheralId () {
        return this._chosenPeripheralId;
    }

    constructor () {
        this._choosePromise = new Promise((resolve, reject) => {
            this._choosePeripheral = resolve;
            this._cancel = reject;
        });

        this._chosenPeripheralId = null;
    }

    updatePeripheral (peripheralId /* , RSSI */) {
        this._chosenPeripheralId = peripheralId;

        /* cwf
        // just accept the first peripheral
        //this._choosePeripheral(peripheralId);

        // in a React/Redux version this sets Redux state instead
        */
    }

}

module.exports = PeripheralChooser;
