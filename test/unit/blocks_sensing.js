const test = require('tap').test;
const Sensing = require('../../src/blocks/scratch3_sensing');
const Runtime = require('../../src/engine/runtime');
const Sprite = require('../../src/sprites/sprite');
const RenderedTarget = require('../../src/sprites/rendered-target');

test('getPrimitives', t => {
    const rt = new Runtime();
    const s = new Sensing(rt);
    t.type(s.getPrimitives(), 'object');
    t.end();
});

test('ask and answer with a hidden target', t => {
    const rt = new Runtime();
    const s = new Sensing(rt);
    const util = {target: {visible: false}};

    const expectedQuestion = 'a question';
    const expectedAnswer = 'the answer';

    // Test is written out of order because of promises, follow the (#) comments.
    rt.addListener('QUESTION', question => {
        // (2) Assert the question is correct, then emit the answer
        t.strictEqual(question, expectedQuestion);
        rt.emit('ANSWER', expectedAnswer);
    });

    // (1) Emit the question.
    const promise = s.askAndWait({QUESTION: expectedQuestion}, util);

    // (3) Ask block resolves after the answer is emitted.
    promise.then(() => {
        t.strictEqual(s.getAnswer(), expectedAnswer);
        t.end();
    });
});

test('ask and answer with a visible target', t => {
    const rt = new Runtime();
    const s = new Sensing(rt);
    const util = {target: {visible: true}};

    const expectedQuestion = 'a question';
    const expectedAnswer = 'the answer';

    rt.removeAllListeners('SAY'); // Prevent say blocks from executing

    rt.addListener('SAY', (target, type, question) => {
        // Should emit SAY with the question
        t.strictEqual(question, expectedQuestion);
    });

    rt.addListener('QUESTION', question => {
        // Question should be blank for a visible target
        t.strictEqual(question, '');

        // Remove the say listener and add a new one to assert bubble is cleared
        // by setting say to empty string after answer is received.
        rt.removeAllListeners('SAY');
        rt.addListener('SAY', (target, type, text) => {
            t.strictEqual(text, '');
            t.end();
        });
        rt.emit('ANSWER', expectedAnswer);
    });

    s.askAndWait({QUESTION: expectedQuestion}, util);
});

test('set drag mode', t => {
    const runtime = new Runtime();
    runtime.requestTargetsUpdate = () => {}; // noop for testing
    const sensing = new Sensing(runtime);
    const s = new Sprite();
    const rt = new RenderedTarget(s, runtime);

    sensing.setDragMode({DRAG_MODE: 'not draggable'}, {target: rt});
    t.strictEqual(rt.draggable, false);

    sensing.setDragMode({DRAG_MODE: 'draggable'}, {target: rt});
    t.strictEqual(rt.draggable, true);

    t.end();
});

test('get loudness with caching', t => {
    const rt = new Runtime();
    const sensing = new Sensing(rt);

    // It should report -1 when audio engine is not available.
    t.strictEqual(sensing.getLoudness(), -1);

    // Stub the audio engine with its getLoudness function, and set up different
    // values to simulate it changing over time.
    const firstLoudness = 1;
    const secondLoudness = 2;
    let simulatedLoudness = firstLoudness;
    rt.audioEngine = {getLoudness: () => simulatedLoudness};

    // It should report -1 when current step time is null.
    t.strictEqual(sensing.getLoudness(), -1);

    // Stub the current step time.
    rt.currentStepTime = 1000 / 30;

    // The first time it works, it should report the result from the stubbed audio engine.
    t.strictEqual(sensing.getLoudness(), firstLoudness);

    // Update the simulated loudness to a new value.
    simulatedLoudness = secondLoudness;

    // Simulate time passing by advancing the timer forward a little bit.
    // After less than a step, it should still report cached loudness.
    let simulatedTime = Date.now() + (rt.currentStepTime / 2);
    sensing._timer = {time: () => simulatedTime};
    t.strictEqual(sensing.getLoudness(), firstLoudness);

    // Simulate more than a step passing. It should now request the value
    // from the audio engine again.
    simulatedTime += rt.currentStepTime;
    t.strictEqual(sensing.getLoudness(), secondLoudness);

    t.end();
});

test('loud? boolean', t => {
    const rt = new Runtime();
    const sensing = new Sensing(rt);

    // The simplest way to test this is to actually override the getLoudness
    // method, which isLoud uses.
    let simulatedLoudness = 0;
    sensing.getLoudness = () => simulatedLoudness;
    t.false(sensing.isLoud());

    // Check for GREATER than 10, not equal.
    simulatedLoudness = 10;
    t.false(sensing.isLoud());

    simulatedLoudness = 11;
    t.true(sensing.isLoud());

    t.end();
});
