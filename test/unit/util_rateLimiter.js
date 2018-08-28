const test = require('tap').test;
const RateLimiter = require('../../src/util/rateLimiter.js');

test('rate limiter', t => {
    const rate = 30;
    const limiter = new RateLimiter(rate);

    // The rate limiter starts with a number of tokens equal to the max rate
    t.equal(limiter._count, rate);

    // Running okayToSend rate times uses up all of the tokens
    for (let i = 0; i < rate; i++) {
        t.true(limiter.okayToSend());
        t.equal(limiter._count, rate - (i + 1));
    }
    t.false(limiter.okayToSend());

    // After a delay of one second divided by the max rate, we should have exactly
    // one more token to use.
    setTimeout(() => {
        t.true(limiter.okayToSend());
        t.false(limiter.okayToSend());
        t.end();
    }, 1000 / rate);
});
