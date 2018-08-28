const test = require('tap').test;
const RateLimiter = require('../../src/util/rateLimiter.js');

test('limit', t => {
    const rate = 30;
    const limiter = new RateLimiter(rate);
    t.equal(limiter.getCount(), rate);
    for (let i = 0; i < rate; i++) {
        t.true(limiter.check());
        t.equal(limiter.getCount(), rate - (i + 1));
    }
    t.false(limiter.check());
    setTimeout(() => {
        t.true(limiter.check());
        t.false(limiter.check());
        t.end();
    }, 1000 / rate);
});
