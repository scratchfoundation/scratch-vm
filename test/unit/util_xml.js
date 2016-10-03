var test = require('tap').test;
var xml = require('../../src/util/xml-escape');

test('escape', function (t) {
    var input = '<foo bar="he & llo \'"></foo>';
    var output = '&lt;foo bar=&quot;he &amp; llo &apos;&quot;&gt;&lt;/foo&gt;';
    t.strictEqual(xml(input), output);
    t.end();
});
