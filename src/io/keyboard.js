const Cast = require('../util/cast');

class Keyboard {
    constructor (runtime) {
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
     * @private
     */
    _scratchKeyToKeyCode (keyName) {
        if (typeof keyName === 'number') {
            // Key codes placed in with number blocks.
            return keyName;
        }
        const keyString = Cast.toString(keyName);
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
    }

    /**
     * Convert a DOM keyCode into a Scratch key name.
     * @param  {number} keyCode Key code from DOM event.
     * @return {Any} Scratch key argument.
     * @private
     */
    _keyCodeToScratchKey (keyCode) {
        if (keyCode >= 48 && keyCode <= 90) {
            // Standard letter.
            return String.fromCharCode(keyCode).toLowerCase();
        }
        switch (keyCode) {
        case 32: return 'space';
        case 37: return 'left arrow';
        case 38: return 'up arrow';
        case 39: return 'right arrow';
        case 40: return 'down arrow';
        }
        return '';
    }

    /**
     * Keyboard DOM event handler.
     * @param  {object} data Data from DOM event.
     */
    postData (data) {
        if (data.keyCode) {
            const index = this._keysPressed.indexOf(data.keyCode);
            if (data.isDown) {
                // If not already present, add to the list.
                if (index < 0) {
                    this._keysPressed.push(data.keyCode);
                }
                // Always trigger hats, even if it was already pressed.
                this.runtime.startHats('event_whenkeypressed', {
                    KEY_OPTION: this._keyCodeToScratchKey(data.keyCode)
                });
                this.runtime.startHats('event_whenkeypressed', {
                    KEY_OPTION: 'any'
                });
            } else if (index > -1) {
                // If already present, remove from the list.
                this._keysPressed.splice(index, 1);
            }
        }
    }

    /**
     * Get key down state for a specified Scratch key name.
     * @param  {Any} key Scratch key argument.
     * @return {boolean} Is the specified key down?
     */
    getKeyIsDown (key) {
        if (key === 'any') {
            return this._keysPressed.length > 0;
        }
        const keyCode = this._scratchKeyToKeyCode(key);
        return this._keysPressed.indexOf(keyCode) > -1;
    }
}

module.exports = Keyboard;
