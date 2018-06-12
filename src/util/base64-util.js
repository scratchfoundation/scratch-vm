class Base64Util {

    // TODO: method signature
    static base64ToUint8Array (base64) {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const array = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            array[i] = binaryString.charCodeAt(i);
        }
        return array;
    }

    // TODO: method signature
    static uint8ArrayToBase64 (array) {
        const base64 = btoa(String.fromCharCode.apply(null, array));
        return base64;
    }

}

module.exports = Base64Util;
