// const Base64Util = require('../util/base64-util');

// class ScratchLinkImplementation {
//     /**
//      * The "backend" implementation of scratch-link
//      * @param {ScratchLinkBridge} bridge The bridge back to the VM
//      */
//     constructor (bridge) {
//         this.bridge = bridge;
//         setTimeout(() => bridge.onopen());

//         this._device = null;
//     }

//     receive (msg) {
//         const json = JSON.parse(msg);
//         switch (json.method) {
//         case 'discover':
//             navigator.bluetooth.requestDevice({filters: json.params.filters})
//                 .then(device => {
//                     this._device = device;
//                     this._sendNotification('didDiscoverPeripheral', {
//                         peripheralId: this._device.id,
//                         name: this._device.name,
//                         rssi: 0
//                     });
//                 });
//             break;
//         case 'connect':
//             if (this._device) {
//                 this._device.gatt.connect()
//                     .then(server => {
//                         this._server = server;
//                         this._sendResponse(json.id, null);
//                         this._server.getPrimaryServices().then(services => {
//                             this._service = services[0];
//                         });
//                     });
//             }
//             break;
//         case 'read':
//             if (this._service) {
//                 this._service.getCharacteristic(json.params.characteristicId)
//                     .then(characteristic => {
//                         characteristic.oncharacteristicvaluechanged = () => {
//                             this._sendNotification('characteristicDidChange', {
//                                 serviceId: json.params.serviceId,
//                                 characteristicId: json.params.characteristicId,
//                                 message: Base64Util.arrayBufferToBase64(characteristic.value.buffer)
//                             });
//                         };
//                         characteristic.startNotifications(true);
//                     });
//             }
//             break;
//         case 'write':
//             this._service.getCharacteristic(json.params.characteristicId)
//                 .then(characteristic => {
//                     characteristic.writeValue(Base64Util.base64ToUint8Array(json.params.message))
//                         .then(() => {
//                             this._sendResponse(json.id, json.params.message.length);
//                         });
//                 });
//             break;
//         }

//         // startNotifications
//         // [getServices]
//         // [getCharacteristics]
//         // [stopNotifications]


//     }

//     end () {
//         setTimeout(() => this.bridge.onclose());
//     }

//     _sendNotification (method, params) {
//         const msg = JSON.stringify({
//             jsonrpc: '2.0',
//             method,
//             params
//         });
//         this._send(msg);
//     }

//     _sendResponse (id, result) {
//         const msg = JSON.stringify({
//             jsonrpc: '2.0',
//             result,
//             id
//         });
//         this._send(msg);
//     }

//     _send (msg) {
//         setTimeout(() => this.bridge.onmessage({data: msg}));
//     }
// }

// window.Android = window.Android || {
//     createLinkSession: () => {
//         console.log("Android#createLinkSession");
//         return "SESSION ID";
//     },

//     receiveLinkMessage: (id, msg) => {
//         console.log("Android#receiveLinkMessage", id, msg);
//     },

//     closeLinkSession: id => {
//         console.log("Android#closeLinkSession", id);
//     }
// };


// mWebView.evaluateScript('window.sendLinkMessage(...)');

class ScratchLinkBridge {
    constructor (type) {
        this.onopen = () => { };
        this.onerror = () => { };
        this.onclose = () => { };
        this.onmessage = () => { };
        this.readyState = 1;
        this.OPEN = 1;

        setTimeout(() => {
            this.sessionId = window.Android.createLinkSession(type);
            ScratchLinkBridge.sessions[this.sessionId] = this;
            this.onopen();
        });
    }

    send (msg) {
        setTimeout(() => {
            window.Android.receiveLinkMessage(this.sessionId, msg);
        });
    }

    close () {
        this.readyState = 0;
        window.Android.closeLinkSession(this.sessionId);
    }
}

ScratchLinkBridge.sessions = {};

window.sendLinkMessage = (sessionId, message) => {
    const bridge = ScratchLinkBridge.sessions[sessionId];
    if (bridge) {
        bridge.onmessage({data: message});
    }
};

window.closeLinkSession = sessionId => {
    const bridge = ScratchLinkBridge.sessions[sessionId];
    if (bridge) {
        bridge.onclose();
        delete ScratchLinkBridge.sessions[sessionId];
    }
};

module.exports = ScratchLinkBridge;
