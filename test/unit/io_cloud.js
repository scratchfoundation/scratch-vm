const test = require('tap').test;
const Cloud = require('../../src/io/cloud');
const Target = require('../../src/engine/target');
const Variable = require('../../src/engine/variable');

test('spec', t => {
    const cloud = new Cloud();

    t.type(cloud, 'object');
    t.type(cloud.postData, 'function');
    t.type(cloud.requestUpdateVariable, 'function');
    t.type(cloud.updateCloudVariable, 'function');
    t.type(cloud.setProvider, 'function');
    t.type(cloud.setStage, 'function');
    t.type(cloud.clear, 'function');
    t.end();
});

test('stage and provider are null initially', t => {
    const cloud = new Cloud();

    t.strictEquals(cloud.provider, null);
    t.strictEquals(cloud.stage, null);
    t.end();
});

test('setProvider sets the provider', t => {
    const cloud = new Cloud();

    const provider = {
        foo: 'a fake provider'
    };

    cloud.setProvider(provider);
    t.strictEquals(cloud.provider, provider);

    t.end();
});

test('postData updates the variable', t => {
    const stage = new Target();
    const fooVar = new Variable(
        'a fake var id',
        'foo',
        Variable.SCALAR_TYPE,
        true /* isCloud */
    );
    stage.variables[fooVar.id] = fooVar;

    t.strictEquals(fooVar.value, 0);

    const cloud = new Cloud();
    cloud.setStage(stage);
    cloud.postData({varUpdate: {
        name: 'foo',
        value: 3
    }});
    t.strictEquals(fooVar.value, 3);
    t.end();
});

test('requestUpdateVariable calls provider\'s updateVariable function', t => {
    let updateVariableCalled = false;
    let mockVarName = '';
    let mockVarValue = '';
    const mockUpdateVariable = (name, value) => {
        updateVariableCalled = true;
        mockVarName = name;
        mockVarValue = value;
        return;
    };

    const provider = {
        updateVariable: mockUpdateVariable
    };

    const cloud = new Cloud();
    cloud.setProvider(provider);
    cloud.requestUpdateVariable('foo', 3);
    t.equals(updateVariableCalled, true);
    t.strictEquals(mockVarName, 'foo');
    t.strictEquals(mockVarValue, 3);
    t.end();
});
