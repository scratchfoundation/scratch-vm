const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const log = require('../../util/log');
const nets = require('nets');
const languageNames = require('scratch-translate-extension-languages');
const formatMessage = require('format-message');


/**
 * The url of the translate server.
 * @type {string}
 */
const serverURL = 'https://translate-service.scratch.mit.edu/';

/**
 * How long to wait in ms before timing out requests to translate server.
 * @type {int}
 */
const serverTimeoutMs = 10000; // 10 seconds (chosen arbitrarily).

/**
 * Class for the translate block in Scratch 3.0.
 * @constructor
 */
class Scratch3TranslateBlocks {
    constructor () {
        /**
         * Language code of the viewer, based on their locale.
         * @type {string}
         * @private
         */
        this._viewerLanguageCode = this.getViewerLanguageCode();

        /**
         * List of supported language name and language code pairs, for use in the block menu.
         * @type {Array.<object.<string, string>>}
         * @private
         */
        this._supportedLanguages = languageNames.menuMap[this._viewerLanguageCode].map(entry => {
            const obj = {text: entry.name, value: entry.code};
            return obj;
        });

        /**
         * A randomly selected language code, for use as the default value in the language menu.
         * @type {string}
         * @private
         */
        this._randomLanguageCode = this._supportedLanguages[
            Math.floor(Math.random() * this._supportedLanguages.length)].value;

        /**
         * The result from the most recent translation.
         * @type {string}
         * @private
         */
        this._translateResult = '';

        /**
         * The language of the text most recently translated.
         * @type {string}
         * @private
         */
        this._lastLangTranslated = '';

        /**
         * The text most recently translated.
         * @type {string}
         * @private
         */
        this._lastTextTranslated = '';
    }

    /**
     * The key to load & store a target's translate state.
     * @return {string} The key.
     */
    static get STATE_KEY () {
        return 'Scratch.translate';
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: 'translate',
            name: formatMessage({
                id: 'translate.categoryName',
                default: 'Translate',
                description: 'Name of extension that adds translate blocks'
            }),
            blocks: [
                {
                    opcode: 'getTranslate',
                    text: formatMessage({
                        id: 'translate.translateBlock',
                        default: 'translate [WORDS] to [LANGUAGE]',
                        description: 'translate some text to a different language'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        WORDS: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'translate.defaultTextToTranslate',
                                default: 'hello',
                                description: 'hello: the default text to translate'
                            })
                        },
                        LANGUAGE: {
                            type: ArgumentType.STRING,
                            menu: 'languages',
                            defaultValue: this._randomLanguageCode
                        }
                    }
                },
                {
                    opcode: 'getViewerLanguage',
                    text: formatMessage({
                        id: 'translate.viewerLanguage',
                        default: 'language',
                        description: 'the languge of the project viewer'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {}
                }
            ],
            menus: {
                languages: this._supportedLanguages
            }
        };
    }

    /**
     * Get the human readable language value for the reporter block.
     * @return {string} the language name of the project viewer.
     */
    getViewerLanguage () {
        this._viewerLanguageCode = this.getViewerLanguageCode();
        const names = languageNames.menuMap[this._viewerLanguageCode];
        const langNameObj = names.find(obj => obj.code === this._viewerLanguageCode);
        let langName = this._viewerLanguageCode;
        if (langNameObj) {
            langName = langNameObj.name;
        }
        return langName;
    }

    /**
     * Get the viewer's language code.
     * @return {string} the language code.
     */
    getViewerLanguageCode () {
        const locale = formatMessage.setup().locale;
        const viewerLanguages = [locale].concat(navigator.languages);
        const languageKeys = Object.keys(languageNames.menuMap);
        // Return the first entry in viewerLanguages that matches
        // one of the available language keys.
        const languageCode = viewerLanguages.reduce((acc, lang) => {
            if (acc) {
                return acc;
            }
            if (languageKeys.indexOf(lang) > -1) {
                return lang;
            }
            return acc;
        }, '') || 'en';
        return languageCode;
    }

    /**
     * Get a language code from a block argument. The arg can be a language code
     * or a language name, written in any language.
     * @param  {object} arg A block argument.
     * @return {string} A language code.
     */
    getLanguageCodeFromArg (arg) {
        const languageArg = Cast.toString(arg).toLowerCase();
        // Check if the arg matches a language code in the menu.
        if (languageNames.menuMap.hasOwnProperty(languageArg)) {
            return languageArg;
        }
        // Check for a dropped-in language name, and convert to a language code.
        if (languageNames.nameMap.hasOwnProperty(languageArg)) {
            return languageNames.nameMap[languageArg];
        }
        // Default to English.
        return 'en';
    }

    /**
     * Translates the text in the translate block to the language specified in the menu.
     * @param {object} args - the block arguments.
     * @return {Promise} - a promise that resolves after the response from the translate server.
     */
    getTranslate (args) {
        // Don't remake the request if we already have the value.
        if (this._lastTextTranslated === args.WORDS &&
            this._lastLangTranslated === args.LANGUAGE) {
            return this._translateResult;
        }

        const lang = this.getLanguageCodeFromArg(args.LANGUAGE);

        let urlBase = `${serverURL}translate?language=`;
        urlBase += lang;
        urlBase += '&text=';
        urlBase += encodeURIComponent(args.WORDS);

        const tempThis = this;
        const translatePromise = new Promise(resolve => {
            nets({
                url: urlBase,
                timeout: serverTimeoutMs
            }, (err, res, body) => {
                if (err) {
                    log.warn(`error fetching translate result! ${res}`);
                    resolve('');
                    return '';
                }
                const translated = JSON.parse(body).result;
                tempThis._translateResult = translated;
                // Cache what we just translated so we don't keep making the
                // same call over and over.
                tempThis._lastTextTranslated = args.WORDS;
                tempThis._lastLangTranslated = args.LANGUAGE;
                resolve(translated);
                return translated;
            });

        });
        translatePromise.then(translatedText => translatedText);
        return translatePromise;
    }
}
module.exports = Scratch3TranslateBlocks;
