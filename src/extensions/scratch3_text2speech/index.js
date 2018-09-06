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
 * Volume for playback of speech sounds, as a percentage.
 * @type {number}
 */
const SPEECH_VOLUME = 250;

/**
 * An id for one of the voices.
 */
const QUINN_ID = 'QUINN';

/**
 * An id for one of the voices.
 */
const MAX_ID = 'MAX';

/**
 * An id for one of the voices.
 */
const SQUEAK_ID = 'SQUEAK';

/**
 * An id for one of the voices.
 */
const MONSTER_ID = 'MONSTER';

/**
 * An id for one of the voices.
 */
const KITTEN_ID = 'KITTEN';

/**
 * An id for one of the voices.
 */
const PUPPY_ID = 'PUPPY';

/**
 * Class for the text2speech blocks.
 * @constructor
 */
class Scratch3SpeakBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        /**
         * Map of soundPlayers by sound id.
         * @type {Map<string, SoundPlayer>}
         */
        this._soundPlayers = new Map();

        this._stopAllSpeech = this._stopAllSpeech.bind(this);
        if (this.runtime) {
            this.runtime.on('PROJECT_STOP_ALL', this._stopAllSpeech);
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
            [QUINN_ID]: {
                name: formatMessage({
                    id: 'text2speech.quinn',
                    default: 'quinn',
                    description: 'Name for a voice with ambiguous gender.'
                }),
                gender: 'female',
                playbackRate: 1
            },
            [MAX_ID]: {
                name: formatMessage({
                    id: 'text2speech.max',
                    default: 'max',
                    description: 'Name for a voice with ambiguous gender.'
                }),
                gender: 'male',
                playbackRate: 1
            },
            [SQUEAK_ID]: {
                name: formatMessage({
                    id: 'text2speech.squeak',
                    default: 'squeak',
                    description: 'Name for a funny voice with a high pitch.'
                }),
                gender: 'female',
                playbackRate: 1.4
            },
            [MONSTER_ID]: {
                name: formatMessage({
                    id: 'text2speech.monster',
                    default: 'monster',
                    description: 'Name for a funny voice with a low pitch.'
                }),
                gender: 'male',
                playbackRate: 0.7
            },
            [KITTEN_ID]: {
                name: formatMessage({
                    id: 'text2speech.kitten',
                    default: 'kitten',
                    description: 'A baby cat.'
                }),
                gender: 'female',
                playbackRate: 1.4
            },
            [PUPPY_ID]: {
                name: formatMessage({
                    id: 'text2speech.puppy',
                    default: 'puppy',
                    description: 'A baby dog.'
                }),
                gender: 'male',
                playbackRate: 1.4
            }
        };
    }

    /**
     * The key to load & store a target's text2speech state.
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
            voiceId: QUINN_ID
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
            name: 'Text-to-Speech',
            menuIconURI: '', // @todo Add the final icons.
            blockIconURI: '',
            blocks: [
                {
                    opcode: 'speakAndWait',
                    text: formatMessage({
                        id: 'text2speech.speakAndWaitBlock',
                        default: 'speak [WORDS]',
                        description: 'Speak some words.'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        WORDS: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'text2speech.defaultTextToSpeak',
                                default: 'hello',
                                description: 'hello: the default text to speak'
                            })
                        }
                    }
                },
                {
                    opcode: 'setVoice',
                    text: formatMessage({
                        id: 'text2speech.setVoiceBlock',
                        default: 'set voice to [VOICE]',
                        description: 'Set the voice for speech synthesis.'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        VOICE: {
                            type: ArgumentType.STRING,
                            menu: 'voices',
                            defaultValue: QUINN_ID
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
        // so we probably need to create a lookup table. It will convert from these codes:
        // https://github.com/LLK/scratch-l10n/blob/master/src/supported-locales.js
        // to these codes:
        // https://docs.aws.amazon.com/polly/latest/dg/SupportedLanguage.html
        // but note also that only a subset of these languages have both male and female voices:
        // https://docs.aws.amazon.com/polly/latest/dg/voicelist.html
        return formatMessage.setup().locale || navigator.language || navigator.userLanguage || 'en-US';
    }

    /**
     * Get the menu of voices for the "set voice" block.
     * @return {array} the text and value for each menu item.
     */
    getVoiceMenu () {
        return Object.keys(this.VOICE_INFO).map(voiceId => ({
            text: this.VOICE_INFO[voiceId].name,
            value: voiceId
        }));
    }

    /**
     * Set the voice for speech synthesis for this sprite.
     * @param  {object} args Block arguments
     * @param {object} util Utility object provided by the runtime.
     */
    setVoice (args, util) {
        const state = this._getState(util.target);

        // Only set the voice if the arg is a valid voice id.
        if (Object.keys(this.VOICE_INFO).includes(args.VOICE)) {
            state.voiceId = args.VOICE;
        }
    }

    /**
     * Stop all currently playing speech sounds.
     */
    _stopAllSpeech () {
        this._soundPlayers.forEach(player => {
            player.stop();
        });
    }

    /**
     * Convert the provided text into a sound file and then play the file.
     * @param  {object} args Block arguments
     * @param {object} util Utility object provided by the runtime.
     * @return {Promise} A promise that resolves after playing the sound
     */
    speakAndWait (args, util) {
        // Cast input to string
        let words = Cast.toString(args.WORDS);

        const state = this._getState(util.target);

        const gender = this.VOICE_INFO[state.voiceId].gender;
        const playbackRate = this.VOICE_INFO[state.voiceId].playbackRate;

        let locale = this.getViewerLanguageCode();

        // @todo localize this?
        if (state.voiceId === KITTEN_ID) {
            words = words.replace(/\w+/g, 'meow');
        }

        // @todo localize this?
        if (state.voiceId === PUPPY_ID) {
            words = words.replace(/\w+/g, 'bark');
            words = words.split(' ').map(() => ['bark', 'woof', 'ruff'][Math.floor(Math.random() * 3)])
                .join(' ');
            locale = 'en-GB';
        }

        // Build up URL
        let path = `${SERVER_HOST}/synth`;
        path += `?locale=${locale}`;
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
                    this._soundPlayers.set(soundPlayer.id, soundPlayer);

                    soundPlayer.setPlaybackRate(playbackRate);

                    // Increase the volume
                    const engine = this.runtime.audioEngine;
                    const chain = engine.createEffectChain();
                    chain.set('volume', SPEECH_VOLUME);
                    soundPlayer.connect(chain);

                    soundPlayer.play();
                    soundPlayer.on('stop', () => {
                        this._soundPlayers.delete(soundPlayer.id);
                        resolve();
                    });
                });
            });
        });
    }
}
module.exports = Scratch3SpeakBlocks;
