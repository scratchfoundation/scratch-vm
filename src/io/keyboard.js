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
        const keyString = Cast.toString(keyName);
        switch (keyString) {
        case ' ': return 'space';
        case 'ArrowLeft': return 'left arrow';
        case 'ArrowRight': return 'right arrow';
        case 'ArrowUp': return 'up arrow';
        case 'ArrowDown': return 'down arrow';
        }
        return keyName;
    }

    /**
     * Convert a DOM keyCode into a Scratch key name.
     * @param  {number} keyCode Key code from DOM event.
     * @return {Any} Scratch key argument.
     * @private
     */
    _keyCodeToScratchKey (keyCode) {
        return keyCode;
    }

    /**
     * Keyboard DOM event handler.
     * @param  {object} data Data from DOM event.
     */
    postData (data) {
        const keyCode = this._scratchKeyToKeyCode(data.key);
        if (keyCode) {
            const index = this._keysPressed.indexOf(keyCode);
            if (data.isDown) {
                // If not already present, add to the list.
                if (index < 0) {
                    this._keysPressed.push(keyCode);
                }
                // Always trigger hats, even if it was already pressed.
                this.runtime.startHats('event_whenkeypressed', {
                    KEY_OPTION: this._keyCodeToScratchKey(keyCode)
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
