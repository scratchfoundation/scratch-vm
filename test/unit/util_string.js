const test = require('tap').test;
const StringUtil = require('../../src/util/string-util');

test('splitFirst', t => {
    t.deepEqual(StringUtil.splitFirst('asdf.1234', '.'), ['asdf', '1234']);
    t.deepEqual(StringUtil.splitFirst('asdf.', '.'), ['asdf', '']);
    t.deepEqual(StringUtil.splitFirst('.1234', '.'), ['', '1234']);
    t.deepEqual(StringUtil.splitFirst('foo', '.'), ['foo', null]);
    t.end();
});

test('withoutTrailingDigits', t => {
    t.strictEqual(StringUtil.withoutTrailingDigits('boeing747'), 'boeing');
    t.strictEqual(StringUtil.withoutTrailingDigits('boeing747 '), 'boeing747 ');
    t.strictEqual(StringUtil.withoutTrailingDigits('boeing𝟨'), 'boeing𝟨');
    t.strictEqual(StringUtil.withoutTrailingDigits('boeing 747'), 'boeing ');
    t.strictEqual(StringUtil.withoutTrailingDigits('747'), '');
    t.end();
});

test('unusedName', t => {
    t.strictEqual(
        StringUtil.unusedName(
            'name',
            ['not the same name']
        ),
        'name'
    );
    t.strictEqual(
        StringUtil.unusedName(
            'name',
            ['name']
        ),
        'name2'
    );
    t.strictEqual(
        StringUtil.unusedName(
            'name',
            ['name30']
        ),
        'name'
    );
    t.strictEqual(
        StringUtil.unusedName(
            'name',
            ['name', 'name2']
        ),
        'name3'
    );
    t.strictEqual(
        StringUtil.unusedName(
            'name',
            ['name', 'name3']
        ),
        'name2'
    );
    t.strictEqual(
        StringUtil.unusedName(
            'boeing747',
            ['boeing747']
        ),
        'boeing2' // Yup, this matches scratch-flash...
    );
    t.end();
});

test('stringify', t => {
    const obj = {
        a: Infinity,
        b: NaN,
        c: -Infinity,
        d: 23,
        e: 'str',
        f: {
            nested: Infinity
        }
    };
    const parsed = JSON.parse(StringUtil.stringify(obj));
    t.equal(parsed.a, 0);
    t.equal(parsed.b, 0);
    t.equal(parsed.c, 0);
    t.equal(parsed.d, 23);
    t.equal(parsed.e, 'str');
    t.equal(parsed.f.nested, 0);
    t.end();
});

test('replaceUnsafeChars', t => {
    const empty = '';
    t.equal(StringUtil.replaceUnsafeChars(empty), empty);

    const safe = 'hello';
    t.equal(StringUtil.replaceUnsafeChars(safe), safe);

    const unsafe = '< > & \' "';
    t.equal(StringUtil.replaceUnsafeChars(unsafe), 'lt gt amp apos quot');

    const single = '&';
    t.equal(StringUtil.replaceUnsafeChars(single), 'amp');

    const mix = '<a>b& c\'def_-"';
    t.equal(StringUtil.replaceUnsafeChars(mix), 'ltagtbamp caposdef_-quot');

    const dupes = '<<&_"_"_&>>';
    t.equal(StringUtil.replaceUnsafeChars(dupes), 'ltltamp_quot_quot_ampgtgt');

    const emoji = '(>^_^)>';
    t.equal(StringUtil.replaceUnsafeChars(emoji), '(gt^_^)gt');

    t.end();
});
