# Scratch 3.0 Extensions

This document describes technical topics related to Scratch 3.0 extension development, including the Scratch 3.0
extension specification.

For documentation regarding other aspects of Scratch 3.0 extensions see [this Extensions page on the
wiki](https://github.com/LLK/docs/wiki/Extensions).

## Types of Extensions

There are four types of extensions that can define everything from the Scratch's core library (such as the "Looks" and
"Operators" categories) to unofficial extensions that can be loaded from a remote URL.

**Scratch 3.0 does not yet support unofficial extensions.**

For more details, see [this Extensions page on the wiki](https://github.com/LLK/docs/wiki/Extensions).

|                                | Core | Team | Official | Unofficial |
| ------------------------------ | ---- | ---- | -------- | ---------- |
| Developed by Scratch Team      | √    | √    | O        | X          |
| Maintained by Scratch Team     | √    | √    | O        | X          |
| Shown in Library               | X    | √    | √        | X          |
| Sandboxed                      | X    | X    | √        | √          |
| Can save projects to community | √    | √    | √        | X          |

## JavaScript Environment

Most Scratch 3.0 is written using JavaScript features not yet commonly supported by browsers. For compatibility we
transpile the code to ES5 before publishing or deploying. Any extension included in the `scratch-vm` repository may
use ES6+ features and may use `require` to reference other code within the `scratch-vm` repository.

Unofficial extensions must be self-contained. Authors of unofficial extensions are responsible for ensuring browser
compatibility for those extensions, including transpiling if necessary.

## Translation

Scratch extensions use the [ICU message format](http://userguide.icu-project.org/formatparse/messages) to handle
translation across languages. For **core, team, and official** extensions, the function `formatMessage` is used to
wrap any ICU messages that need to be exported to the [Scratch Transifex group](https://www.transifex.com/llk/public/)
for translation.

**All extensions** may additionally define a `translation_map` object within the `getInfo` function which can provide
translations within an extension itself. The "Annotated Example" below provides a more complete illustration of how
translation within an extension can be managed. **WARNING:** the `translation_map` feature is currently in the
proposal phase and may change before implementation.

## Backwards Compatibility

Scratch is designed to be fully backwards compatible. Because of this, block definitions and opcodes should *never*
change in a way that could cause previously saved projects to fail to load or to act in unexpected / inconsistent
ways.

## Defining an Extension

Scratch extensions are defined as a single Javascript class which accepts either a reference to the Scratch
[VM](https://github.com/llk/scratch-vm) runtime or a "runtime proxy" which handles communication with the Scratch VM
across a well defined worker boundary (i.e. the sandbox).

```js
class SomeBlocks {
    constructor (runtime) {
        /**
         * Store this for later communication with the Scratch VM runtime.
         * If this extension is running in a sandbox then `runtime` is an async proxy object.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }

    // ...
}
```

All extensions must define a function called `getInfo` which returns an object that contains the information needed to
render both the blocks and the extension itself.

```js
// Core, Team, and Official extensions can `require` VM code:
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');

class SomeBlocks {
    // ...
    getInfo () {
        return {
            id: 'someBlocks',
            name: 'Some Blocks',
            blocks: [
                {
                    opcode: 'myReporter',
                    blockType: BlockType.REPORTER,
                    text: 'letter [LETTER_NUM] of [TEXT]',
                    arguments: {
                        LETTER_NUM: {
                            type: ArgumentType.STRING,
                            defaultValue: '1'
                        },
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'text'
                        }
                    }
                }
            ]
        };
    }
    // ...
}
```

Finally the extension must define a function for any "opcode" defined in the blocks. For example:

```js
class SomeBlocks {
    // ...
    myReporter (args) {
        return args.TEXT.charAt(args.LETTER_NUM);
    };
    // ...
}
```
### Block Arguments
In addition to displaying text, blocks can have arguments in the form of slots to take other blocks getting plugged in, or dropdown menus to select an argument value from a list of possible values.

The possible types of block arguments are as follows:

- String - a string input, this is a type-able field which also accepts other reporter blocks to be plugged in
- Number - an input similar to the string input, but the type-able values are constrained to numbers.
- Angle - an input similar to the number input, but it has an additional UI to be able to pick an angle from a
circular dial
- Boolean - an input for a boolean (hexagonal shaped) reporter block. This field is not type-able.
- Color - an input which displays a color swatch. This field has additional UI to pick a color by choosing values for the color's hue, saturation and brightness. Optionally, the defaultValue for the color picker can also be chosen if the extension developer wishes to display the same color every time the extension is added. If the defaultValue is left out, the default behavior of picking a random color when the extension is loaded will be used.
- Matrix - an input which displays a 5 x 5 matrix of cells, where each cell can be filled in or clear.
- Note - a numeric input which can select a musical note. This field has additional UI to select a note from a
visual keyboard.
- Image - an inline image displayed on a block. This is a special argument type in that it does not represent a value and does not accept other blocks to be plugged-in in place of this block field. See the section below about "Adding an Inline Image".

#### Adding an Inline Image
In addition to specifying block arguments (an example of string arguments shown in the code snippet above),
you can also specify an inline image for the block. You must include a dataURI for the image. If left unspecified, blank space will be allocated for the image and a warning will be logged in the console.
You can optionally also specify `flipRTL`, a property indicating whether the image should be flipped horizontally when the editor has a right to left language selected as its locale. By default, the image is not flipped.

```js
return {
    // ...
    blocks: [
        {
            //...
            arguments {
                MY_IMAGE: {
                    type: ArgumentType.IMAGE,
                    dataURI: 'myImageData',
                    alt: 'This is an image',
                    flipRTL: true
                }
            }
        }
    ]
}
```




#### Defining a Menu

To display a drop-down menu for a block argument, specify the `menu` property of that argument and a matching item in
the `menus` section of your extension's definition:

```js
return {
    // ...
    blocks: [
        {
            // ...
            arguments: {
                FOO: {
                    type: ArgumentType.NUMBER,
                    menu: 'fooMenu'
                }
            }
        }
    ],
    menus: {
        fooMenu: {
            items: ['a', 'b', 'c']
        }
    }
}
```

The items in a menu may be specified with an array or with the name of a function which returns an array. The two
simplest forms for menu definitions are:

```js
getInfo () {
    return {
        menus: {
            staticMenu: ['static 1', 'static 2', 'static 3'],
            dynamicMenu: 'getDynamicMenuItems'
        }
    };
}
// this member function will be called each time the menu opens
getDynamicMenuItems () {
    return ['dynamic 1', 'dynamic 2', 'dynamic 3'];
}
```

The examples above are shorthand for these equivalent definitions:

```js
getInfo () {
    return {
        menus: {
            staticMenu: {
                items: ['static 1', 'static 2', 'static 3']
            },
            dynamicMenu: {
                items: 'getDynamicMenuItems'
            }
        }
    };
}
// this member function will be called each time the menu opens
getDynamicMenuItems () {
    return ['dynamic 1', 'dynamic 2', 'dynamic 3'];
}
```

If a menu item needs a label that doesn't match its value -- for example, if the label needs to be displayed in the
user's language but the value needs to stay constant -- the menu item may be an object instead of a string. This works
for both static and dynamic menu items:

```js
menus: {
    staticMenu: [
        {
            text: formatMessage(/* ... */),
            value: 42
        }
    ]
}
```

##### Accepting reporters ("droppable" menus)

By default it is not possible to specify the value of a dropdown menu by inserting a reporter block. While we
encourage extension authors to make their menus accept reporters when possible, doing so requires careful
consideration to avoid confusion and frustration on the part of those using the extension.

A few of these considerations include:

* The valid values for the menu should not change when the user changes the Scratch language setting.
  * In particular, changing languages should never break a working project.
* The average Scratch user should be able to figure out the valid values for this input without referring to extension
  documentation.
  * One way to ensure this is to make an item's text match or include the item's value. For example, the official Music
    extension contains menu items with names like "(1) Piano" with value 1, "(8) Cello" with value 8, and so on.
* The block should accept any value as input, even "invalid" values.
  * Scratch has no concept of a runtime error!
  * For a command block, sometimes the best option is to do nothing.
  * For a reporter, returning zero or the empty string might make sense.
* The block should be forgiving in its interpretation of inputs.
  * For example, if the block expects a string and receives a number it may make sense to interpret the number as a
    string instead of treating it as invalid input.

The `acceptReporters` flag indicates that the user can drop a reporter onto the menu input:

```js
menus: {
    staticMenu: {
        acceptReporters: true,
        items: [/*...*/]
    },
    dynamicMenu: {
        acceptReporters: true,
        items: 'getDynamicMenuItems'
    }
}
```

## Annotated Example

```js
// Core, Team, and Official extensions can `require` VM code:
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const TargetType = require('../../extension-support/target-type');

// ...or VM dependencies:
const formatMessage = require('format-message');

// Core, Team, and Official extension classes should be registered statically with the Extension Manager.
// See: scratch-vm/src/extension-support/extension-manager.js
class SomeBlocks {
    constructor (runtime) {
        /**
         * Store this for later communication with the Scratch VM runtime.
         * If this extension is running in a sandbox then `runtime` is an async proxy object.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }

    /**
     * @return {object} This extension's metadata.
     */
    getInfo () {
        return {
            // Required: the machine-readable name of this extension.
            // Will be used as the extension's namespace.
            // Allowed characters are those matching the regular expression [\w-]: A-Z, a-z, 0-9, and hyphen ("-").
            id: 'someBlocks',

            // Core extensions only: override the default extension block colors.
            color1: '#FF8C1A',
            color2: '#DB6E00',

            // Optional: the human-readable name of this extension as string.
            // This and any other string to be displayed in the Scratch UI may either be
            // a string or a call to `formatMessage`; a plain string will not be
            // translated whereas a call to `formatMessage` will connect the string
            // to the translation map (see below). The `formatMessage` call is
            // similar to `formatMessage` from `react-intl` in form, but will actually
            // call some extension support code to do its magic. For example, we will
            // internally namespace the messages such that two extensions could have
            // messages with the same ID without colliding.
            // See also: https://github.com/yahoo/react-intl/wiki/API#formatmessage
            name: formatMessage({
                id: 'extensionName',
                defaultMessage: 'Some Blocks',
                description: 'The name of the "Some Blocks" extension'
            }),

            // Optional: URI for a block icon, to display at the edge of each block for this
            // extension. Data URI OK.
            // TODO: what file types are OK? All web images? Just PNG?
            blockIconURI: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAFCAAAAACyOJm3AAAAFklEQVQYV2P4DwMMEMgAI/+DEUIMBgAEWB7i7uidhAAAAABJRU5ErkJggg==',

            // Optional: URI for an icon to be displayed in the blocks category menu.
            // If not present, the menu will display the block icon, if one is present.
            // Otherwise, the category menu shows its default filled circle.
            // Data URI OK.
            // TODO: what file types are OK? All web images? Just PNG?
            menuIconURI: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAFCAAAAACyOJm3AAAAFklEQVQYV2P4DwMMEMgAI/+DEUIMBgAEWB7i7uidhAAAAABJRU5ErkJggg==',

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

                    // Required: the kind of block we're defining, from a predefined list.
                    // Fully supported block types:
                    //   BlockType.BOOLEAN - same as REPORTER but returns a Boolean value
                    //   BlockType.COMMAND - a normal command block, like "move {} steps"
                    //   BlockType.HAT - starts a stack if its value changes from falsy to truthy ("edge triggered")
                    //   BlockType.REPORTER - returns a value, like "direction"
                    // Block types in development or for internal use only:
                    //   BlockType.BUTTON - place a button in the block palette
                    //   BlockType.CONDITIONAL - control flow, like "if {}" or "if {} else {}"
                    //     A CONDITIONAL block may return the one-based index of a branch to
                    //     run, or it may return zero/falsy to run no branch.
                    //   BlockType.EVENT - starts a stack in response to an event (full spec TBD)
                    //   BlockType.LOOP - control flow, like "repeat {} {}" or "forever {}"
                    //     A LOOP block is like a CONDITIONAL block with two differences:
                    //     - the block is assumed to have exactly one child branch, and
                    //     - each time a child branch finishes, the loop block is called again.
                    blockType: BlockType.REPORTER,

                    // Required for CONDITIONAL blocks, ignored for others: the number of
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

                    // Required: the human-readable text on this block, including argument
                    // placeholders. Argument placeholders should be in [MACRO_CASE] and
                    // must be [ENCLOSED_WITHIN_SQUARE_BRACKETS].
                    text: formatMessage({
                        id: 'myReporter',
                        defaultMessage: 'letter [LETTER_NUM] of [TEXT]',
                        description: 'Label on the "myReporter" block'
                    }),

                    // Required: describe each argument.
                    // Argument order may change during translation, so arguments are
                    // identified by their placeholder name. In those situations where
                    // arguments must be ordered or assigned an ordinal, such as interaction
                    // with Scratch Blocks, arguments are ordered as they are in the default
                    // translation (probably English).
                    arguments: {
                        // Required: the ID of the argument, which will be the name in the
                        // args object passed to the implementation function.
                        LETTER_NUM: {
                            // Required: type of the argument / shape of the block input
                            type: ArgumentType.NUMBER,

                            // Optional: the default value of the argument
                            default: 1
                        },

                        // Required: the ID of the argument, which will be the name in the
                        // args object passed to the implementation function.
                        TEXT: {
                            // Required: type of the argument / shape of the block input
                            type: ArgumentType.STRING,

                                // Optional: the default value of the argument
                            default: formatMessage({
                                id: 'myReporter.TEXT_default',
                                defaultMessage: 'text',
                                description: 'Default for "TEXT" argument of "someBlocks.myReporter"'
                            })
                        }
                    },

                    // Optional: the function implementing this block.
                    // If absent, assume `func` is the same as `opcode`.
                    func: 'myReporter',

                    // Optional: list of target types for which this block should appear.
                    // If absent, assume it applies to all builtin targets -- that is:
                    // [TargetType.SPRITE, TargetType.STAGE]
                    filter: [TargetType.SPRITE]
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

                        // Optional: the human-readable label for this item.
                        // Use `value` as the text if this is absent.
                        text: formatMessage({
                            id: 'menuA_item1',
                            defaultMessage: 'Item One',
                            description: 'Label for item 1 of menu A in "Some Blocks" extension'
                        })
                    },

                    // The simplest form of a list item is a string which will be used as
                    // both value and text.
                    'itemId2'
                ],

                // Dynamic menu: returns an array as above.
                // Called each time the menu is opened.
                menuB: 'getItemsForMenuB',

                // The examples above are shorthand for setting only the `items` property in this full form:
                menuC: {
                    // This flag makes a "droppable" menu: the menu will allow dropping a reporter in for the input.
                    acceptReporters: true,

                    // The `item` property may be an array or function name as in previous menu examples.
                    items: [/*...*/] || 'getItemsForMenuC'
                }
            },

            // Optional: translations (UNSTABLE - NOT YET SUPPORTED)
            translation_map: {
                de: {
                    'extensionName': 'Einige Blöcke',
                    'myReporter': 'Buchstabe [LETTER_NUM] von [TEXT]',
                    'myReporter.TEXT_default': 'Text',
                    'menuA_item1': 'Artikel eins',

                    // Dynamic menus can be translated too
                    'menuB_example': 'Beispiel',

                    // This message contains ICU placeholders (see `myReporter()` below)
                    'myReporter.result': 'Buchstabe {LETTER_NUM} von {TEXT} ist {LETTER}.'
                },
                it: {
                    // ...
                }
            }
        };
    };

    /**
     * Implement myReporter.
     * @param {object} args - the block's arguments.
     * @property {string} MY_ARG - the string value of the argument.
     * @returns {string} a string which includes the block argument value.
     */
    myReporter (args) {
        // This message contains ICU placeholders, not Scratch placeholders
        const message = formatMessage({
            id: 'myReporter.result',
            defaultMessage: 'Letter {LETTER_NUM} of {TEXT} is {LETTER}.',
            description: 'The text template for the "myReporter" block result'
        });

        // Note: this implementation is not Unicode-clean; it's just here as an example.
        const result = args.TEXT.charAt(args.LETTER_NUM);

        return message.format({
            LETTER_NUM: args.LETTER_NUM,
            TEXT: args.TEXT,
            LETTER: result
        });
    };
}
```
