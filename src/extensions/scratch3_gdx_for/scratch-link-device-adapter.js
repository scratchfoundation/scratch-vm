const Base64Util = require('../../util/base64-util');

/**
 * Adapter class
 */
class ScratchLinkDeviceAdapter {
    constructor (socket, {service, commandChar, responseChar}) {
        this.socket = socket;

        this._service = service;
        this._commandChar = commandChar;
        this._responseChar = responseChar;
        this._onResponse = this._onResponse.bind(this);
        this._deviceOnResponse = null;
    }

    get godirectAdapter () {
        return true;
    }

    writeCommand (commandBuffer) {
        const data = Base64Util.uint8ArrayToBase64(commandBuffer);

        return this.socket
            .write(this._service, this._commandChar, data, 'base64');
    }

    setup ({onResponse}) {
        this._deviceOnResponse = onResponse;
        return this.socket
            .startNotifications(this._service, this._responseChar, this._onResponse);

        // TODO:
        // How do we find out from scratch link if communication closes?
    }

    _onResponse (base64) {
        const array = Base64Util.base64ToUint8Array(base64);
        const response = new DataView(array.buffer);
        return this._deviceOnResponse(response);
    }
}

module.exports = ScratchLinkDeviceAdapter;
