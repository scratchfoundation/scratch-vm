const test = require('tap').test;

const mutationAdapter = require('../../src/engine/mutation-adapter');

test('spec', t => {
    t.type(mutationAdapter, 'function');
    t.end();
});

test('convert DOM to Scratch object', t => {
    const testStringRaw = '"arbitrary" & \'complicated\' test string';
    const testStringEscaped = '\\&quot;arbitrary\\&quot; &amp; &apos;complicated&apos; test string';
    const xml = `<mutation blockInfo="{&quot;text&quot;:&quot;${testStringEscaped}&quot;}"></mutation>`;
    const expectedMutation = {
        tagName: 'mutation',
        children: [],
        blockInfo: {
            text: testStringRaw
        }
    };

    // TODO: do we want to test passing a DOM node to `mutationAdapter`? Node.js doesn't have built-in DOM support...
    const mutationFromString = mutationAdapter(xml);
    t.deepEqual(mutationFromString, expectedMutation);
    t.end();
});
