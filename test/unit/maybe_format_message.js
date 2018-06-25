const test = require('tap').test;
const maybeFormatMessage = require('../../src/util/maybe-format-message');

const nonMessages = [
    'hi',
    42,
    true,
    function () {
        return 'unused';
    },
    {
        a: 1,
        b: 2
    },
    {
        id: 'almost a message',
        notDefault: 'but missing the "default" property'
    },
    {
        notId: 'this one is missing the "id" property',
        default: 'but has "default"'
    }
];

const argsQuick = {
    speed: 'quick'
};

const argsOther = {
    speed: 'slow'
};

const argsEmpty = {};

const simpleMessage = {
    id: 'test.simpleMessage',
    default: 'The quick brown fox jumped over the lazy dog.'
};

const complexMessage = {
    id: 'test.complexMessage',
    default: '{speed, select, quick {The quick brown fox jumped over the lazy dog.} other {Too slow, Gobo!}}'
};

const quickExpectedResult = 'The quick brown fox jumped over the lazy dog.';
const otherExpectedResult = 'Too slow, Gobo!';

test('preserve non-messages', t => {
    t.plan(nonMessages.length);

    for (const x of nonMessages) {
        const result = maybeFormatMessage(x);
        t.strictSame(x, result);
    }

    t.end();
});

test('format messages', t => {
    const quickResult1 = maybeFormatMessage(simpleMessage);
    t.strictNotSame(quickResult1, simpleMessage);
    t.same(quickResult1, quickExpectedResult);

    const quickResult2 = maybeFormatMessage(complexMessage, argsQuick);
    t.strictNotSame(quickResult2, complexMessage);
    t.same(quickResult2, quickExpectedResult);

    const otherResult1 = maybeFormatMessage(complexMessage, argsOther);
    t.strictNotSame(otherResult1, complexMessage);
    t.same(otherResult1, otherExpectedResult);

    const otherResult2 = maybeFormatMessage(complexMessage, argsEmpty);
    t.strictNotSame(otherResult2, complexMessage);
    t.same(otherResult2, otherExpectedResult);

    t.end();
});
