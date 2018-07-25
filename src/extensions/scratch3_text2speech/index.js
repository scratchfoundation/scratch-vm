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

        // this._clearEffectsForAllTargets = this._clearEffectsForAllTargets.bind(this);
        if (this.runtime) {
            // @todo stop all voice sounds currently playing
            // this.runtime.on('PROJECT_STOP_ALL', this._clearEffectsForAllTargets);
        }

        this._onTargetCreated = this._onTargetCreated.bind(this);
        if (this.runtime) {
            runtime.on('targetWasCreated', this._onTargetCreated);
        }
    }

    /**
     * An object with info for each voice.
     */
    get VOICE_INFO () {
        return {
            QUINN: {
                id: 'QUINN',
                name: formatMessage({
                    id: 'text2speech.quinn',
                    default: 'quinn',
                    description: 'Name for a voice with ambiguous gender.'
                }),
                gender: 'female',
                playbackRate: 1
            },
            MAX: {
                id: 'MAX',
                name: formatMessage({
                    id: 'text2speech.max',
                    default: 'max',
                    description: 'Name for a voice with ambiguous gender.'
                }),
                gender: 'male',
                playbackRate: 1
            },
            SQUEAK: {
                id: 'SQUEAK',
                name: formatMessage({
                    id: 'text2speech.squeak',
                    default: 'squeak',
                    description: 'Name for a funny voice with a high pitch.'
                }),
                gender: 'female',
                playbackRate: 1.4
            },
            MONSTER: {
                id: 'MONSTER',
                name: formatMessage({
                    id: 'text2speech.monster',
                    default: 'monster',
                    description: 'Name for a funny voice with a low pitch.'
                }),
                gender: 'male',
                playbackRate: 0.7
            },
            KITTEN: {
                id: 'KITTEN',
                name: formatMessage({
                    id: 'text2speech.kitten',
                    default: 'kitten',
                    description: 'A baby cat.'
                }),
                gender: 'female',
                playbackRate: 1.4
            }
        };
    }

    /**
     * The key to load & store a target's synthesis state.
     * @return {string} The key.
     */
    static get STATE_KEY () {
        return 'Scratch.text2speech';
    }

    /**
     * The default state, to be used when a target has no existing state.
     * @type {Text2SpeechState}
     */
    static get DEFAULT_TEXT2SPEECH_STATE () {
        return {
            voiceId: 'QUINN'
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
                        description: 'Speak some words.'
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
                        description: 'Set the voice for speech synthesis.'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        VOICE: {
                            type: ArgumentType.STRING,
                            menu: 'voices',
                            defaultValue: this.VOICE_INFO.QUINN.id
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
        // @todo Amazon Polly needs the locale in a two part form (e.g. ja-JP),
        // so we probably need to create a lookup table.
        return formatMessage.setup().locale || navigator.language || navigator.userLanguage || 'en-US';
    }

    getVoiceMenu () {
        return [
            {
                text: this.VOICE_INFO.QUINN.name,
                value: this.VOICE_INFO.QUINN.id
            },
            {
                text: this.VOICE_INFO.MAX.name,
                value: this.VOICE_INFO.MAX.id
            },
            {
                text: this.VOICE_INFO.SQUEAK.name,
                value: this.VOICE_INFO.SQUEAK.id
            },
            {
                text: this.VOICE_INFO.MONSTER.name,
                value: this.VOICE_INFO.MONSTER.id
            },
            {
                text: this.VOICE_INFO.KITTEN.name,
                value: this.VOICE_INFO.KITTEN.id
            }
        ];
    }

    setVoice (args, util) {
        const state = this._getState(util.target);
        // Only set the voice if the arg is a valid voice id.
        Object.values(this.VOICE_INFO).forEach(voice => {
            if (args.VOICE === voice.id) {
                state.voiceId = args.VOICE;
            }
        });
    }

    /**
     * Convert the provided text into a sound file and then play the file.
     * @param  {object} args Block arguments
     * @param {object} util - utility object provided by the runtime.
     * @return {Promise}     A promise that resolves after playing the sound
     */
    speakAndWait (args, util) {
        // Cast input to string
        let words = Cast.toString(args.WORDS);

        const state = this._getState(util.target);

        const gender = this.VOICE_INFO[state.voiceId].gender;
        const playbackRate = this.VOICE_INFO[state.voiceId].playbackRate;

        if (state.voiceId === this.VOICE_INFO.KITTEN.id) {
            words = words.replace(/\w+/g, 'meow');
        }

        // Build up URL
        let path = `${SERVER_HOST}/synth`;
        path += `?locale=${this.getViewerLanguageCode()}`;
        path += `&gender=${gender}`;
        path += `&text=${encodeURI(words)}`;

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
