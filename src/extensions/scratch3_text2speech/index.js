const formatMessage = require('format-message');
const nets = require('nets');

const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const Clone = require('../../util/clone');
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

const Voices = {
    QUINN: 'quinn',
    MAX: 'max',
    SQUEAK: 'squeak',
    MONSTER: 'monster',
    KITTEN: 'kitten'
};

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

        this.voice = this.getVoiceMenu()[0].value;

        /**
         * Locale code of the viewer
         * @type {string}
         * @private
         */
        this._language = this.getViewerLanguageCode();

        this._onTargetCreated = this._onTargetCreated.bind(this);
        runtime.on('targetWasCreated', this._onTargetCreated);
    }

    /**
     * The key to load & store a target's synthesis state.
     * @return {string} The key.
     */
    static get STATE_KEY () {
        return 'Scratch.text2speech';
    }

    /**
     * The default state, to be used when a target has no existing  state.
     * @type {Text2SpeechState}
     */
    static get DEFAULT_TEXT2SPEECH_STATE () {
        return {
            voice: Voices.QUINN
        };
    }

    /**
     * @param {Target} target - collect  state for this target.
     * @returns {Text2SpeechState} the mutable state associated with that target. This will be created if necessary.
     * @private
     */
    _getState (target) {
        let state = target.getCustomState(Scratch3SpeakBlocks.STATE_KEY);
        if (!state) {
            state = Clone.simple(Scratch3SpeakBlocks.DEFAULT_TEXT2SPEECH_STATE);
            target.setCustomState(Scratch3SpeakBlocks.STATE_KEY, state);
        }
        return state;
    }

    /**
     * When a Target is cloned, clone the state.
     * @param {Target} newTarget - the newly created target.
     * @param {Target} [sourceTarget] - the target used as a source for the new clone, if any.
     * @listens Runtime#event:targetWasCreated
     * @private
     */
    _onTargetCreated (newTarget, sourceTarget) {
        if (sourceTarget) {
            const state = sourceTarget.getCustomState(Scratch3SpeakBlocks.STATE_KEY);
            if (state) {
                newTarget.setCustomState(Scratch3SpeakBlocks.STATE_KEY, Clone.simple(state));
            }
        }
    }


    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: 'text2speech',
            name: 'Speech Synthesis',
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
                },
                {
                    opcode: 'setVoice',
                    text: formatMessage({
                        id: 'speak.setVoiceBlock',
                        default: 'set voice to [VOICE]',
                        description: 'set the voice for speech synthesis'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        VOICE: {
                            type: ArgumentType.STRING,
                            menu: 'voices',
                            defaultValue: Voices.QUINN
                        }
                    }
                }
            ],
            menus: {
                voices: this.getVoiceMenu()
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
        return formatMessage.setup().locale || navigator.language || navigator.userLanguage || 'en-US';
    }

    getVoiceMenu () {
        return [
            {
                text: Voices.QUINN,
                value: Voices.QUINN
            },
            {
                text: Voices.MAX,
                value: Voices.MAX
            },
            {
                text: Voices.SQUEAK,
                value: Voices.SQUEAK
            },
            {
                text: Voices.MONSTER,
                value: Voices.MONSTER
            },
            {
                text: Voices.KITTEN,
                value: Voices.KITTEN
            }
        ];
    }

    setVoice (args, util) {
        const state = this._getState(util.target);
        state.voice = args.VOICE;
    }

    /**
     * Convert the provided text into a sound file and then play the file.
     * @param  {object} args Block arguments
     * @param {object} util - utility object provided by the runtime.
     * @return {Promise}     A promise that resolves after playing the sound
     */
    speakAndWait (args, util) {
        // Cast input to string
        args.WORDS = Cast.toString(args.WORDS);

        const state = this._getState(util.target);

        let gender = 'female';
        if ((state.voice === Voices.MAX) || (state.voice === Voices.MONSTER)) {
            gender = 'male';
        }

        let playbackRate = 1;
        if (state.voice === Voices.SQUEAK) {
            playbackRate = 1.4;
        }
        if (state.voice === Voices.MONSTER) {
            playbackRate = 0.7;
        }
        if (state.voice === Voices.KITTEN) {
            playbackRate = 1.4;
        }

        if (this.voice === Voices.KITTEN) {
            const wordList = args.WORDS.split(' ');
            args.WORDS = wordList.reduce((acc, curr) => {
                let next = '';
                if (curr.length > 0) {
                    next = 'meow ';
                }
                return acc + next;
            }, '');
        }

        // Build up URL
        let path = `${SERVER_HOST}/synth`;
        path += `?locale=${this.getViewerLanguageCode()}`;
        path += `&gender=${gender}`;
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
                    data: {
                        buffer: body.buffer
                    }
                };
                this.runtime.audioEngine.decodeSoundPlayer(sound).then(soundPlayer => {
                    soundPlayer.connect(this.runtime.audioEngine);
                    soundPlayer.setPlaybackRate(playbackRate);
                    soundPlayer.play();
                    soundPlayer.on('stop', resolve);
                });
            });
        });
    }
}
module.exports = Scratch3SpeakBlocks;
