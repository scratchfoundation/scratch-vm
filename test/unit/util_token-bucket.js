const test = require('tap').test;

const Timer = require('../../src/util/timer');
const TokenBucket = require('../../src/util/token-bucket');

const testCompare = require('../fixtures/test-compare');

test('constructor', t => {
    // Max tokens = 1000, refill 1000 tokens per second (1 per millisecond), and start with 0 tokens
    const bukkit = new TokenBucket(1000, 1000, 0);

    const timer = new Timer();
    timer.start();

    const taskResults = [];
    const promises = [];
    promises.push(
        bukkit.do(() => taskResults.push('a'), 100).then(() =>
            testCompare(t, timer.timeElapsed(), '>=', 100, 'Costly task must wait')
        ),
        bukkit.do(() => taskResults.push('b'), 0).then(() =>
            testCompare(t, timer.timeElapsed(), '<', 150, 'Cheap task should run soon')
        ),
        bukkit.do(() => taskResults.push('c'), 101).then(() =>
            testCompare(t, timer.timeElapsed(), '>=', 200, 'Tasks must run in serial')
        )
    );
    return Promise.all(promises).then(() => {
        t.deepEqual(taskResults, ['a', 'b', 'c'], 'All tasks must run in correct order');
    });
});
