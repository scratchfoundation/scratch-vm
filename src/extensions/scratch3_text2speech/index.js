const formatMessage = require('format-message');
const nets = require('nets');

const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const MathUtil = require('../../util/math-util');
const Clone = require('../../util/clone');
const log = require('../../util/log');

/**
 * Icon svg to be displayed in the blocks category menu, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const menuIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMjBweCIgaGVpZ2h0PSIyMHB4IiB2aWV3Qm94PSIwIDAgMjAgMjAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDUyLjIgKDY3MTQ1KSAtIGh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaCAtLT4KICAgIDx0aXRsZT5FeHRlbnNpb25zL1NvZnR3YXJlL1RleHQtdG8tU3BlZWNoLU1lbnU8L3RpdGxlPgogICAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CiAgICA8ZyBpZD0iRXh0ZW5zaW9ucy9Tb2Z0d2FyZS9UZXh0LXRvLVNwZWVjaC1NZW51IiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8ZyBpZD0idGV4dDJzcGVlY2giIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIuMDAwMDAwLCAyLjAwMDAwMCkiIGZpbGwtcnVsZT0ibm9uemVybyI+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik01Ljc1LDguODM0NjcxNzMgQzUuNzUsOC4zMjY5NjM0NCA1LjAwMzAwNzI3LDguMDQyMjEzNzEgNC41NTYyODAxMiw4LjQ0NDE0OTk5IEwzLjIwNjI4MDEyLDkuNTI1MzU3MDIgQzIuNjk2NzMzNzgsOS45MzM0NDk2OCAyLjAzNzQ4Njc1LDEwLjE2NTg3ODggMS4zNSwxMC4xNjU4Nzg4IEwxLjE1LDEwLjE2NTg3ODggQzAuNjMyNTk2MTY1LDEwLjE2NTg3ODggMC4yNSwxMC41MTA2MDAyIDAuMjUsMTAuOTUyMDM1NSBMMC4yNSwxMy4wNjkzOTkzIEMwLjI1LDEzLjUxMDgzNDYgMC42MzI1OTYxNjUsMTMuODU1NTU2IDEuMTUsMTMuODU1NTU2IEwxLjM1LDEzLjg1NTU1NiBDMi4wNzg3Nzg0MSwxMy44NTU1NTYgMi43MjY4NjE2MSwxNC4wNjY3NjM2IDMuMjU5ODYwNDksMTQuNDk5IEw0LjU1OTIwMTQ3LDE1LjU3OTY2MDggQzUuMDEzMDkyNzYsMTUuOTU0NTM5NiA1Ljc1LDE1LjY3MzYzNDQgNS43NSwxNS4xNDE3MTI4IEw1Ljc1LDguODM0NjcxNzMgWiIgaWQ9InNwZWFrZXIiIHN0cm9rZS1vcGFjaXR5PSIwLjE1IiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMC41IiBmaWxsPSIjNEQ0RDREIj48L3BhdGg+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMC43MDQ4MzEzLDggQzkuNzkwNjc0NjgsOS4xMzExNDg0NyA4LjMwNjYxODQsOS43MTQyODU3MSA3LjgzMzMzMzMzLDkuNzE0Mjg1NzEgQzcuODMzMzMzMzMsOS43MTQyODU3MSA3LjUsOS43MTQyODU3MSA3LjUsOS4zODA5NTIzOCBDNy41LDkuMDg1MjI2ODQgOC4wNjIyMDE2OCw4LjkwMTk0MTY0IDguMTg5MDYwNjcsNy41Njc1NDA1OCBDNi44ODk5Njk5MSw2LjkwNjc5MDA1IDYsNS41NTczMjY4MyA2LDQgQzYsMS43OTA4NjEgNy43OTA4NjEsNC4wNTgxMjI1MWUtMTYgMTAsMCBMMTIsMCBDMTQuMjA5MTM5LC00LjA1ODEyMjUxZS0xNiAxNiwxLjc5MDg2MSAxNiw0IEMxNiw2LjIwOTEzOSAxNC4yMDkxMzksOCAxMiw4IEwxMC43MDQ4MzEzLDggWiIgaWQ9InNwZWVjaCIgZmlsbD0iIzBFQkQ4QyI+PC9wYXRoPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+';

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNDBweCIgaGVpZ2h0PSI0MHB4IiB2aWV3Qm94PSIwIDAgNDAgNDAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDUyLjIgKDY3MTQ1KSAtIGh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaCAtLT4KICAgIDx0aXRsZT5FeHRlbnNpb25zL1NvZnR3YXJlL1RleHQtdG8tU3BlZWNoLUJsb2NrPC90aXRsZT4KICAgIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPgogICAgPGcgaWQ9IkV4dGVuc2lvbnMvU29mdHdhcmUvVGV4dC10by1TcGVlY2gtQmxvY2siIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIHN0cm9rZS1vcGFjaXR5PSIwLjE1Ij4KICAgICAgICA8ZyBpZD0idGV4dDJzcGVlY2giIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQuMDAwMDAwLCA0LjAwMDAwMCkiIGZpbGwtcnVsZT0ibm9uemVybyIgc3Ryb2tlPSIjMDAwMDAwIj4KICAgICAgICAgICAgPHBhdGggZD0iTTExLjUsMTcuNjY5MzQzNSBDMTEuNSwxNi42NTM5MjY5IDEwLjAwNjAxNDUsMTYuMDg0NDI3NCA5LjExMjU2MDI0LDE2Ljg4ODMgTDYuNDEyNTYwMjQsMTkuMDUwNzE0IEM1LjM5MzQ2NzU1LDE5Ljg2Njg5OTQgNC4wNzQ5NzM1MSwyMC4zMzE3NTc1IDIuNywyMC4zMzE3NTc1IEwyLjMsMjAuMzMxNzU3NSBDMS4yNjUxOTIzMywyMC4zMzE3NTc1IDAuNSwyMS4wMjEyMDAzIDAuNSwyMS45MDQwNzEgTDAuNSwyNi4xMzg3OTg2IEMwLjUsMjcuMDIxNjY5MyAxLjI2NTE5MjMzLDI3LjcxMTExMiAyLjMsMjcuNzExMTEyIEwyLjcsMjcuNzExMTEyIEM0LjE1NzU1NjgyLDI3LjcxMTExMiA1LjQ1MzcyMzIyLDI4LjEzMzUyNzEgNi41MTk3MjA5OCwyOC45OTggTDkuMTE4NDAyOTMsMzEuMTU5MzIxNiBDMTAuMDI2MTg1NSwzMS45MDkwNzkzIDExLjUsMzEuMzQ3MjY4OSAxMS41LDMwLjI4MzQyNTUgTDExLjUsMTcuNjY5MzQzNSBaIiBpZD0ic3BlYWtlciIgZmlsbD0iIzRENEQ0RCI+PC9wYXRoPgogICAgICAgICAgICA8cGF0aCBkPSJNMjEuNjQzNjA2NiwxNi41IEMxOS45NzcwMDk5LDE4LjQzNzAyMzQgMTcuMTA1MDI3NSwxOS45Mjg1NzE0IDE1LjY2NjY2NjcsMTkuOTI4NTcxNCBDMTUuNTEyNjM5NywxOS45Mjg1NzE0IDE1LjMxNjYyOTIsMTkuODk1OTAzIDE1LjEwOTcyNjUsMTkuNzkyNDUxNyBDMTQuNzM3NjAzOSwxOS42MDYzOTA0IDE0LjUsMTkuMjQ5OTg0NiAxNC41LDE4Ljc2MTkwNDggQzE0LjUsMTguNjU2ODA0MSAxNC41MTcwNTU1LDE4LjU1NDUwNzYgMTQuNTQ5NDQ2NywxOC40NTQwODQ0IEMxNC42MjU3NTQ1LDE4LjIxNzUwNjMgMTUuMTczNTcyMSwxNy40Njc1MzEgMTUuMjc3MjA3MSwxNy4yODA5ODgxIEMxNS41NDYzNTI2LDE2Ljc5NjUyNjEgMTUuNzM5MDI1LDE2LjIwNjM1NjEgMTUuODQzMjg5MSwxNS40MTYwMDM0IEMxMy4xODk3MDA1LDEzLjkyNjgzNjkgMTEuNSwxMS4xMTM5NjY4IDExLjUsOCBDMTEuNSwzLjMwNTU3OTYzIDE1LjMwNTU3OTYsLTAuNSAyMCwtMC41IEwyNCwtMC41IEMyOC42OTQ0MjA0LC0wLjUgMzIuNSwzLjMwNTU3OTYzIDMyLjUsOCBDMzIuNSwxMi42OTQ0MjA0IDI4LjY5NDQyMDQsMTYuNSAyNCwxNi41IEwyMS42NDM2MDY2LDE2LjUgWiIgaWQ9InNwZWVjaCIgZmlsbD0iI0ZGRkZGRiI+PC9wYXRoPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+';

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
const ALTO_ID = 'ALTO';

/**
 * An id for one of the voices.
 */
const TENOR_ID = 'TENOR';

/**
 * An id for one of the voices.
 */
const SQUEAK_ID = 'SQUEAK';

/**
 * An id for one of the voices.
 */
const GIANT_ID = 'GIANT';

/**
 * An id for one of the voices.
 */
const KITTEN_ID = 'KITTEN';

/**
 * Class for the text2speech blocks.
 * @constructor
 */
class Scratch3Text2SpeechBlocks {
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
            [ALTO_ID]: {
                name: formatMessage({
                    id: 'text2speech.alto',
                    default: 'alto',
                    description: 'Name for a voice with ambiguous gender.'
                }),
                gender: 'female',
                playbackRate: 1
            },
            [TENOR_ID]: {
                name: formatMessage({
                    id: 'text2speech.tenor',
                    default: 'tenor',
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
                playbackRate: 1.19 // +3 semitones
            },
            [GIANT_ID]: {
                name: formatMessage({
                    id: 'text2speech.giant',
                    default: 'giant',
                    description: 'Name for a funny voice with a low pitch.'
                }),
                gender: 'male',
                playbackRate: 0.84 // -3 semitones
            },
            [KITTEN_ID]: {
                name: formatMessage({
                    id: 'text2speech.kitten',
                    default: 'kitten',
                    description: 'A baby cat.'
                }),
                gender: 'female',
                playbackRate: 1.41 // +6 semitones
            }
        };
    }

    /**
     * An object with language names mapped to their language codes.
     */
    get LANGUAGE_INFO () {
        return {
            'Danish': 'da',
            'Dutch': 'nl',
            'English': 'en',
            'French': 'fr',
            'German': 'de',
            'Icelandic': 'is',
            'Italian': 'it',
            'Japanese': 'ja',
            'Polish': 'pl',
            'Portuguese (Brazilian)': 'pt-br',
            'Portuguese (European)': 'pt',
            'Russian': 'ru',
            'Spanish (European)': 'es',
            'Spanish (Latin American)': 'es-419'
        };
    }

    /**
     * This is a temporary adapter to convert Scratch locale codes to Amazon polly's locale codes.
     * @todo remove this once the speech synthesis server can perform this conversion
     * @param {string} locale the Scratch locale to convert.
     * @return {string} the Amazon polly locale.
     */
    localeToPolly (locale) {
        const pollyLocales = {
            'da': 'da-DK', // Danish
            'nl': 'nl-NL', // Dutch
            'en': 'en-US', // English
            'fr': 'fr-FR', // French
            'de': 'de-DE', // German
            'is': 'is-IS', // Icelandic
            'it': 'it-IT', // Italian
            'ja': 'ja-JP', // Japanese
            'pl': 'pl-PL', // Polish
            'pt-br': 'pt-BR', // Portuguese (Brazilian)
            'pt': 'pt-PT', // Portuguese (European)
            'ru': 'ru-RU', // Russian
            'es': 'es-ES', // Spanish (European)
            'es-419': 'es-US' // Spanish (Latin American)
        };
        let converted = 'en-US';
        if (pollyLocales[locale]) {
            converted = pollyLocales[locale];
        }
        return converted;
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
            voiceId: ALTO_ID
        };
    }

    /**
     * A default language to use for speech synthesis.
     * @type {string}
     */
    get DEFAULT_LANGUAGE () {
        return 'en';
    }

    /**
     * @param {Target} target - collect  state for this target.
     * @returns {Text2SpeechState} the mutable state associated with that target. This will be created if necessary.
     * @private
     */
    _getState (target) {
        let state = target.getCustomState(Scratch3Text2SpeechBlocks.STATE_KEY);
        if (!state) {
            state = Clone.simple(Scratch3Text2SpeechBlocks.DEFAULT_TEXT2SPEECH_STATE);
            target.setCustomState(Scratch3Text2SpeechBlocks.STATE_KEY, state);
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
            const state = sourceTarget.getCustomState(Scratch3Text2SpeechBlocks.STATE_KEY);
            if (state) {
                newTarget.setCustomState(Scratch3Text2SpeechBlocks.STATE_KEY, Clone.simple(state));
            }
        }
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        // Only localize the default input to the "speak" block if we are in a
        // supported language.
        let defaultTextToSpeak = 'hello';
        if (this.isSupportedLanguage(this.getEditorLanguage())) {
            defaultTextToSpeak = formatMessage({
                id: 'text2speech.defaultTextToSpeak',
                default: defaultTextToSpeak,
                description: 'hello: the default text to speak'
            });
        }

        return {
            id: 'text2speech',
            name: 'Text to Speech',
            blockIconURI: blockIconURI,
            menuIconURI: menuIconURI,
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
                            defaultValue: defaultTextToSpeak
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
                            defaultValue: ALTO_ID
                        }
                    }
                },
                {
                    opcode: 'setLanguage',
                    text: formatMessage({
                        id: 'text2speech.setLanguageBlock',
                        default: 'set language to [LANGUAGE]',
                        description: 'Set the language for speech synthesis.'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        LANGUAGE: {
                            type: ArgumentType.STRING,
                            menu: 'languages',
                            defaultValue: this.getCurrentLanguage()
                        }
                    }
                }
            ],
            menus: {
                voices: this.getVoiceMenu(),
                languages: this.getLanguageMenu()
            }
        };
    }

    /**
     * Get the language code currently set in the editor, or fall back to the
     * browser locale.
     * @return {string} the language code.
     */
    getEditorLanguage () {
        return formatMessage.setup().locale ||
            navigator.language || navigator.userLanguage || this.DEFAULT_LANGUAGE;
    }

    /**
     * Get the language for speech synthesis.
     * @returns {string} the language code.
     */
    getCurrentLanguage () {
        const stage = this.runtime.getTargetForStage();
        if (!stage) return this.DEFAULT_LANGUAGE;
        // If no language has been set, set it to the editor locale (or default).
        if (!stage.textToSpeechLanguage) {
            this.setCurrentLanguage(this.getEditorLanguage());
        }
        return stage.textToSpeechLanguage;
    }

    /**
     * Set the language for speech synthesis.
     * It is stored in the stage so it can be saved and loaded with the project.
     * @param {string} languageCode a locale code to set.
     */
    setCurrentLanguage (languageCode) {
        const stage = this.runtime.getTargetForStage();
        if (!stage) return;
        // Only set the language if it is in the list.
        if (this.isSupportedLanguage(languageCode)) {
            stage.textToSpeechLanguage = languageCode;
        }
        // If the language is null, set it to the default language.
        // This can occur e.g. if the extension was loaded with the editor
        // set to a language that is not in the list.
        if (!stage.textToSpeechLanguage) {
            stage.textToSpeechLanguage = this.DEFAULT_LANGUAGE;
        }
    }

    /**
     * Check if a language code is in the list of supported languages for the
     * speech synthesis service.
     * @param {string} languageCode the language code to check.
     * @returns {boolean} true if the language code is supported.
     */
    isSupportedLanguage (languageCode) {
        return Object.values(this.LANGUAGE_INFO).includes(languageCode);
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
     * Get the menu of languages for the "set language" block.
     * @return {array} the text and value for each menu item.
     */
    getLanguageMenu () {
        return Object.keys(this.LANGUAGE_INFO).map(languageName => ({
            text: languageName,
            value: this.LANGUAGE_INFO[languageName]
        }));
    }

    /**
     * Set the voice for speech synthesis for this sprite.
     * @param  {object} args Block arguments
     * @param {object} util Utility object provided by the runtime.
     */
    setVoice (args, util) {
        const state = this._getState(util.target);

        let voice = args.VOICE;

        // If the arg is a dropped number, treat it as a voice index
        let voiceNum = parseInt(voice, 10);
        if (!isNaN(voiceNum)) {
            voiceNum -= 1; // Treat dropped args as one-indexed
            voiceNum = MathUtil.wrapClamp(voiceNum, 0, Object.keys(this.VOICE_INFO).length - 1);
            voice = Object.keys(this.VOICE_INFO)[voiceNum];
        }

        // Only set the voice if the arg is a valid voice id.
        if (Object.keys(this.VOICE_INFO).includes(voice)) {
            state.voiceId = voice;
        }
    }

    /**
     * Set the language for speech synthesis.
     * @param  {object} args Block arguments
     */
    setLanguage (args) {
        this.setCurrentLanguage(args.LANGUAGE);
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

        // @todo localize this?
        if (state.voiceId === KITTEN_ID) {
            words = words.replace(/\w+/g, 'meow');
        }

        // Build up URL
        let path = `${SERVER_HOST}/synth`;
        path += `?locale=${this.localeToPolly(this.getCurrentLanguage())}`;
        path += `&gender=${gender}`;
        path += `&text=${encodeURI(words.substring(0, 128))}`;

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
module.exports = Scratch3Text2SpeechBlocks;
