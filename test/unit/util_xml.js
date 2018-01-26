const test = require('tap').test;
const xml = require('../../src/util/xml-escape');

test('escape', t => {
    const input = '<foo bar="he & llo \'"></foo>';
    const output = '&lt;foo bar=&quot;he &amp; llo &apos;&quot;&gt;&lt;/foo&gt;';
    t.strictEqual(xml(input), output);
    t.end();
});
