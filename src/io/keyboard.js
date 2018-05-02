const Cast = require('../util/cast');

class Keyboard {
    constructor (runtime) {
        /**
         * List of currently pressed scratch keys.
         * A scratch key is:
         * A key you can press on a keyboard, excluding modifier keys.
         * An uppercase string of length one;
         *     except for special key names for arrow keys and space (e.g. 'left arrow').
         * Can be a non-english unicode letter like: æ ø ש נ 手 廿.
         * @type{Array.<string>}
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
     * Names used for a set of special keys in Scratch.
     * @type {ScratchKey}
     */
    static get KEY_NAMES () {
        return {
            SPACE: 'space',
            LEFT: 'left arrow',
            UP: 'up arrow',
            RIGHT: 'right arrow',
            DOWN: 'down arrow'
        };
    }

    /**
     * Convert from a keyboard event key name to a Scratch key name.
     * @param  {string} keyString the input key string.
     * @return {string} the corresponding Scratch key, or an empty string.
     */
    _keyStringToScratchKey (keyString) {
        keyString = Cast.toString(keyString);
        // Convert space and arrow keys to their Scratch key names.
        switch (keyString) {
        case ' ': return Keyboard.KEY_NAMES.SPACE;
        case 'ArrowLeft':
        case 'Left': return Keyboard.KEY_NAMES.LEFT;
        case 'ArrowUp':
        case 'Up': return Keyboard.KEY_NAMES.UP;
        case 'Right':
        case 'ArrowRight': return Keyboard.KEY_NAMES.RIGHT;
        case 'Down':
        case 'ArrowDown': return Keyboard.KEY_NAMES.DOWN;
        }
        // Ignore modifier keys
        if (keyString.length > 1) {
            return '';
        }
        return keyString.toUpperCase();
    }

    /**
     * Convert from a block argument to a Scratch key name.
     * @param  {string} keyArg the input arg.
     * @return {string} the corresponding Scratch key.
     */
    _keyArgToScratchKey (keyArg) {
        // If a number was dropped in, try to convert from ASCII to Scratch key.
        if (typeof keyArg === 'number') {
            // Check for the ASCII range containing numbers, some punctuation,
            // and uppercase letters.
            if (keyArg >= 48 && keyArg <= 90) {
                return String.fromCharCode(keyArg);
            }
            switch (keyArg) {
            case 32: return Keyboard.KEY_NAMES.SPACE;
            case 37: return Keyboard.KEY_NAMES.LEFT;
            case 38: return Keyboard.KEY_NAMES.UP;
            case 39: return Keyboard.KEY_NAMES.RIGHT;
            case 40: return Keyboard.KEY_NAMES.DOWN;
            }
        }

        keyArg = Cast.toString(keyArg);

        // If the arg matches a special key name, return it.
        const keyNameList = Object.keys(Keyboard.KEY_NAMES).map(name => Keyboard.KEY_NAMES[name]);
        if (keyNameList.includes(keyArg)) {
            return keyArg;
        }

        // Use only the first character.
        if (keyArg.length > 1) {
            keyArg = keyArg[0];
        }

        // Check for the space character.
        if (keyArg === ' ') {
            return Keyboard.KEY_NAMES.SPACE;
        }

        return keyArg.toUpperCase();
    }

    /**
     * Keyboard DOM event handler.
     * @param  {object} data Data from DOM event.
     */
    postData (data) {
        if (!data.key) return;
        const scratchKey = this._keyStringToScratchKey(data.key);
        if (scratchKey === '') return;
        const index = this._keysPressed.indexOf(scratchKey);
        if (data.isDown) {
            // If not already present, add to the list.
            if (index < 0) {
                this._keysPressed.push(scratchKey);
            }
            // Always trigger hats, even if it was already pressed.
            this.runtime.startHats('event_whenkeypressed', {
                KEY_OPTION: scratchKey
            });
            this.runtime.startHats('event_whenkeypressed', {
                KEY_OPTION: 'any'
            });
        } else if (index > -1) {
            // If already present, remove from the list.
            this._keysPressed.splice(index, 1);
        }
    }

    /**
     * Get key down state for a specified key.
     * @param  {Any} keyArg key argument.
     * @return {boolean} Is the specified key down?
     */
    getKeyIsDown (keyArg) {
        if (keyArg === 'any') {
            return this._keysPressed.length > 0;
        }
        const scratchKey = this._keyArgToScratchKey(keyArg);
        return this._keysPressed.indexOf(scratchKey) > -1;
    }
}

module.exports = Keyboard;
