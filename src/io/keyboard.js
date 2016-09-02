var Cast = require('../util/cast');

function Keyboard () {
    /**
     * List of currently pressed keys.
     * @type{Array.<number>}
     */
    this._keysPressed = [];
}

/**
 * Convert a Scratch key name to a DOM keyCode.
 * @param {Any} keyName Scratch key argument.
 * @return {number} Key code corresponding to a DOM event.
 */
Keyboard.prototype._scratchKeyToKeyCode = function (keyName) {
    if (typeof keyName == 'number') {
        // Key codes placed in with number blocks.
        return keyName;
    }
    var keyString = Cast.toString(keyName);
    switch (keyString) {
    case 'space': return 32;
    case 'left arrow': return 37;
    case 'up arrow': return 38;
    case 'right arrow': return 39;
    case 'down arrow': return 40;
    // @todo: Consider adding other special keys here.
    }
    // Keys reported by DOM keyCode are upper case.
    return keyString.toUpperCase().charCodeAt(0);
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
