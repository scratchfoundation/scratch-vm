const formatMessage = require('format-message');
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCI+PHN0eWxlPi5zdDJ7ZmlsbDpyZWR9LnN0M3tmaWxsOiNlMGUwZTB9LnN0NHtmaWxsOm5vbmU7c3Ryb2tlOiM2NjY7c3Ryb2tlLXdpZHRoOi41O3N0cm9rZS1taXRlcmxpbWl0OjEwfTwvc3R5bGU+PHBhdGggZD0iTTM1LjIgMjcuOUg0LjhhMSAxIDAgMCAxLTEtMVYxMi4xYzAtLjYuNS0xIDEtMWgzMC41Yy41IDAgMSAuNCAxIDFWMjdhMSAxIDAgMCAxLTEuMS45eiIgZmlsbD0iI2ZmZiIgaWQ9IkxheWVyXzYiLz48ZyBpZD0iTGF5ZXJfNCI+PHBhdGggY2xhc3M9InN0MiIgZD0iTTMuOCAyNC43aDMyLjN2Mi45SDMuOHpNMTMgMjRoLTIuMmExIDEgMCAwIDEtMS0xdi05LjdjMC0uNi40LTEgMS0xSDEzYy42IDAgMSAuNCAxIDFWMjNjMCAuNi0uNSAxLTEgMXoiLz48cGF0aCBjbGFzcz0ic3QyIiBkPSJNNi4xIDE5LjN2LTIuMmMwLS41LjQtMSAxLTFoOS43Yy41IDAgMSAuNSAxIDF2Mi4yYzAgLjUtLjUgMS0xIDFINy4xYTEgMSAwIDAgMS0xLTF6Ii8+PGNpcmNsZSBjbGFzcz0ic3QyIiBjeD0iMjIuOCIgY3k9IjE4LjIiIHI9IjMuNCIvPjxjaXJjbGUgY2xhc3M9InN0MiIgY3g9IjMwLjYiIGN5PSIxOC4yIiByPSIzLjQiLz48cGF0aCBjbGFzcz0ic3QyIiBkPSJNNC4yIDI3aDMxLjl2LjdINC4yeiIvPjwvZz48ZyBpZD0iTGF5ZXJfNSI+PHBhdGggY2xhc3M9InN0MyIgZD0iTTQuOCAyOC4xdi0uOWMwLS43LjYtMS4zIDEuNC0xLjNoMjcuN2MuOCAwIDEuNC42IDEuNCAxLjN2LjlINC44eiIvPjxjaXJjbGUgY2xhc3M9InN0MyIgY3g9IjIyLjgiIGN5PSIxOC4yIiByPSIyLjMiLz48Y2lyY2xlIGNsYXNzPSJzdDMiIGN4PSIzMC42IiBjeT0iMTguMiIgcj0iMi4zIi8+PHBhdGggY2xhc3M9InN0MyIgZD0iTTEyLjUgMjIuOWgtMS4yYy0uMyAwLS41LS4yLS41LS41VjE0YzAtLjMuMi0uNS41LS41aDEuMmMuMyAwIC41LjIuNS41djguNGMwIC4zLS4yLjUtLjUuNXoiLz48cGF0aCBjbGFzcz0ic3QzIiBkPSJNNy4yIDE4Ljd2LTEuMmMwLS4zLjItLjUuNS0uNWg4LjRjLjMgMCAuNS4yLjUuNXYxLjJjMCAuMy0uMi41LS41LjVINy43Yy0uMyAwLS41LS4yLS41LS41eiIvPjwvZz48ZyBpZD0iTGF5ZXJfMyI+PHBhdGggY2xhc3M9InN0NCIgZD0iTTM1LjIgMjcuOUg0LjhhMSAxIDAgMCAxLTEtMVYxMi4xYzAtLjYuNS0xIDEtMWgzMC41Yy41IDAgMSAuNCAxIDFWMjdhMSAxIDAgMCAxLTEuMS45eiIvPjxwYXRoIGNsYXNzPSJzdDQiIGQ9Ik0zNS4yIDI3LjlINC44YTEgMSAwIDAgMS0xLTFWMTIuMWMwLS42LjUtMSAxLTFoMzAuNWMuNSAwIDEgLjQgMSAxVjI3YTEgMSAwIDAgMS0xLjEuOXoiLz48L2c+PC9zdmc+';

/**
 * Length of the buffer to store key presses for the "when keys pressed in order" hat
 * @type {number}
 */
const KEY_BUFFER_LENGTH = 100;

/**
 * Timeout in milliseconds to reset the completed flag for a sequence.
 * @type {number}
 */
const SEQUENCE_HAT_TIMEOUT = 100;

/**
 * Class for the makey makey blocks in Scratch 3.0
 * @constructor
 */
class Scratch3MakeyMakeyBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        /**
         * A toggle that alternates true and false each frame, so that an
         * edge-triggered hat can trigger on every other frame.
         * @type {boolean}
         */
        this.frameToggle = false;

        // Set an interval that toggles the frameToggle every frame.
        setInterval(() => {
            this.frameToggle = !this.frameToggle;
        }, this.runtime.currentStepTime);

        this.keyPressed = this.keyPressed.bind(this);
        this.runtime.on('KEY_PRESSED', this.keyPressed);

        this.sequences = {};

        this.keyPressBuffer = [];
    }

    get KEY_NAME () {
        return {
            SPACE: 'space',
            LEFT: 'left arrow',
            UP: 'up arrow',
            RIGHT: 'right arrow',
            DOWN: 'down arrow'
        };
    }

    get KEY_TEXT () {
        return {
            [this.KEY_NAME.SPACE]: formatMessage({
                id: 'makeymakey.spaceKey',
                default: 'space',
                description: 'The space key on a computer keyboard.'
            }),
            [this.KEY_NAME.LEFT]: formatMessage({
                id: 'makeymakey.leftArrow',
                default: 'left arrow',
                description: 'The left arrow key on a computer keyboard.'
            }),
            [this.KEY_NAME.UP]: formatMessage({
                id: 'makeymakey.upArrow',
                default: 'up arrow',
                description: 'The up arrow key on a computer keyboard.'
            }),
            [this.KEY_NAME.RIGHT]: formatMessage({
                id: 'makeymakey.rightArrow',
                default: 'right arrow',
                description: 'The right arrow key on a computer keyboard.'
            }),
            [this.KEY_NAME.DOWN]: formatMessage({
                id: 'makeymakey.downArrow',
                default: 'down arrow',
                description: 'The down arrow key on a computer keyboard.'
            })
        };
    }

    get KEY_NAME_SHORT () {
        return {
            SPACE: 'space',
            LEFT: 'left',
            UP: 'up',
            RIGHT: 'right',
            DOWN: 'down'
        };
    }

    get KEY_TEXT_SHORT () {
        return {
            [this.KEY_NAME_SHORT.SPACE]: formatMessage({
                id: 'makeymakey.spaceKeyShort',
                default: 'space',
                description: 'Short name for the space key on a computer keyboard.'
            }),
            [this.KEY_NAME_SHORT.LEFT]: formatMessage({
                id: 'makeymakey.leftArrowShort',
                default: 'left',
                description: 'Short name for the left arrow key on a computer keyboard.'
            }),
            [this.KEY_NAME_SHORT.UP]: formatMessage({
                id: 'makeymakey.upArrowShort',
                default: 'up',
                description: 'Short name for the up arrow key on a computer keyboard.'
            }),
            [this.KEY_NAME_SHORT.RIGHT]: formatMessage({
                id: 'makeymakey.rightArrowShort',
                default: 'right',
                description: 'Short name for the right arrow key on a computer keyboard.'
            }),
            [this.KEY_NAME_SHORT.DOWN]: formatMessage({
                id: 'makeymakey.downArrowShort',
                default: 'down',
                description: 'Short name for the down arrow key on a computer keyboard.'
            })
        };
    }
    get DEFAULT_SEQUENCES () {
        return [
            'left up right',
            'right up left',
            'left right',
            'right left',
            'up down',
            'down up',
            'up right down left',
            'space space space',
            'up up down down left right left right'
        ];
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: 'makeymakey',
            name: 'Makey Makey',
            blockIconURI: blockIconURI,
            blocks: [
                {
                    opcode: 'whenMakeyKeyPressed',
                    text: 'when [KEY] key pressed',
                    blockType: BlockType.HAT,
                    arguments: {
                        KEY: {
                            type: ArgumentType.STRING,
                            menu: 'KEY',
                            defaultValue: 'space'
                        }
                    }
                },
                {
                    opcode: 'whenCodePressed',
                    text: 'when [SEQUENCE] pressed in order',
                    blockType: BlockType.HAT,
                    arguments: {
                        SEQUENCE: {
                            type: ArgumentType.STRING,
                            menu: 'SEQUENCE',
                            defaultValue: this.DEFAULT_SEQUENCES[0]
                        }
                    }
                }
            ],
            menus: {
                KEY: [
                    {text: 'space', value: 'space'},
                    {text: 'left arrow', value: 'left arrow'},
                    {text: 'right arrow', value: 'right arrow'},
                    {text: 'down arrow', value: 'down arrow'},
                    {text: 'up arrow', value: 'up arrow'},
                    {text: 'w', value: 'w'},
                    {text: 'a', value: 'a'},
                    {text: 's', value: 's'},
                    {text: 'd', value: 'd'},
                    {text: 'f', value: 'f'},
                    {text: 'g', value: 'g'}
                ],
                SEQUENCE: this.buildSequenceMenu(this.DEFAULT_SEQUENCES)
            }
        };
    }

    buildSequenceMenu (sequencesArray) {
        return sequencesArray.map(
            str => this.getMenuItemForSequenceString(str)
        );
    }

    getMenuItemForSequenceString (sequenceString) {
        const menuItem = {
            text: '',
            value: sequenceString
        };
        const sequenceArray = sequenceString.split(' ');
        sequenceArray.forEach(str => {
            const text = this.KEY_TEXT_SHORT[str];
            menuItem.text += ` ${text}`;
        });
        return menuItem;
    }

    whenMakeyKeyPressed (args, util) {
        const isDown = this.isKeyDown(args.KEY, util);
        return (isDown && this.frameToggle);
    }

    whenMakeyKeyReleased (args, util) {
        return !this.isKeyDown(args.KEY, util);
    }

    keyPressed (key) {
        this.keyPressBuffer.push(key);
        // Keep the buffer under the length limit
        if (this.keyPressBuffer.length > KEY_BUFFER_LENGTH) {
            this.keyPressBuffer.shift();
        }
        // Check the buffer for each sequence in use
        for (const str in this.sequences) {
            const arr = this.sequences[str].array;
            // Bail out if we don't have enough presses for this sequence
            if (this.keyPressBuffer.length < arr.length) {
                continue;
            }
            let missFlag = false;
            // Slice the buffer to the length of the sequence we're checking
            const bufferSegment = this.keyPressBuffer.slice(-1 * arr.length);
            for (let i = 0; i < arr.length; i++) {
                if (arr[i] !== bufferSegment[i]) {
                    missFlag = true;
                }
            }
            // If the miss flag is false, the sequence matched the buffer
            if (!missFlag) {
                this.sequences[str].completed = true;
                // Clear the completed flag after a timeout. This is necessary because
                // the hat is edge-triggered (not event triggered). Multiple hats
                // may be checking the same sequence, so this timeout gives them enough
                // time to all trigger before resetting the flag.
                setTimeout(() => {
                    this.sequences[str].completed = false;
                }, SEQUENCE_HAT_TIMEOUT);
            }
        }
    }

    addSequence (sequenceString, sequenceArray) {
        // If we already have this sequence string, return.
        if (this.sequences.hasOwnProperty(sequenceString)) {
            return;
        }
        // Convert shorthand versions of arrow key names.
        const newArray = sequenceArray.map(entry => {
            switch (entry) {
            case 'left': return 'left arrow';
            case 'right': return 'right arrow';
            case 'down': return 'down arrow';
            case 'up': return 'up arrow';
            case 'space': return 'space';
            }
            return entry.toUpperCase();
        });
        const newSeq = {
            array: newArray,
            completed: false
        };
        this.sequences[sequenceString] = newSeq;
    }

    whenCodePressed (args) {
        const sequenceString = Cast.toString(args.SEQUENCE);
        const sequenceArray = sequenceString.split(' ');
        if (sequenceArray.length < 2) {
            return;
        }
        this.addSequence(sequenceString, sequenceArray);

        return this.sequences[sequenceString].completed;
    }

    isKeyDown (keyArg, util) {
        return util.ioQuery('keyboard', 'getKeyIsDown', [keyArg]);
    }
}
module.exports = Scratch3MakeyMakeyBlocks;
