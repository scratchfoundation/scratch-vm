const test = require('tap').test;
const Runtime = require('../../src/engine/runtime');

test('spec', t => {
    const r = new Runtime();

    t.type(Runtime, 'function');
    t.type(r, 'object');
    t.ok(r instanceof Runtime);

    t.end();
});

test('monitorWouldChange_false', t => {
    const r = new Runtime();
    const currentMonitorState = {
        id: 'xklj4#!',
        category: 'data',
        label: 'turtle whereabouts',
        value: '25',
        x: 0,
        y: 0
    };
    const newMonitorDelta = {
        id: 'xklj4#!',
        value: String(25)
    };
    t.equals(false, r._monitorWouldChange(currentMonitorState, newMonitorDelta));
    t.end();
});

test('monitorWouldChange_true', t => {
    const r = new Runtime();
    const currentMonitorState = {
        id: 'xklj4#!',
        category: 'data',
        label: 'turtle whereabouts',
        value: '25',
        x: 0,
        y: 0
    };

    // Value change
    let newMonitorDelta = {
        id: 'xklj4#!',
        value: String(24)
    };
    t.equal(true, r._monitorWouldChange(currentMonitorState, newMonitorDelta));

    // Prop change
    newMonitorDelta = {
        id: 'xklj4#!',
        moose: 7
    };
    t.equal(true, r._monitorWouldChange(currentMonitorState, newMonitorDelta));

    t.end();
});
