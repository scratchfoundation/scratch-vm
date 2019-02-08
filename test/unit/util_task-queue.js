const test = require('tap').test;

const TaskQueue = require('../../src/util/task-queue');

const MockTimer = require('../fixtures/mock-timer');
const testCompare = require('../fixtures/test-compare');

test('constructor', t => {
    // Max tokens = 1000, refill 1000 tokens per second (1 per millisecond), and start with 0 tokens
    const bukkit = new TaskQueue(1000, 1000, 0);

    const mockTimer = new MockTimer();
    bukkit._timer = mockTimer;
    mockTimer.start();

    const taskResults = [];
    const promises = [];
    const goodCancelMessage = 'Task was canceled correctly';
    bukkit.do(() => taskResults.push('nope'), 999).then(
        () => {
            t.fail('Task should have been canceled');
        },
        () => {
            taskResults.push(goodCancelMessage);
        }
    );
    bukkit.cancelAll();
    promises.push(
        bukkit.do(() => taskResults.push('a'), 50).then(() => {
            testCompare(t, bukkit._timer.timeElapsed(), '>=', 50, 'Costly task must wait');
        }),
        bukkit.do(() => taskResults.push('b'), 10).then(() => {
            testCompare(t, bukkit._timer.timeElapsed(), '>=', 60, 'Tasks must run in serial');
        }),
        bukkit.do(() => taskResults.push('c'), 1).then(() => {
            testCompare(t, bukkit._timer.timeElapsed(), '<=', 80, 'Cheap task should run soon');
        })
    );

    // advance 10 simulated milliseconds per JS tick
    const step = () => {
        mockTimer.advanceMockTime(10);
        if (mockTimer.timeElapsed() < 100) {
            global.setTimeout(step, 0);
        }
    };
    step();

    return Promise.all(promises).then(() => {
        t.deepEqual(taskResults, [goodCancelMessage, 'a', 'b', 'c'], 'All tasks must run in correct order');
    });
});
