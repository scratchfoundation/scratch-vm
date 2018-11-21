const test = require('tap').test;
const Cloud = require('../../src/io/cloud');
const Target = require('../../src/engine/target');
const Variable = require('../../src/engine/variable');
const Runtime = require('../../src/engine/runtime');

test('spec', t => {
    const runtime = new Runtime();
    const cloud = new Cloud(runtime);

    t.type(cloud, 'object');
    t.type(cloud.postData, 'function');
    t.type(cloud.requestUpdateVariable, 'function');
    t.type(cloud.updateCloudVariable, 'function');
    t.type(cloud.requestCreateVariable, 'function');
    t.type(cloud.createCloudVariable, 'function');
    t.type(cloud.setProvider, 'function');
    t.type(cloud.setStage, 'function');
    t.type(cloud.clear, 'function');
    t.end();
});

test('stage and provider are null initially', t => {
    const runtime = new Runtime();
    const cloud = new Cloud(runtime);

    t.strictEquals(cloud.provider, null);
    t.strictEquals(cloud.stage, null);
    t.end();
});

test('setProvider sets the provider', t => {
    const runtime = new Runtime();
    const cloud = new Cloud(runtime);

    const provider = {
        foo: 'a fake provider'
    };

    cloud.setProvider(provider);
    t.strictEquals(cloud.provider, provider);

    t.end();
});

test('postData update message updates the variable', t => {
    const stage = new Target();
    const fooVar = new Variable(
        'a fake var id',
        'foo',
        Variable.SCALAR_TYPE,
        true /* isCloud */
    );
    stage.variables[fooVar.id] = fooVar;

    t.strictEquals(fooVar.value, 0);

    const runtime = new Runtime();
    const cloud = new Cloud(runtime);
    cloud.setStage(stage);
    cloud.postData({varUpdate: {
        name: 'foo',
        value: 3
    }});
    t.strictEquals(fooVar.value, 3);
    t.end();
});

test('postData create message sets isCloud flag on the variable and updates runtime cloud limit', t => {
    const stage = new Target();
    const fooVar = new Variable(
        'a fake var id',
        'foo',
        Variable.SCALAR_TYPE,
        false /* isCloud */
    );
    stage.variables[fooVar.id] = fooVar;

    t.strictEquals(fooVar.value, 0);
    t.strictEquals(fooVar.isCloud, false);

    const runtime = new Runtime();
    const cloud = new Cloud(runtime);
    cloud.setStage(stage);
    cloud.postData({varCreate: {
        name: 'foo'
    }});
    t.strictEquals(fooVar.isCloud, true);
    t.strictEquals(runtime.hasCloudData(), true);
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

    const runtime = new Runtime();
    const cloud = new Cloud(runtime);
    cloud.setProvider(provider);
    cloud.requestUpdateVariable('foo', 3);
    t.equals(updateVariableCalled, true);
    t.strictEquals(mockVarName, 'foo');
    t.strictEquals(mockVarValue, 3);
    t.end();
});

test('requestCreateVariable calls provider\'s createVariable function', t => {
    let createVariableCalled = false;
    const mockVariable = new Variable('a var id', 'my var', Variable.SCALAR_TYPE, false);
    let mockVarName;
    let mockVarValue;
    const mockCreateVariable = (name, value) => {
        createVariableCalled = true;
        mockVarName = name;
        mockVarValue = value;
        return;
    };

    const provider = {
        createVariable: mockCreateVariable
    };

    const runtime = new Runtime();
    const cloud = new Cloud(runtime);
    cloud.setProvider(provider);
    cloud.requestCreateVariable(mockVariable);
    t.equals(createVariableCalled, true);
    t.strictEquals(mockVarName, 'my var');
    t.strictEquals(mockVarValue, 0);
    // Calling requestCreateVariable does not set isCloud flag on variable
    t.strictEquals(mockVariable.isCloud, false);
    t.end();
});

test('requestRenameVariable calls provider\'s renameVariable function', t => {
    let renameVariableCalled = false;
    let mockVarOldName;
    let mockVarNewName;
    const mockRenameVariable = (oldName, newName) => {
        renameVariableCalled = true;
        mockVarOldName = oldName;
        mockVarNewName = newName;
        return;
    };

    const provider = {
        renameVariable: mockRenameVariable
    };

    const runtime = new Runtime();
    const cloud = new Cloud(runtime);
    cloud.setProvider(provider);
    cloud.requestRenameVariable('my var', 'new var name');
    t.equals(renameVariableCalled, true);
    t.strictEquals(mockVarOldName, 'my var');
    t.strictEquals(mockVarNewName, 'new var name');
    t.end();
});

test('requestDeleteVariable calls provider\'s deleteVariable function', t => {
    let deleteVariableCalled = false;
    let mockVarName;
    const mockDeleteVariable = name => {
        deleteVariableCalled = true;
        mockVarName = name;
        return;
    };

    const provider = {
        deleteVariable: mockDeleteVariable
    };

    const runtime = new Runtime();
    const cloud = new Cloud(runtime);
    cloud.setProvider(provider);
    cloud.requestDeleteVariable('my var');
    t.equals(deleteVariableCalled, true);
    t.strictEquals(mockVarName, 'my var');
    t.end();
});
