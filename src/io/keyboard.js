function Keyboard () {
    /**
     * List of currently pressed keys.
     * @type{Array.<number>}
     */
    this._keysPressed = [];
}

/**
 * Convert a Scratch key name to a DOM keyCode.
 * @param {?string} keyName Name of key.
 * @return {number} Key code corresponding to a DOM event.
 */
Keyboard.prototype._scratchKeyToKeyCode = function (keyName) {
    console.log(keyName);
    switch (keyName) {
    case 'space': return 32;
    case 'leftarrow': return 37;
    case 'uparrow': return 38;
    case 'rightarrow': return 39;
    case 'downarrow': return 40;
    // @todo: Consider adding other special keys here.
    }
    return keyName.toUpperCase().charCodeAt(0);
};

Keyboard.prototype.postData = function (data) {
    if (data.keyCode) {
        var index = this._keysPressed.indexOf(data.keyCode);
        if (data.isDown) {
            // If not already present, add to the list.
            if (index < 0) {
                this._keysPressed.push(data.keyCode);
            }
        } else if (index > -1) {
            // If already present, remove from the list.
            this._keysPressed.splice(index, 1);
        }
    }
};

Keyboard.prototype.getKeyIsDown = function (key) {
    if (key == 'any') {
        return this._keysPressed.length > 0;
    }
    var keyCode = this._scratchKeyToKeyCode(key);
    return this._keysPressed.indexOf(keyCode) > -1;
};

module.exports = Keyboard;
