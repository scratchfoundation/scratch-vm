const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const log = require('../../util/log');
const nets = require('nets');
const languageNames = require('scratch-translate-extension-languages');

// TODO: Change these to the correct icons.
const blockIconURI = 'https://www.gstatic.com/images/icons/material/system/1x/translate_white_24dp.png';
const menuIconURI = 'https://www.gstatic.com/images/icons/material/system/1x/translate_grey600_24dp.png';

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
 * Class for the translate-related block in Scratch 3.0
 * @constructor
 */
class Scratch3TranslateBlocks {
    constructor () {
        /**
         * List of supported language name and language code pairs.
         * @type {Array.<object.<string, string>>}
         * @private
         */
        this._supportedLanguages = languageNames.menuMap.en.map(entry => {
            const obj = {text: entry.name, value: entry.code};
            return obj;
        });

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
            name: 'Translate',
            menuIconURI: menuIconURI,
            blockIconURI: blockIconURI,
            blocks: [
                {
                    opcode: 'getTranslate',
                    text: 'translate [WORDS] to [LANGUAGE]',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        WORDS: {
                            type: ArgumentType.STRING,
                            defaultValue: 'hello'
                        },
                        LANGUAGE: {
                            type: ArgumentType.STRING,
                            menu: 'languages',
                            defaultValue: this._supportedLanguages[0].value
                        }
                    }
                }
            ],
            menus: {
                languages: this._supportedLanguages
            }
        };
    }

    getLanguageFromArg (arg) {
        const languageArg = Cast.toString(arg).toLowerCase();
        if (languageNames.menuMap.hasOwnProperty(languageArg)) {
            return languageArg;
        }
        // Check for a dropped-in language name, and convert to a language code.
        if (languageNames.nameMap.hasOwnProperty(languageArg)) {
            return languageNames.nameMap[languageArg];
        }
        // Default to english
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

        const lang = this.getLanguageFromArg(args.LANGUAGE);

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
