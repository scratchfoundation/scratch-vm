class PeripheralChooser {

    get chosenPeripheralId () {
        return this._chosenPeripheralId;
    }

    /**
     * Creates a peripheral chooser.
     */
    constructor () {
        this._availablePeripherals = []; // for use in GUI
        this._chosenPeripheralId = null; // for returning to ScratchBLE/BT/etc.
    }

    /**
     * Launches a GUI menu to choose a peripheral.
     * @return {Promise} - chosen peripheral promise
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
     * Adds the peripheral ID to list of available peripherals.
     * @param {number} peripheralId - the id to add.
     */
    addPeripheral (peripheralId /* , RSSI, etc? */) {
        this._availablePeripherals.push(peripheralId); // for use in GUI

        // TODO: Temp Hack to call chosen callback on whatever peripherals are added for now
        this._chosenPeripheralId = this._availablePeripherals[0];
        this._tempPeripheralChosenCallback(this._chosenPeripheralId);
    }

}

module.exports = PeripheralChooser;
