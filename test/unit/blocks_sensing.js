const test = require('tap').test;
const Sensing = require('../../src/blocks/scratch3_sensing');
const Runtime = require('../../src/engine/runtime');

test('getPrimitives', t => {
    const rt = new Runtime();
    const s = new Sensing(rt);
    t.type(s.getPrimitives(), 'object');
    t.end();
});

test('ask and answer', t => {
    const rt = new Runtime();
    const s = new Sensing(rt);

    const expectedQuestion = 'a question';
    const expectedAnswer = 'the answer';

    // Test is written out of order because of promises, follow the (#) comments.
    rt.addListener('QUESTION', question => {
        // (2) Assert the question is correct, then emit the answer
        t.strictEqual(question, expectedQuestion);
        rt.emit('ANSWER', expectedAnswer);
    });

    // (1) Emit the question.
    const promise = s.askAndWait({QUESTION: expectedQuestion});

    // (3) Ask block resolves after the answer is emitted.
    promise.then(() => {
        t.strictEqual(s.getAnswer(), expectedAnswer);
        t.end();
    });
});
