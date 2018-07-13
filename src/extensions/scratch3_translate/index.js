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
 * Icon to be displayed at the left edge of each extension block and in the extension menu.
 * @type {string}
 */
// eslint-disable-next-line max-len
const iconURI = 'data:image/png;base64,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';

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
                default: 'Google Translate',
                description: 'Name of extension that adds translate blocks. Do Not translate Google'
            }),
            menuIconURI: iconURI,
            blockIconURI: iconURI,
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
