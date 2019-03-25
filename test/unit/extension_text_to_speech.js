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

test('get the extension locale for a supported locale that differs', t => {
    ext.setLanguage({LANGUAGE: 'ja-Hira'});
    t.strictEqual(ext.getCurrentLanguage(), 'ja');
    t.end();
});
