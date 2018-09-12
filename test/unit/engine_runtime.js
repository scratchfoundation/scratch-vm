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

test('getLabelForOpcode', t => {
    const r = new Runtime();

    const fakeExtension = {
        id: 'fakeExtension',
        name: 'Fake Extension',
        blocks: [
            {
                info: {
                    opcode: 'foo',
                    json: {},
                    text: 'Foo',
                    xml: ''
                }
            },
            {
                info: {
                    opcode: 'foo_2',
                    json: {},
                    text: 'Foo 2',
                    xml: ''
                }
            }
        ]
    };

    r._blockInfo.push(fakeExtension);

    const result1 = r.getLabelForOpcode('fakeExtension_foo');
    t.type(result1.category, 'string');
    t.type(result1.label, 'string');
    t.equals(result1.label, 'Fake Extension: Foo');

    const result2 = r.getLabelForOpcode('fakeExtension_foo_2');
    t.type(result2.category, 'string');
    t.type(result2.label, 'string');
    t.equals(result2.label, 'Fake Extension: Foo 2');

    t.end();
});
