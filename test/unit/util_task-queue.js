const test = require('tap').test;

const Timer = require('../../src/util/timer');
const TaskQueue = require('../../src/util/task-queue');

const testCompare = require('../fixtures/test-compare');

test('constructor', t => {
    // Max tokens = 1000, refill 1000 tokens per second (1 per millisecond), and start with 0 tokens
    const bukkit = new TaskQueue(1000, 1000, 0);

    const timer = new Timer();
    timer.start();

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
        bukkit.do(() => taskResults.push('a'), 50).then(() =>
            testCompare(t, timer.timeElapsed(), '>=', 50, 'Costly task must wait')
        ),
        bukkit.do(() => taskResults.push('b'), 10).then(() =>
            testCompare(t, timer.timeElapsed(), '>=', 60, 'Tasks must run in serial')
        ),
        bukkit.do(() => taskResults.push('c'), 1).then(() =>
            testCompare(t, timer.timeElapsed(), '<', 80, 'Cheap task should run soon')
        )
    );
    return Promise.all(promises).then(() => {
        t.deepEqual(taskResults, [goodCancelMessage, 'a', 'b', 'c'], 'All tasks must run in correct order');
    });
});
