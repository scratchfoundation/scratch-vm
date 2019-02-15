const test = require('tap').test;

const TaskQueue = require('../../src/util/task-queue');

const MockTimer = require('../fixtures/mock-timer');
const testCompare = require('../fixtures/test-compare');

// Max tokens = 1000
// Refill 1000 tokens per second (1 per millisecond)
// Token bucket starts empty
// Max total cost of queued tasks = 10000 tokens = 10 seconds
const makeTestQueue = () => {
    const bukkit = new TaskQueue(1000, 1000, {
        startingTokens: 0,
        maxTotalCost: 10000
    });

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
    t.type(bukkit.cancel, 'function');
    t.type(bukkit.cancelAll, 'function');

    t.end();
});

test('constructor', t => {
    t.ok(new TaskQueue(1, 1));
    t.ok(new TaskQueue(1, 1, {}));
    t.ok(new TaskQueue(1, 1, {startingTokens: 0}));
    t.ok(new TaskQueue(1, 1, {maxTotalCost: 999}));
    t.ok(new TaskQueue(1, 1, {startingTokens: 0, maxTotalCost: 999}));
    t.end();
});

test('run tasks', async t => {
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
    while (bukkit.length > 0) {
        await bukkit._timer.advanceMockTimeAsync(10);
    }

    return Promise.all(promises).then(() => {
        t.deepEqual(taskResults, ['a', 'b', 'c'], 'All tasks must run in correct order');
        t.end();
    });
});

test('cancel', async t => {
    const bukkit = makeTestQueue();

    const taskResults = [];
    const goodCancelMessage = 'Task was canceled correctly';
    const afterCancelMessage = 'Task was run correctly';
    const cancelTaskPromise = bukkit.do(
        () => {
            taskResults.push('nope');
        }, 999);
    const cancelCheckPromise = cancelTaskPromise.then(
        () => {
            t.fail('Task should have been canceled');
        },
        () => {
            taskResults.push(goodCancelMessage);
        }
    );
    const keepTaskPromise = bukkit.do(
        () => {
            taskResults.push(afterCancelMessage);
            testCompare(t, bukkit._timer.timeElapsed(), '<', 10, 'Canceled task must not delay other tasks');
        }, 5);

    // give the bucket a chance to make a mistake
    await bukkit._timer.advanceMockTimeAsync(1);

    t.equal(bukkit.length, 2);
    const taskWasCanceled = bukkit.cancel(cancelTaskPromise);
    t.ok(taskWasCanceled);
    t.equal(bukkit.length, 1);

    while (bukkit.length > 0) {
        await bukkit._timer.advanceMockTimeAsync(1);
    }

    return Promise.all([cancelCheckPromise, keepTaskPromise]).then(() => {
        t.deepEqual(taskResults, [goodCancelMessage, afterCancelMessage]);
        t.end();
    });
});

test('cancelAll', async t => {
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
    await bukkit._timer.advanceMockTimeAsync(100);

    bukkit.cancelAll();

    // advance enough that both tasks would run if they hadn't been canceled
    await bukkit._timer.advanceMockTimeAsync(10000);

    return Promise.all(promises).then(() => {
        t.deepEqual(taskResults, [goodCancelMessage1, goodCancelMessage2], 'Tasks should cancel in order');
        t.end();
    });
});

test('max total cost', async t => {
    const bukkit = makeTestQueue();

    let numTasks = 0;

    const task = () => ++numTasks;

    // Fill the queue
    for (let i = 0; i < 10; ++i) {
        bukkit.do(task, 1000);
    }

    // This one should be rejected because the queue is full
    bukkit
        .do(task, 1000)
        .then(
            () => {
                t.fail('Full queue did not reject task');
            },
            () => {
                t.pass();
            }
        );

    while (bukkit.length > 0) {
        await bukkit._timer.advanceMockTimeAsync(1000);
    }

    // this should be 10 if the last task is rejected or 11 if it runs
    t.equal(numTasks, 10);
    t.end();
});
