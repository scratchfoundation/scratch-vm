class PeripheralChooser {

    get chosenPeripheralId () {
        return this._chosenPeripheralId;
    }

    constructor (runtime) {
        this._runtime = runtime;
        this._availablePeripherals = {};
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
     * @param {object} info - the peripheral info object.
     */
    addPeripheral (info) {
        // Add a new peripheral, or if the id is already present, update it
        this._availablePeripherals[info.peripheralId] = info;

        const peripheralArray = Object.keys(this._availablePeripherals).map(id =>
            this._availablePeripherals[id]
        );

        // @todo: sort peripherals by signal strength? or maybe not, so they don't jump around?

        this._runtime.emit(this._runtime.constructor.PERIPHERAL_LIST_UPDATE, peripheralArray);

        // TODO: Temporary: calls chosen callback on whatever peripherals are added.
        // this._chosenPeripheralId = this._availablePeripherals[0];
        // this._tempPeripheralChosenCallback(this._chosenPeripheralId);
    }

}

module.exports = PeripheralChooser;
