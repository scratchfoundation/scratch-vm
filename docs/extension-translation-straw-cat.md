Not really a proposal, more a starting point for discussion. Currently only considering extensions.

Essentially strings turn into an array of `['default string', 'translation-key']`, and  `translation_map` has a dictionary for each language code supported. When someone switches language, the dictionary for the corresponding language code should be used if available.

# Example

```js
class SomeBlocks {
    constructor (runtimeProxy) {
        /**
         * A proxy to communicate with the Scratch 3.0 runtime across a worker boundary.
         * @type {Runtime}
         */
        this.runtime = runtimeProxy;
    }

    /**
     * @return {object} This extension's metadata.
     */
    getInfo () {
        return {
            // Required: the machine-readable name of this extension.
            // Will be used as the extension's namespace.
            id: 'someBlocks',

            // Optional: the human-readable name of this extension as string or array.
            // If not present, use the ID.
            // If an array, first element is default text, second is the id
            // of the string in the translation map
            name: ['Some Blocks', 'someBlocks'],

            // Optional: URI for an icon for this extension. Data URI OK.
            // If not present, use a generic icon.
            // TODO: what file types are OK? All web images? Just PNG?
            iconURI: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAFCAAAAACyOJm3AAAAFklEQVQYV2P4DwMMEMgAI/+DEUIMBgAEWB7i7uidhAAAAABJRU5ErkJggg==',

            // Optional: Link to documentation content for this extension.
            // If not present, offer no link.
            docsURI: 'https://....',

            // Required: the list of blocks implemented by this extension,
            // in the order intended for display.
            blocks: [
                {
                    // Required: the machine-readable name of this operation.
                    // This will appear in project JSON.
                    opcode: 'myReporter', // becomes 'someBlocks.myReporter'

                    // Required: the kind of block we're defining, from a predefined list:
                    // 'command' - a normal command block, like "move {} steps"
                    // 'reporter' - returns a value, like "direction"
                    // 'Boolean' - same as 'reporter' but returns a Boolean value
                    // 'hat' - starts a stack if its value is truthy
                    // 'conditional' - control flow, like "if {}" or "repeat {}"
                    // A 'conditional' block may return the one-based index of a branch
                    // to run, or it may return zero/falsy to run no branch. Each time a
                    // child branch finishes, the block is called again. This is only a
                    // slight change to the current model for control flow blocks, and is
                    // also compatible with returning true/false for an "if" or "repeat"
                    // block.
                    // TODO: Consider Blockly-like nextStatement, previousStatement, and
                    // output attributes as an alternative. Those are more flexible, but
                    // allow bad combinations.
                    blockType: 'reporter',

                    // Required for conditional blocks, ignored for others: the number of
                    // child branches this block controls. An "if" or "repeat" block would
                    // specify a branch count of 1; an "if-else" block would specify a
                    // branch count of 2.
                    // TODO: should we support dynamic branch count for "switch"-likes?
                    branchCount: 0,

                    // Optional, default false: whether or not this block ends a stack.
                    // The "forever" and "stop all" blocks would specify true here.
                    terminal: true,

                    // Optional, default false: whether or not to block all threads while
                    // this block is busy. This is for things like the "touching color"
                    // block in compatibility mode, and is only needed if the VM runs in a
                    // worker. We might even consider omitting it from extension docs...
                    blockAllThreads: false,

                    // Required: the human-readable text on this block, as a map from IETF
                    // language tags to strings in ICU message format. Note that
                    // '{MY_ARG,string}' tells the extension system the name and type of
                    // this argument. If the type is found in the `menus` object below,
                    // then this is a menu. If the extension only supplies one language,
                    // this may be a single string instead of a map.
                    // I make no claims about the correctness of my German grammar...
                    text: ['give {MY_ARG} to my reporter', 'myReporter_text']

                    // Optional: each argument may specify a default value.
                    // If absent, the default is a blank/empty field.
                    defaults: {
                        MY_ARG: ['some string', 'MY_ARG_default']
                    }

                    // Required: the function implementing this block.
                    func: this.myReporter,

                    // Optional: list of target types for which this block should appear.
                    // If absent, assume it applies to all builtin targets -- that is:
                    // ['sprite', 'stage']
                    filter: ['someBlocks.wedo2', 'sprite', 'stage']
                },
                {
                    // Another block...
                }
            ],

            // Optional: define extension-specific menus here.
            menus: {
                // Required: an identifier for this menu, unique within this extension.
                menuA: [
                    // Static menu: list items which should appear in the menu.
                    {
                        // Required: the value of the menu item when it is chosen.
                        value: 'itemId1',

                        // Optional: the human-readable label for this item, in ICU format.
                        // Use `value` as the text if this is absent.
                        text: ['Item One', 'menuA_item1']
                    },

                    // The simplest form of a list item is a string which will be used as
                    // both value and text.
                    'itemId2'
                ],

                // Dynamic menu: returns an array as above.
                // Called each time the menu is opened.
                menuB: this.getItemsForMenuB
            },

            // Optional: translations
            translation_map: {
                'de' : {
                    'someBlocks' : 'Einige Blöcke',
                    'myReporter_text' : 'Gib {MY_ARG} zu meinem Reporter',
                    'myReporter_val' : '{my_arg} ist mein wert'
                    'MY_ARG_default' : 'etwas inhalt',
                    'menuA_item1' : 'Artikel eins',
                    'menuB_default' : 'Beispiel' //default to use for getItemsForMenuB
                },
                'it' : {
                    ...
                }
            }

            // Optional: list new target type(s) provided by this extension.
            targetTypes: [
                'wedo2', // automatically transformed to 'someBlocks.wedo2'
                'speech' // automatically transformed to 'someBlocks.speech'
            ]
        };
    }

    /**
     * Implement myReporter.
     * @param {object} args - the block's arguments.
     * @property {string} MY_ARG - the string value of the argument.
     * @returns {string} a string which includes the block argument value.
     */
    myReporter (args) {
        //return `${args.MY_ARG} is my argument`;
        return _trans(['{my_arg} is my argument', myReporter_val], {'my_arg' : args.MY_ARG})
    }
}
```

# Questions and Issues
* What about collisions? If two extensions have 'MY_ARG_default', they shouldn't collide. Should the keys include the extension id: 'someBlocks.MY_ARG_default', or should we assume that the strings will get loaded into a map that is name-spaced by extension:
```
'someBlocks' : {
  ...
  'MY_ARG_default' : 'something',
  ...
},
'otherExt' : {
  ...
  'MY_ARG_default' : 'something else',
  ...
}
```
* Should we insist that the default is English?
* If people want to provide additional translations, how are the original key:strings extracted, and how are new translations included? Do we expect ongoing translation of extensions?
* Should we provide translation for the extension functions as in `_trans` in the myReporter function? How likely are extensions to actually return strings?
* Using ICU formatted strings, by default arguments are only typed if they are number, date or time. We may want to know what type of argument is allowed (e.g. Boolean) to determine the look of the block, but that probably doesn't belong in the translation string.
* This assumes that we'll do some sort of mapping from ICU format `'give {MY_ARG} to my reporter'` to Blockly `'give %1 to my reporter'`. An alternative would be to use Blockly type string format in extensions.
