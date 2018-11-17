const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = '';

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
        this.runtime = runtime;
        this.frameCounter = 0;
        setInterval(() => this.frameCounter++, this.runtime.currentStepTime);

        this.keyPressed = this.keyPressed.bind(this);
        this.runtime.on('KEY_PRESSED', this.keyPressed);

        this.sequenceMenu = [
            {text: 'left up right', value: 'left up right'},
            {text: 'right up left', value: 'right up left'},
            {text: 'left right', value: 'left right'},
            {text: 'right left', value: 'right left'},
            {text: 'up down', value: 'up down'},
            {text: 'down up', value: 'down up'},
            {text: 'up right down left', value: 'up right down left'},
            {text: 'space space space', value: 'space space space'},
            {text: 'up up down down left right left right', value: 'up up down down left right left right'}
        ];
        this.sequences = {};
        this.keyPressBuffer = [];
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
                            defaultValue: this.sequenceMenu[0].value
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
                SEQUENCE: this.sequenceMenu
            }
        };
    }

    whenMakeyKeyPressed (args, util) {
        const isDown = this.isKeyDown(args.KEY, util);
        return isDown && (this.frameCounter % 2 === 0);
    }

    whenMakeyKeyReleased (args, util) {
        return !this.isKeyDown(args.KEY, util);
    }

    // todo: clear the buffer after sequence complete?
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
                    // Clear the buffer
                    this.keyPressBuffer = [];
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
