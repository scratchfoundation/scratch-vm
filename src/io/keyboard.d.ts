export = Keyboard;
declare class Keyboard {
    constructor(runtime: any);
    /**
     * List of currently pressed scratch keys.
     * A scratch key is:
     * A key you can press on a keyboard, excluding modifier keys.
     * An uppercase string of length one;
     *     except for special key names for arrow keys and space (e.g. 'left arrow').
     * Can be a non-english unicode letter like: æ ø ש נ 手 廿.
     * @type{Array.<string>}
     */
    _keysPressed: Array<string>;
    /**
     * Reference to the owning Runtime.
     * Can be used, for example, to activate hats.
     * @type{!Runtime}
     */
    runtime: Runtime;
    /**
     * Convert from a keyboard event key name to a Scratch key name.
     * @param  {string} keyString the input key string.
     * @return {string} the corresponding Scratch key, or an empty string.
     */
    _keyStringToScratchKey(keyString: string): string;
    /**
     * Convert from a block argument to a Scratch key name.
     * @param  {string} keyArg the input arg.
     * @return {string} the corresponding Scratch key.
     */
    _keyArgToScratchKey(keyArg: string): string;
    /**
     * Keyboard DOM event handler.
     * @param  {object} data Data from DOM event.
     */
    postData(data: object): void;
    /**
     * Get key down state for a specified key.
     * @param  {Any} keyArg key argument.
     * @return {boolean} Is the specified key down?
     */
    getKeyIsDown(keyArg: Any): boolean;
}
