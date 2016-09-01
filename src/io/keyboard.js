function Keyboard () {
    this._keyMap = {
        'space': false,
        'leftarrow': false,
        'rightarrow': false,
        'downarrow': false,
        'uparrow': false,
        'a': false,
        'b': false,
        'c': false,
        'd': false,
        'e': false,
        'f': false,
        'g': false,
        'h': false,
        'i': false,
        'j': false,
        'k': false,
        'm': false,
        'n': false,
        'o': false,
        'p': false,
        'q': false,
        'r': false,
        's': false,
        't': false,
        'u': false,
        'v': false,
        'w': false,
        'x': false,
        'y': false,
        '0': false,
        '1': false,
        '2': false,
        '3': false,
        '4': false,
        '5': false,
        '6': false,
        '7': false,
        '8': false,
        '9': false
    };
}

/**
 * Convert a browser keyCode to a Scratch key name.
 * @param {number} keyCode keyCode from a DOM event.
 * @return {?string} Name of key.
 */
Keyboard.prototype._keyCodeToScratchKey = function (keyCode) {
    if (keyCode >= 48 && keyCode <= 90) {
        // Standard letter.
        return String.fromCharCode(keyCode).toLowerCase();
    }
    switch (keyCode) {
    case 32: return 'space';
    case 37: return 'leftarrow';
    case 38: return 'uparrow';
    case 39: return 'rightarrow';
    case 40: return 'downarrow';
    }
    return null;
};

Keyboard.prototype.postData = function (data) {
    var key = this._keyCodeToScratchKey(data.keyCode);
    if (key) {
        this._keyMap[key] = data.isDown;
    }
};

Keyboard.prototype.getKeyIsDown = function (key) {
    if (key == 'any') {
        for (var k in this._keyMap) {
            if (this._keyMap[k]) return true;
        }
        return false;
    }
    return this._keyMap[key];
};

module.exports = Keyboard;
