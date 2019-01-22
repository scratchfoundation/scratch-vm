const test = require('tap').test;
const Sensing = require('../../src/blocks/scratch3_sensing');
const Runtime = require('../../src/engine/runtime');

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
