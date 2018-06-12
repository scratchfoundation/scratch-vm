class PeripheralChooser {

    get chosenPeripheralId () {
        return this._chosenPeripheralId;
    }

    constructor () {
        this._availablePeripherals = []; // for use in GUI
        this._chosenPeripheralId = null; // for returning to ScratchBLE/BT/etc.
    }

    /**
     * Launches a GUI menu to choose a peripheral.
     * @return {promise} - chosen peripheral promise.
     */
    choosePeripheral () {
        return new Promise((resolve, reject) => {
            // TODO: Temporary. Launch GUI instead.
            this._tempPeripheralChosenCallback = resolve;
        });
    }

    /**
     * Adds the peripheral ID to list of available peripherals.
     * @param {number} peripheralId - the id to add.
     */
    addPeripheral (peripheralId) {
        this._availablePeripherals.push(peripheralId);

        // TODO: Temp Hack to call chosen callback on whatever peripherals are added
        this._chosenPeripheralId = this._availablePeripherals[0];
        this._tempPeripheralChosenCallback(this._chosenPeripheralId);
    }

}

module.exports = PeripheralChooser;
