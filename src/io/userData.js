class UserData {
    constructor () {
        this._username = '';
    }

    /**
     * Handler for updating the username
     * @param {object} data Data posted to this ioDevice.
     * @property {!string} username The new username.
     */
    postData (data) {
        this._username = data.username;
    }

    /**
     * Getter for username. Initially empty string, until set via postData.
     * @returns {!string} The current username
     */
    getUsername () {
        return this._username;
    }
}

module.exports = UserData;
