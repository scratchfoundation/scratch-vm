const test = require('tap').test;
const xml = require('../../src/util/xml-escape');

test('escape', t => {
    const input = '<foo bar="he & llo \'"></foo>';
    const output = '&lt;foo bar=&quot;he &amp; llo &apos;&quot;&gt;&lt;/foo&gt;';
    t.strictEqual(xml(input), output);
    t.end();
});

test('xmlEscape (more)', t => {
    const empty = '';
    t.equal(xml(empty), empty);

    const safe = 'hello';
    t.equal(xml(safe), safe);

    const unsafe = '< > & \' "';
    t.equal(xml(unsafe), '&lt; &gt; &amp; &apos; &quot;');

    const single = '&';
    t.equal(xml(single), '&amp;');

    const mix = '<a>b& c\'def_-"';
    t.equal(xml(mix), '&lt;a&gt;b&amp; c&apos;def_-&quot;');

    const dupes = '<<&_"_"_&>>';
    t.equal(xml(dupes), '&lt;&lt;&amp;_&quot;_&quot;_&amp;&gt;&gt;');

    const emoji = '(>^_^)>';
    t.equal(xml(emoji), '(&gt;^_^)&gt;');

    t.end();
});

test('xmlEscape should handle non strings', t => {
    const array = ['hello', 'world'];
    t.equal(xml(array), String(array));

    const arrayWithSpecialChar = ['hello', '<world>'];
    t.equal(xml(arrayWithSpecialChar), 'hello,&lt;world&gt;');

    const arrayWithNumbers = [1, 2, 3];
    t.equal(xml(arrayWithNumbers), '1,2,3');

    // Objects shouldn't get provided to replaceUnsafeChars, but in the event
    // they do, it should just return the object (and log an error)
    const object = {hello: 'world'};
    t.equal(xml(object), object);

    t.end();
});
