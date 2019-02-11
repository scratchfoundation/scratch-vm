const test = require('tap').test;

const TaskQueue = require('../../src/util/task-queue');

const MockTimer = require('../fixtures/mock-timer');
const testCompare = require('../fixtures/test-compare');

// Max tokens = 1000
// Refill 1000 tokens per second (1 per millisecond)
// Token bucket starts empty
const makeTestQueue = () => {
    const bukkit = new TaskQueue(1000, 1000, 0);

    const mockTimer = new MockTimer();
    bukkit._timer = mockTimer;
    mockTimer.start();

    return bukkit;
};

test('spec', t => {
    t.type(TaskQueue, 'function');
    const bukkit = makeTestQueue();

    t.type(bukkit, 'object');

    t.type(bukkit.length, 'number');
    t.type(bukkit.do, 'function');
    t.type(bukkit.cancelAll, 'function');

    t.end();
});

test('cancelAll', t => {
    const bukkit = makeTestQueue();

    const taskResults = [];
    const goodCancelMessage1 = 'Task1 was canceled correctly';
    const goodCancelMessage2 = 'Task2 was canceled correctly';

    const promises = [
        bukkit.do(() => taskResults.push('nope'), 999).then(
            () => {
                t.fail('Task1 should have been canceled');
            },
            () => {
                taskResults.push(goodCancelMessage1);
            }
        ),
        bukkit.do(() => taskResults.push('nah'), 999).then(
            () => {
                t.fail('Task2 should have been canceled');
            },
            () => {
                taskResults.push(goodCancelMessage2);
            }
        )
    ];

    // advance time, but not enough that any task should run
    bukkit._timer.advanceMockTime(100);

    bukkit.cancelAll();

    // advance enough that both tasks would run if they hadn't been canceled
    bukkit._timer.advanceMockTime(10000);

    return Promise.all(promises).then(() => {
        t.deepEqual(taskResults, [goodCancelMessage1, goodCancelMessage2], 'Tasks should cancel in order');
        t.end();
    });
});

test('run tasks', t => {
    const bukkit = makeTestQueue();

    const taskResults = [];

    const promises = [
        bukkit.do(() => {
            taskResults.push('a');
            testCompare(t, bukkit._timer.timeElapsed(), '>=', 50, 'Costly task must wait');
        }, 50),
        bukkit.do(() => {
            taskResults.push('b');
            testCompare(t, bukkit._timer.timeElapsed(), '>=', 60, 'Tasks must run in serial');
        }, 10),
        bukkit.do(() => {
            taskResults.push('c');
            testCompare(t, bukkit._timer.timeElapsed(), '<=', 70, 'Cheap task should run soon');
        }, 1)
    ];

    // advance 10 simulated milliseconds per JS tick
    const step = () => {
        bukkit._timer.advanceMockTime(10);
        if (bukkit.length > 0) {
            global.setTimeout(step, 0);
        }
    };
    step();

    return Promise.all(promises).then(() => {
        t.deepEqual(taskResults, ['a', 'b', 'c'], 'All tasks must run in correct order');
        t.end();
    });
});
