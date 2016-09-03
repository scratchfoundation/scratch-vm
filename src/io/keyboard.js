var Cast = require('../util/cast');

function Keyboard (runtime) {
    /**
     * List of currently pressed keys.
     * @type{Array.<number>}
     */
    this._keysPressed = [];
    /**
     * Reference to the owning Runtime.
     * Can be used, for example, to activate hats.
     * @type{!Runtime}
     */
    this.runtime = runtime;
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
    if (data.keyCode) {
        var index = this._keysPressed.indexOf(data.keyCode);
        if (data.isDown) {
            // If not already present, add to the list.
            if (index < 0) {
                this._keysPressed.push(data.keyCode);
                this.runtime.startHats('event_whenkeypressed',
                    {
                        'KEY_OPTION': this._keyCodeToScratchKey(data.keyCode)
                                          .toUpperCase()
                    });

                this.runtime.startHats('event_whenkeypressed',
                    {
                        'KEY_OPTION': 'ANY'
                    });
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
