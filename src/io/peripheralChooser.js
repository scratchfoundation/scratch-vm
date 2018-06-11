class PeripheralChooser {

    get chosenPeripheralId () {
        return this._chosenPeripheralId;
    }

    /**
     * TODO: method signature
     */
    constructor () {
        this._availablePeripherals = []; // for use in GUI
        this._chosenPeripheralId = null; // for returning to ScratchBLE/BT/etc.
    }

    /**
     * TODO: method signature
     */
    choosePeripheral () {
        return new Promise((resolve, reject) => {
            // TODO: Launch GUI
            // TODO: Set chosen _chosenPeripheralId ??
            // TODO: do something with resolve
            // TODO: do something with reject
            this._tempPeripheralChosenCallback = resolve; // TODO: Temp Hack to grab this callback
        });
    }

    /**
     * TODO: method signature
     */
    addPeripheral (peripheralId /* , RSSI, etc? */) {
        this._availablePeripherals.push(peripheralId); // for use in GUI

        // TODO: Temp Hack to call chosen callback on whatever peripherals are added for now
        this._chosenPeripheralId = this._availablePeripherals[0];
        this._tempPeripheralChosenCallback(this._chosenPeripheralId);
    }

}

module.exports = PeripheralChooser;
