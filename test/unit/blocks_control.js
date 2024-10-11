const test = require('tap').test;
const Control = require('../../src/blocks/scratch3_control');
const Runtime = require('../../src/engine/runtime');
const BlockUtility = require('../../src/engine/block-utility');

test('getPrimitives', t => {
    const rt = new Runtime();
    const c = new Control(rt);
    t.type(c.getPrimitives(), 'object');
    t.end();
});

test('repeat', t => {
    const rt = new Runtime();
    const c = new Control(rt);

    // Test harness (mocks `util`)
    let i = 0;
    const repeat = 10;
    const util = {
        stackFrame: Object.create(null),
        startBranch: function () {
            i++;
            c.repeat({TIMES: repeat}, util);
        }
    };

    // Execute test
    c.repeat({TIMES: 10}, util);
    t.strictEqual(util.stackFrame.loopCounter, -1);
    t.strictEqual(i, repeat);
    t.end();
});

test('repeat rounds with round()', t => {
    const rt = new Runtime();
    const c = new Control(rt);

    const roundingTest = (inputForRepeat, expectedTimes) => {
        // Test harness (mocks `util`)
        let i = 0;
        const util = {
            stackFrame: Object.create(null),
            startBranch: function () {
                i++;
                c.repeat({TIMES: inputForRepeat}, util);
            }
        };

        // Execute test
        c.repeat({TIMES: inputForRepeat}, util);
        t.strictEqual(i, expectedTimes);
    };

    // Execute tests
    roundingTest(3.2, 3);
    roundingTest(3.7, 4);
    roundingTest(3.5, 4);
    t.end();
});

test('repeatUntil', t => {
    const rt = new Runtime();
    const c = new Control(rt);

    // Test harness (mocks `util`)
    let i = 0;
    const repeat = 10;
    const util = {
        stackFrame: Object.create(null),
        startBranch: function () {
            i++;
            c.repeatUntil({CONDITION: (i === repeat)}, util);
        }
    };

    // Execute test
    c.repeatUntil({CONDITION: (i === repeat)}, util);
    t.strictEqual(i, repeat);
    t.end();
});

test('repeatWhile', t => {
    const rt = new Runtime();
    const c = new Control(rt);

    // Test harness (mocks `util`)
    let i = 0;
    const repeat = 10;
    const util = {
        stackFrame: Object.create(null),
        startBranch: function () {
            i++;
            // Note !== instead of ===
            c.repeatWhile({CONDITION: (i !== repeat)}, util);
        }
    };

    // Execute test
    c.repeatWhile({CONDITION: (i !== repeat)}, util);
    t.strictEqual(i, repeat);
    t.end();
});

test('forEach', t => {
    const rt = new Runtime();
    const c = new Control(rt);

    const variableValues = [];
    const variable = {value: 0};
    let value;
    const util = {
        stackFrame: Object.create(null),
        target: {
            lookupOrCreateVariable: function () {
                return variable;
            }
        },
        startBranch: function () {
            variableValues.push(variable.value);
            c.forEach({VARIABLE: {}, VALUE: value}, util);
        }
    };

    // for each (variable) in "5"
    // ..should yield variable values 1, 2, 3, 4, 5
    util.stackFrame = Object.create(null);
    variableValues.splice(0);
    variable.value = 0;
    value = '5';
    c.forEach({VARIABLE: {}, VALUE: value}, util);
    t.deepEqual(variableValues, [1, 2, 3, 4, 5]);

    // for each (variable) in 4
    // ..should yield variable values 1, 2, 3, 4
    util.stackFrame = Object.create(null);
    variableValues.splice(0);
    variable.value = 0;
    value = 4;
    c.forEach({VARIABLE: {}, VALUE: value}, util);
    t.deepEqual(variableValues, [1, 2, 3, 4]);

    t.end();
});

test('forever', t => {
    const rt = new Runtime();
    const c = new Control(rt);

    // Test harness (mocks `util`)
    let i = 0;
    const util = {
        startBranch: function (branchID, isLoop) {
            i++;
            t.strictEqual(branchID, 'substackID');
            t.strictEqual(isLoop, true);
        }
    };

    // Execute test
    c.forever({SUBSTACK: 'substackID'}, util);
    t.strictEqual(i, 1);
    t.end();
});

test('if / ifElse', t => {
    const rt = new Runtime();
    const c = new Control(rt);

    // Test harness (mocks `util`)
    let steppedID = null;
    const util = {
        startBranch: function (branchID) {
            steppedID = branchID;
        }
    };

    // Execute test
    c.if({CONDITION: true, SUBSTACK: 'sub'}, util);
    t.equal(steppedID, 'sub');
    c.if({CONDITION: false, SUBSTACK: 'othersub'}, util);
    t.equal(steppedID, 'sub');
    c.ifElse({CONDITION: true, SUBSTACK: 'anothersub'}, util);
    t.equal(steppedID, 'anothersub');
    c.ifElse({CONDITION: false, SUBSTACK: 'sub', SUBSTACK2: 'sub2'}, util);
    t.equal(steppedID, 'sub2');
    t.end();
});

test('stop', t => {
    const rt = new Runtime();
    const c = new Control(rt);

    // Test harness (mocks `util`)
    const state = {
        stopAll: 0,
        stopOtherTargetThreads: 0,
        stopThisScript: 0
    };
    const util = {
        stopAll: function () {
            state.stopAll++;
        },
        stopOtherTargetThreads: function () {
            state.stopOtherTargetThreads++;
        },
        stopThisScript: function () {
            state.stopThisScript++;
        }
    };

    // Execute test
    c.stop({STOP_OPTION: 'all'}, util);
    c.stop({STOP_OPTION: 'other scripts in sprite'}, util);
    c.stop({STOP_OPTION: 'other scripts in stage'}, util);
    c.stop({STOP_OPTION: 'this script'}, util);
    t.strictEqual(state.stopAll, 1);
    t.strictEqual(state.stopOtherTargetThreads, 2);
    t.strictEqual(state.stopThisScript, 1);
    t.end();
});

test('counter, incrCounter, clearCounter', t => {
    const rt = new Runtime();
    const c = new Control(rt);

    // Default value
    t.strictEqual(c.getCounter(), 0);

    c.incrCounter();
    c.incrCounter();
    t.strictEqual(c.getCounter(), 2);

    c.clearCounter();
    t.strictEqual(c.getCounter(), 0);

    t.end();
});

test('allAtOnce', t => {
    const rt = new Runtime();
    const c = new Control(rt);

    // Test harness (mocks `util`)
    let ran = false;
    const util = {
        startBranch: function () {
            ran = true;
        }
    };

    // Execute test
    c.allAtOnce({}, util);
    t.true(ran);
    t.end();
});

test('wait', t => {
    const rt = new Runtime();
    const c = new Control(rt);
    const args = {DURATION: .01};
    const waitTime = args.DURATION * 1000;
    const startTest = Date.now();
    const thresholdSmall = 1000 / 60; // only allow the wait to end one 60Hz frame early
    const thresholdLarge = 1000 / 3; // be less picky about when the wait ends, in case CPU load makes the VM run slowly
    let yields = 0;
    const util = new BlockUtility();
    const mockUtil = {
        stackFrame: {},
        yield: () => yields++,
        stackTimerNeedsInit: util.stackTimerNeedsInit,
        startStackTimer: util.startStackTimer,
        stackTimerFinished: util.stackTimerFinished
    };

    c.wait(args, mockUtil);
    t.equal(yields, 1, 'First wait block yielded');

    // Spin the cpu until enough time passes
    let timeElapsed = 0;
    while (timeElapsed < waitTime) {
        timeElapsed = mockUtil.stackFrame.timer.timeElapsed();
        // In case util.timer is broken - have our own "exit"
        if (Date.now() - startTest > timeElapsed + thresholdSmall) {
            break;
        }
    }

    c.wait(args, mockUtil);
    t.equal(yields, 1, 'Second call after timeElapsed does not yield');
    t.equal(waitTime, mockUtil.stackFrame.duration);
    t.ok(timeElapsed >= (waitTime - thresholdSmall),
        `Wait block ended too early: ${timeElapsed} < ${waitTime} - ${thresholdSmall}`);
    t.ok(timeElapsed <= (waitTime + thresholdLarge),
        `Wait block ended too late: ${timeElapsed} > ${waitTime} + ${thresholdLarge}`);
    t.end();
});
