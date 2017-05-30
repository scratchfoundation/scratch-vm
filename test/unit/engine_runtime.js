const test = require('tap').test;
const Runtime = require('../../src/engine/runtime');
const MonitorRecord = require('../../src/engine/monitor-record');
const {Map} = require('immutable');

test('spec', t => {
    const r = new Runtime();

    t.type(Runtime, 'function');
    t.type(r, 'object');
    t.ok(r instanceof Runtime);

    t.end();
});

test('monitorStateEquals', t => {
    const r = new Runtime();
    const id = 'xklj4#!';
    const prevMonitorState = MonitorRecord({
        id,
        opcode: 'turtle whereabouts',
        value: '25'
    });
    const newMonitorDelta = Map({
        id,
        value: String(25)
    });
    r.requestAddMonitor(prevMonitorState);
    r.requestUpdateMonitor(newMonitorDelta);

    t.equals(true, prevMonitorState === r._monitorState.get(id));
    t.equals(String(25), r._monitorState.get(id).get('value'));
    t.end();
});

test('monitorStateDoesNotEqual', t => {
    const r = new Runtime();
    const id = 'xklj4#!';
    const params = {seven: 7};
    const prevMonitorState = MonitorRecord({
        id,
        opcode: 'turtle whereabouts',
        value: '25'
    });

    // Value change
    let newMonitorDelta = Map({
        id,
        value: String(24)
    });
    r.requestAddMonitor(prevMonitorState);
    r.requestUpdateMonitor(newMonitorDelta);
    
    t.equals(false, prevMonitorState.equals(r._monitorState.get(id)));
    t.equals(String(24), r._monitorState.get(id).get('value'));

    // Prop change
    newMonitorDelta = Map({
        id: 'xklj4#!',
        params: params
    });
    r.requestUpdateMonitor(newMonitorDelta);

    t.equals(false, prevMonitorState.equals(r._monitorState.get(id)));
    t.equals(String(24), r._monitorState.get(id).value);
    t.equals(params, r._monitorState.get(id).params);

    t.end();
});
