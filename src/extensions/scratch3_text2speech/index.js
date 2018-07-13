const formatMessage = require('format-message');
const nets = require('nets');

const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const log = require('../../util/log');

/**
 * The url of the synthesis server.
 * @type {string}
 */
const SERVER_HOST = 'https://synthesis-service.scratch.mit.edu';

/**
 * How long to wait in ms before timing out requests to synthesis server.
 * @type {int}
 */
const SERVER_TIMEOUT = 10000; // 10 seconds

/**
 * Class for the synthesis block in Scratch 3.0.
 * @constructor
 */
class Scratch3SpeakBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        // Clear sound effects on green flag and stop button events.
        // this._clearEffectsForAllTargets = this._clearEffectsForAllTargets.bind(this);
        if (this.runtime) {
            // @todo
            // this.runtime.on('PROJECT_STOP_ALL', this._clearEffectsForAllTargets);
        }

        /**
         * Locale code of the viewer
         * @type {string}
         * @private
         */
        this._language = this.getViewerLanguageCode();
    }

    /**
     * The key to load & store a target's synthesis state.
     * @return {string} The key.
     */
    static get STATE_KEY () {
        return 'Scratch.text2speech';
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: 'text2speech',
            name: 'Text-to-Speech',
            menuIconURI: '', // @todo Add the final icons.
            blockIconURI: '',
            blocks: [
                {
                    opcode: 'speakAndWait',
                    text: formatMessage({
                        id: 'speak.speakAndWaitBlock',
                        default: 'speak [WORDS]',
                        description: 'speak some words'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        WORDS: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'speak.defaultTextToSpeak',
                                default: 'hello',
                                description: 'hello: the default text to speak'
                            })
                        }
                    }
                }
            ],
            menus: {
                voices: this.supportedVoices
            }
        };
    }

    /**
     * Get the viewer's language code.
     * @return {string} the language code.
     */
    getViewerLanguageCode () {
        // @todo This should be the language code of the project *creator*
        // rather than the project viewer.
        return navigator.language || navigator.userLanguage || 'en-US';
    }

    /**
     * Return the supported voices for the extension.
     * @return {Array} Supported voices
     */
    supportedVoices () {
        return [
            'Quinn',
            'Max',
            'Squeak',
            'Monster',
            'Puppy'
        ];
    }

    /**
     * Convert the provided text into a sound file and then play the file.
     * @param  {object} args Block arguments
     * @return {Promise}     A promise that resolves after playing the sound
     */
    speakAndWait (args) {
        // Cast input to string
        args.WORDS = Cast.toString(args.WORDS);

        // Build up URL
        let path = `${SERVER_HOST}/synth`;
        path += `?locale=${this._language}`;
        path += `&gender=male`; // @todo
        path += `&text=${encodeURI(args.WORDS)}`;

        // Perform HTTP request to get audio file
        return new Promise(resolve => {
            nets({
                url: path,
                timeout: SERVER_TIMEOUT
            }, (err, res, body) => {
                if (err) {
                    log.warn(err);
                    return resolve();
                }

                if (res.statusCode !== 200) {
                    log.warn(res.statusCode);
                    return resolve();
                }

                // Play the sound
                const sound = {
                    // md5: 'test',
                    // name: 'test',
                    // format: 'audio/mpg',
                    data: {
                        buffer: body.buffer
                    }
                };
                this.runtime.audioEngine.decodeSoundPlayer(sound).then(soundPlayer => {
                    soundPlayer.connect(this.runtime.audioEngine);
                    soundPlayer.play();
                    soundPlayer.on('stop', resolve);
                });
            });
        });
    }
}
module.exports = Scratch3SpeakBlocks;
