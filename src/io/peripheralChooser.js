class PeripheralChooser {

    get chosenPeripheralId () {
        return this._chosenPeripheralId;
    }

    constructor () {
        this._availablePeripherals = []; // TODO for use in gui?
        this._chosenPeripheralId = null;
    }

    /**
     * Launches a GUI menu to choose a peripheral.
     * @return {Promise} - chosen peripheral promise.
     */
    choosePeripheral () {
        return new Promise((resolve, reject) => {
            // TODO: Temporary: should launch gui instead.
            this._tempPeripheralChosenCallback = resolve;
            this._tempPeripheralChosenReject = reject;
        });
    }

    /**
     * Adds the peripheral ID to list of available peripherals.
     * @param {number} peripheralId - the id to add.
     */
    addPeripheral (peripheralId) {
        this._availablePeripherals.push(peripheralId);

        // TODO: Temporary: calls chosen callback on whatever peripherals are added.
        this._chosenPeripheralId = this._availablePeripherals[0];
        this._tempPeripheralChosenCallback(this._chosenPeripheralId);
    }

}

module.exports = PeripheralChooser;
