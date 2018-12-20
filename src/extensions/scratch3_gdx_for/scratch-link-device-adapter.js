const Base64Util = require('../../util/base64-util');

/**
 * Enum for Vernier godirect protocol.
 * @readonly
 * @enum {string}
 */
const BLEUUID = {
    service: 'd91714ef-28b9-4f91-ba16-f0d9a604f112',
    commandChar: 'f4bf14a6-c7d5-4b6d-8aa8-df1a7c83adcb',
    responseChar: 'b41e6675-a329-40e0-aa01-44d2f444babe'
};

/**
 * Adapter class
 */
class ScratchLinkDeviceAdapter {
    constructor (scratchLinkNativeDevice) {
        this.scratchLinkNativeDevice = scratchLinkNativeDevice;

        this._onResponse = this._onResponse.bind(this);
        this._deviceOnResponse = null;
    }

    get godirectAdapter () {
        return true;
    }

    writeCommand (commandBuffer) {
        const data = Base64Util.uint8ArrayToBase64(commandBuffer);

        return this.scratchLinkNativeDevice
            .write(BLEUUID.service, BLEUUID.commandChar, data, 'base64', true);
    }

    setup ({onClosed, onResponse}) {
        this._deviceOnResponse = onResponse;
        return this.scratchLinkNativeDevice
            .startNotifications(BLEUUID.service, BLEUUID.responseChar, this._onResponse);

        // TODO:
        // How do we find out from scratch link if communication closes?
    }

    _onResponse (base64) {
        const array = Base64Util.base64ToUint8Array(base64);
        const response = new DataView(array.buffer);
        return this._deviceOnResponse(response);
    }

    close () {
        return this.scratchLinkNativeDevice.disconnect();
    }
}

module.exports = ScratchLinkDeviceAdapter;
