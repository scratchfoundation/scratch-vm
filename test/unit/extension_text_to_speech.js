const test = require('tap').test;
const TextToSpeech = require('../../src/extensions/scratch3_text2speech/index.js');

const fakeStage = {
    textToSpeechLanguage: null
};

const fakeRuntime = {
    getTargetForStage: () => fakeStage,
    on: () => {} // Stub out listener methods used in constructor.
};

const ext = new TextToSpeech(fakeRuntime);

test('if no language is saved in the project, use default', t => {
    t.strictEqual(ext.getCurrentLanguage(), 'en');
    t.end();
});

test('if an unsupported language is dropped onto the set language block, use default', t => {
    ext.setLanguage({LANGUAGE: 'nope'});
    t.strictEqual(ext.getCurrentLanguage(), 'en');
    t.end();
});

test('if a supported language name is dropped onto the set language block, use it', t => {
    ext.setLanguage({LANGUAGE: 'español'});
    t.strictEqual(ext.getCurrentLanguage(), 'es');
    t.end();
});

test('get the extension locale for a supported locale that differs', t => {
    ext.setLanguage({LANGUAGE: 'ja-hira'});
    t.strictEqual(ext.getCurrentLanguage(), 'ja');
    t.end();
});

test('use localized spoken language name in place of localized written language name', t => {
    ext.getEditorLanguage = () => 'es';
    const languageMenu = ext.getLanguageMenu();
    const localizedNameForChineseInSpanish = languageMenu.find(el => el.value === 'zh-cn').text;
    t.strictEqual(localizedNameForChineseInSpanish, 'Chino (Mandarín)'); // i.e. should not be 'Chino (simplificado)'
    t.end();
});
