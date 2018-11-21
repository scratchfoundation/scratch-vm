const test = require('tap').test;
const Target = require('../../src/engine/target');
const Variable = require('../../src/engine/variable');
const adapter = require('../../src/engine/adapter');
const Runtime = require('../../src/engine/runtime');
const events = require('../fixtures/events.json');

test('spec', t => {
    const target = new Target();

    t.type(Target, 'function');
    t.type(target, 'object');
    t.ok(target instanceof Target);

    t.type(target.id, 'string');
    t.type(target.blocks, 'object');
    t.type(target.variables, 'object');
    t.type(target.comments, 'object');
    t.type(target._customState, 'object');

    t.type(target.createVariable, 'function');
    t.type(target.renameVariable, 'function');

    t.end();
});

// Create Variable tests.
test('createVariable', t => {
    const target = new Target();
    target.createVariable('foo', 'bar', Variable.SCALAR_TYPE);

    const variables = target.variables;
    t.equal(Object.keys(variables).length, 1);
    const variable = variables[Object.keys(variables)[0]];
    t.equal(variable.id, 'foo');
    t.equal(variable.name, 'bar');
    t.equal(variable.type, Variable.SCALAR_TYPE);
    t.equal(variable.value, 0);
    t.equal(variable.isCloud, false);

    t.end();
});

// Create Same Variable twice.
test('createVariable2', t => {
    const target = new Target();
    target.createVariable('foo', 'bar', Variable.SCALAR_TYPE);
    target.createVariable('foo', 'bar', Variable.SCALAR_TYPE);

    const variables = target.variables;
    t.equal(Object.keys(variables).length, 1);

    t.end();
});

// Create a list
test('createListVariable creates a list', t => {
    const target = new Target();
    target.createVariable('foo', 'bar', Variable.LIST_TYPE);

    const variables = target.variables;
    t.equal(Object.keys(variables).length, 1);
    const variable = variables[Object.keys(variables)[0]];
    t.equal(variable.id, 'foo');
    t.equal(variable.name, 'bar');
    t.equal(variable.type, Variable.LIST_TYPE);
    t.assert(variable.value instanceof Array, true);
    t.equal(variable.value.length, 0);
    t.equal(variable.isCloud, false);

    t.end();
});

test('createVariable calls cloud io device\'s requestCreateVariable', t => {
    const runtime = new Runtime();
    // Mock the requestCreateVariable function
    let requestCreateCloudWasCalled = false;
    runtime.ioDevices.cloud.requestCreateVariable = () => {
        requestCreateCloudWasCalled = true;
    };

    const target = new Target(runtime);
    target.isStage = true;
    target.createVariable('foo', 'bar', Variable.SCALAR_TYPE, true /* isCloud */);

    const variables = target.variables;
    t.equal(Object.keys(variables).length, 1);
    const variable = variables[Object.keys(variables)[0]];
    t.equal(variable.id, 'foo');
    t.equal(variable.name, 'bar');
    t.equal(variable.type, Variable.SCALAR_TYPE);
    t.equal(variable.value, 0);
    // isCloud flag doesn't get set by the target createVariable function
    t.equal(variable.isCloud, false);
    t.equal(requestCreateCloudWasCalled, true);

    t.end();
});

test('createVariable does not call cloud io device\'s requestCreateVariable if target is not stage', t => {
    const runtime = new Runtime();
    // Mock the requestCreateVariable function
    let requestCreateCloudWasCalled = false;
    runtime.ioDevices.cloud.requestCreateVariable = () => {
        requestCreateCloudWasCalled = true;
    };

    const target = new Target(runtime);
    target.isStage = false;
    target.createVariable('foo', 'bar', Variable.SCALAR_TYPE, true /* isCloud */);

    const variables = target.variables;
    t.equal(Object.keys(variables).length, 1);
    const variable = variables[Object.keys(variables)[0]];
    t.equal(variable.id, 'foo');
    t.equal(variable.name, 'bar');
    t.equal(variable.type, Variable.SCALAR_TYPE);
    t.equal(variable.value, 0);
    // isCloud flag doesn't get set by the target createVariable function
    t.equal(variable.isCloud, false);
    t.equal(requestCreateCloudWasCalled, false);

    t.end();
});

test('createVariable throws when given invalid type', t => {
    const target = new Target();
    t.throws(
        (() => target.createVariable('foo', 'bar', 'baz')),
        new Error('Invalid variable type: baz')
    );

    t.end();
});

// Rename Variable tests.
test('renameVariable', t => {
    const target = new Target();
    target.createVariable('foo', 'bar', Variable.SCALAR_TYPE);
    target.renameVariable('foo', 'bar2');

    const variables = target.variables;
    t.equal(Object.keys(variables).length, 1);
    const variable = variables[Object.keys(variables)[0]];
    t.equal(variable.id, 'foo');
    t.equal(variable.name, 'bar2');
    t.equal(variable.value, 0);
    t.equal(variable.isCloud, false);

    t.end();
});

// Rename Variable that doesn't exist.
test('renameVariable2', t => {
    const target = new Target();
    target.renameVariable('foo', 'bar2');

    const variables = target.variables;
    t.equal(Object.keys(variables).length, 0);

    t.end();
});

// Rename Variable that with id that exists as another variable's name.
// Expect no change.
test('renameVariable3', t => {
    const target = new Target();
    target.createVariable('foo1', 'foo', Variable.SCALAR_TYPE);
    target.renameVariable('foo', 'bar2');

    const variables = target.variables;
    t.equal(Object.keys(variables).length, 1);
    const variable = variables[Object.keys(variables)[0]];
    t.equal(variable.id, 'foo1');
    t.equal(variable.name, 'foo');

    t.end();
});

test('renameVariable calls cloud io device\'s requestRenameVariable function', t => {
    const runtime = new Runtime();

    let requestRenameVariableWasCalled = false;
    runtime.ioDevices.cloud.requestRenameVariable = () => {
        requestRenameVariableWasCalled = true;
    };

    const target = new Target(runtime);
    target.isStage = true;
    const mockCloudVar = new Variable('foo', 'bar', Variable.SCALAR_TYPE, true);
    target.variables[mockCloudVar.id] = mockCloudVar;
    runtime.targets.push(target);

    target.renameVariable('foo', 'bar2');

    const variables = target.variables;
    t.equal(Object.keys(variables).length, 1);
    const variable = variables[Object.keys(variables)[0]];
    t.equal(variable.id, 'foo');
    t.equal(variable.name, 'bar2');
    t.equal(variable.value, 0);
    t.equal(variable.isCloud, true);
    t.equal(requestRenameVariableWasCalled, true);

    t.end();
});

test('renameVariable does not call cloud io device\'s requestRenameVariable function if target is not stage', t => {
    const runtime = new Runtime();

    let requestRenameVariableWasCalled = false;
    runtime.ioDevices.cloud.requestRenameVariable = () => {
        requestRenameVariableWasCalled = true;
    };

    const target = new Target(runtime);
    const mockCloudVar = new Variable('foo', 'bar', Variable.SCALAR_TYPE, true);
    target.variables[mockCloudVar.id] = mockCloudVar;
    runtime.targets.push(target);

    target.renameVariable('foo', 'bar2');

    const variables = target.variables;
    t.equal(Object.keys(variables).length, 1);
    const variable = variables[Object.keys(variables)[0]];
    t.equal(variable.id, 'foo');
    t.equal(variable.name, 'bar2');
    t.equal(variable.value, 0);
    t.equal(variable.isCloud, true);
    t.equal(requestRenameVariableWasCalled, false);

    t.end();
});

// Delete Variable tests.
test('deleteVariable', t => {
    const target = new Target();
    target.createVariable('foo', 'bar', Variable.SCALAR_TYPE);
    target.deleteVariable('foo');

    const variables = target.variables;
    t.equal(Object.keys(variables).length, 0);

    t.end();
});

// Delete Variable that doesn't exist.
test('deleteVariable2', t => {
    const target = new Target();
    target.deleteVariable('foo');

    const variables = target.variables;
    t.equal(Object.keys(variables).length, 0);

    t.end();
});

test('deleteVariable calls cloud io device\'s requestRenameVariable function', t => {
    const runtime = new Runtime();

    let requestDeleteVariableWasCalled = false;
    runtime.ioDevices.cloud.requestDeleteVariable = () => {
        requestDeleteVariableWasCalled = true;
    };

    const target = new Target(runtime);
    target.isStage = true;
    const mockCloudVar = new Variable('foo', 'bar', Variable.SCALAR_TYPE, true);
    target.variables[mockCloudVar.id] = mockCloudVar;
    runtime.targets.push(target);

    target.deleteVariable('foo');

    const variables = target.variables;
    t.equal(Object.keys(variables).length, 0);
    t.equal(requestDeleteVariableWasCalled, true);

    t.end();
});

test('deleteVariable calls cloud io device\'s requestRenameVariable function', t => {
    const runtime = new Runtime();

    let requestDeleteVariableWasCalled = false;
    runtime.ioDevices.cloud.requestDeleteVariable = () => {
        requestDeleteVariableWasCalled = true;
    };

    const target = new Target(runtime);
    const mockCloudVar = new Variable('foo', 'bar', Variable.SCALAR_TYPE, true);
    target.variables[mockCloudVar.id] = mockCloudVar;
    runtime.targets.push(target);

    target.deleteVariable('foo');

    const variables = target.variables;
    t.equal(Object.keys(variables).length, 0);
    t.equal(requestDeleteVariableWasCalled, false);

    t.end();
});

test('duplicateVariable creates a new variable with a new ID by default', t => {
    const target = new Target();
    target.createVariable('a var ID', 'foo', Variable.SCALAR_TYPE);
    t.equal(Object.keys(target.variables).length, 1);
    const originalVariable = target.variables['a var ID'];
    originalVariable.value = 10;
    const newVariable = target.duplicateVariable('a var ID');
    // Duplicating a variable should not add the variable to the current target
    t.equal(Object.keys(target.variables).length, 1);
    // Duplicate variable should have a different ID from the original unless specified to keep the original ID.
    t.notEqual(newVariable.id, 'a var ID');
    t.type(target.variables[newVariable.id], 'undefined');

    // Duplicate variable should start out with the same value as the original variable
    t.equal(newVariable.value, originalVariable.value);

    // Modifying one variable should not modify the other
    newVariable.value = 15;
    t.notEqual(newVariable.value, originalVariable.value);
    t.equal(originalVariable.value, 10);

    t.end();
});

test('duplicateVariable creates a new variable with a original ID if specified', t => {
    const target = new Target();
    target.createVariable('a var ID', 'foo', Variable.SCALAR_TYPE);
    t.equal(Object.keys(target.variables).length, 1);
    const originalVariable = target.variables['a var ID'];
    originalVariable.value = 10;
    const newVariable = target.duplicateVariable('a var ID', true);
    // Duplicating a variable should not add the variable to the current target
    t.equal(Object.keys(target.variables).length, 1);
    // Duplicate variable should have the same ID as the original when specified
    t.equal(newVariable.id, 'a var ID');

    // Duplicate variable should start out with the same value as the original variable
    t.equal(newVariable.value, originalVariable.value);

    // Modifying one variable should not modify the other
    newVariable.value = 15;
    t.notEqual(newVariable.value, originalVariable.value);
    t.equal(originalVariable.value, 10);
    // The target should still have the original variable with the original value
    t.equal(target.variables['a var ID'].value, 10);

    t.end();
});

test('duplicateVariable returns null if variable with specified ID does not exist', t => {
    const target = new Target();

    const variable = target.duplicateVariable('a var ID');
    t.equal(variable, null);
    t.equal(Object.keys(target.variables).length, 0);

    target.createVariable('var id', 'foo', Variable.SCALAR_TYPE);
    t.equal(Object.keys(target.variables).length, 1);

    const anotherVariable = target.duplicateVariable('another var ID');
    t.equal(anotherVariable, null);
    t.equal(Object.keys(target.variables).length, 1);
    t.type(target.variables['another var ID'], 'undefined');
    t.type(target.variables['var id'], 'object');
    t.notEqual(target.variables['var id'], null);

    t.end();
});

test('duplicateVariables duplicates all variables', t => {
    const target = new Target();
    target.createVariable('var ID 1', 'var1', Variable.SCALAR_TYPE);
    target.createVariable('var ID 2', 'var2', Variable.SCALAR_TYPE);

    t.equal(Object.keys(target.variables).length, 2);

    const var1 = target.variables['var ID 1'];
    const var2 = target.variables['var ID 2'];

    var1.value = 3;
    var2.value = 'foo';

    const duplicateVariables = target.duplicateVariables();

    // Duplicating a target's variables should not change the target's own variables.
    t.equal(Object.keys(target.variables).length, 2);
    t.equal(Object.keys(duplicateVariables).length, 2);

    // Should be able to find original var IDs in both this target's variables and
    // the duplicate variables since a blocks container was not specified.
    t.equal(target.variables.hasOwnProperty('var ID 1'), true);
    t.equal(target.variables.hasOwnProperty('var ID 2'), true);
    t.equal(duplicateVariables.hasOwnProperty('var ID 1'), true);
    t.equal(duplicateVariables.hasOwnProperty('var ID 1'), true);

    // Values of the duplicate varaiables should match the value of the original values at the time of duplication
    t.equal(target.variables['var ID 1'].value, duplicateVariables['var ID 1'].value);
    t.equal(duplicateVariables['var ID 1'].value, 3);
    t.equal(target.variables['var ID 2'].value, duplicateVariables['var ID 2'].value);
    t.equal(duplicateVariables['var ID 2'].value, 'foo');

    // The two sets of variables should still be distinct, modifying the target's variables
    // should not affect the duplicated variables, and vice-versa

    var1.value = 10;
    t.equal(target.variables['var ID 1'].value, 10);
    t.equal(duplicateVariables['var ID 1'].value, 3); // should remain unchanged from initial value

    duplicateVariables['var ID 2'].value = 'bar';
    t.equal(target.variables['var ID 2'].value, 'foo');

    // Deleting a variable on the target should not change the duplicated variables
    target.deleteVariable('var ID 1');
    t.equal(Object.keys(target.variables).length, 1);
    t.equal(Object.keys(duplicateVariables).length, 2);
    t.type(duplicateVariables['var ID 1'], 'object');
    t.notEqual(duplicateVariables['var ID 1'], null);

    t.end();
});

test('duplicateVariables re-IDs variables when a block container is provided', t => {
    const target = new Target();

    target.createVariable('mock var id', 'a mock variable', Variable.SCALAR_TYPE);
    target.createVariable('another var id', 'var2', Variable.SCALAR_TYPE);

    // Create a block on the target which references the variable with id 'mock var id'
    target.blocks.createBlock(adapter(events.mockVariableBlock)[0]);

    t.type(target.blocks.getBlock('a block'), 'object');
    t.type(target.blocks.getBlock('a block').fields.VARIABLE, 'object');
    t.equal(target.blocks.getBlock('a block').fields.VARIABLE.id, 'mock var id');
    t.equal(target.blocks.getBlock('a block').fields.VARIABLE.value, 'a mock variable');

    // Deep clone this target's blocks to pass in to 'duplicateVariables'
    const copiedBlocks = target.blocks.duplicate();

    // The copied block should still have the same ID, and its VARIABLE field should still refer to
    // the original variable id
    t.type(copiedBlocks.getBlock('a block'), 'object');
    t.type(copiedBlocks.getBlock('a block').fields.VARIABLE, 'object');
    t.equal(copiedBlocks.getBlock('a block').fields.VARIABLE.id, 'mock var id');
    t.equal(copiedBlocks.getBlock('a block').fields.VARIABLE.value, 'a mock variable');

    const duplicateVariables = target.duplicateVariables(copiedBlocks);

    // Duplicate variables should have new IDs
    t.equal(Object.keys(duplicateVariables).length, 2);
    t.type(duplicateVariables['mock var id'], 'undefined');
    t.type(duplicateVariables['another var id'], 'undefined');

    // Duplicate variables still have the same names..
    const dupes = Object.values(duplicateVariables);
    const dupeVarNames = dupes.map(v => v.name);

    t.notEqual(dupeVarNames.indexOf('a mock variable'), -1);
    t.notEqual(dupeVarNames.indexOf('var2'), -1);

    // Duplicating variables should not change blocks on current target
    t.type(target.blocks.getBlock('a block'), 'object');
    t.equal(target.blocks.getBlock('a block').fields.VARIABLE.id, 'mock var id');
    t.equal(target.blocks.getBlock('a block').fields.VARIABLE.value, 'a mock variable');

    // The copied blocks passed into duplicateVariables should now reference the new
    // variable ID
    const mockVariableDupe = dupes[dupeVarNames.indexOf('a mock variable')];
    const mockVarDupeID = mockVariableDupe.id;

    t.type(copiedBlocks.getBlock('a block'), 'object');
    t.equal(copiedBlocks.getBlock('a block').fields.VARIABLE.id, mockVarDupeID);
    t.equal(copiedBlocks.getBlock('a block').fields.VARIABLE.value, 'a mock variable');

    t.end();
});

test('lookupOrCreateList creates a list if var with given id or var with given name does not exist', t => {
    const target = new Target();
    const variables = target.variables;

    t.equal(Object.keys(variables).length, 0);
    const listVar = target.lookupOrCreateList('foo', 'bar');
    t.equal(Object.keys(variables).length, 1);
    t.equal(listVar.id, 'foo');
    t.equal(listVar.name, 'bar');

    t.end();
});

test('lookupOrCreateList returns list if one with given id exists', t => {
    const target = new Target();
    const variables = target.variables;

    t.equal(Object.keys(variables).length, 0);
    target.createVariable('foo', 'bar', Variable.LIST_TYPE);
    t.equal(Object.keys(variables).length, 1);

    const listVar = target.lookupOrCreateList('foo', 'bar');
    t.equal(Object.keys(variables).length, 1);
    t.equal(listVar.id, 'foo');
    t.equal(listVar.name, 'bar');

    t.end();
});

test('lookupOrCreateList succeeds in finding list if id is incorrect but name matches', t => {
    const target = new Target();
    const variables = target.variables;

    t.equal(Object.keys(variables).length, 0);
    target.createVariable('foo', 'bar', Variable.LIST_TYPE);
    t.equal(Object.keys(variables).length, 1);

    const listVar = target.lookupOrCreateList('not foo', 'bar');
    t.equal(Object.keys(variables).length, 1);
    t.equal(listVar.id, 'foo');
    t.equal(listVar.name, 'bar');

    t.end();
});

test('lookupBroadcastMsg returns the var with given id if exists', t => {
    const target = new Target();
    const variables = target.variables;

    t.equal(Object.keys(variables).length, 0);
    target.createVariable('foo', 'bar', Variable.BROADCAST_MESSAGE_TYPE);
    t.equal(Object.keys(variables).length, 1);

    const broadcastMsg = target.lookupBroadcastMsg('foo', 'bar');
    t.equal(Object.keys(variables).length, 1);
    t.equal(broadcastMsg.id, 'foo');
    t.equal(broadcastMsg.name, 'bar');

    t.end();
});

test('createComment adds a comment to the target', t => {
    const target = new Target();
    const comments = target.comments;

    t.equal(Object.keys(comments).length, 0);
    target.createComment('a comment', null, 'some comment text',
        10, 20, 200, 300, true);
    t.equal(Object.keys(comments).length, 1);

    const comment = comments['a comment'];
    t.notEqual(comment, null);
    t.equal(comment.blockId, null);
    t.equal(comment.text, 'some comment text');
    t.equal(comment.x, 10);
    t.equal(comment.y, 20);
    t.equal(comment.width, 200);
    t.equal(comment.height, 300);
    t.equal(comment.minimized, true);

    t.end();
});

test('creating comment with id that already exists does not change existing comment', t => {
    const target = new Target();
    const comments = target.comments;

    t.equal(Object.keys(comments).length, 0);
    target.createComment('a comment', null, 'some comment text',
        10, 20, 200, 300, true);
    t.equal(Object.keys(comments).length, 1);

    target.createComment('a comment', null,
        'some new comment text', 40, 50, 300, 400, false);

    const comment = comments['a comment'];
    t.notEqual(comment, null);
    // All of the comment properties should remain unchanged from the first
    // time createComment was called
    t.equal(comment.blockId, null);
    t.equal(comment.text, 'some comment text');
    t.equal(comment.x, 10);
    t.equal(comment.y, 20);
    t.equal(comment.width, 200);
    t.equal(comment.height, 300);
    t.equal(comment.minimized, true);

    t.end();
});

test('creating a comment with a blockId also updates the comment property on the block', t => {
    const target = new Target();
    const comments = target.comments;
    // Create a mock block on the target
    target.blocks = {
        'a mock block': {
            id: 'a mock block'
        }
    };

    // Mock the getBlock function that's used in commentCreate
    target.blocks.getBlock = id => target.blocks[id];

    t.equal(Object.keys(comments).length, 0);
    target.createComment('a comment', 'a mock block', 'some comment text',
        10, 20, 200, 300, true);
    t.equal(Object.keys(comments).length, 1);

    const comment = comments['a comment'];
    t.equal(comment.blockId, 'a mock block');
    t.equal(target.blocks.getBlock('a mock block').comment, 'a comment');

    t.end();
});

test('fixUpVariableReferences fixes sprite global var conflicting with project global var', t => {
    const runtime = new Runtime();

    const stage = new Target(runtime);
    stage.isStage = true;

    const target = new Target(runtime);
    target.isStage = false;

    runtime.targets = [stage, target];

    // Create a global variable
    stage.createVariable('pre-existing global var id', 'a mock variable', Variable.SCALAR_TYPE);

    target.blocks.createBlock(adapter(events.mockVariableBlock)[0]);

    t.equal(Object.keys(target.variables).length, 0);
    t.equal(Object.keys(stage.variables).length, 1);
    t.type(target.blocks.getBlock('a block'), 'object');
    t.type(target.blocks.getBlock('a block').fields, 'object');
    t.type(target.blocks.getBlock('a block').fields.VARIABLE, 'object');
    t.equal(target.blocks.getBlock('a block').fields.VARIABLE.id, 'mock var id');

    target.fixUpVariableReferences();

    t.equal(Object.keys(target.variables).length, 0);
    t.equal(Object.keys(stage.variables).length, 1);
    t.type(target.blocks.getBlock('a block'), 'object');
    t.type(target.blocks.getBlock('a block').fields, 'object');
    t.type(target.blocks.getBlock('a block').fields.VARIABLE, 'object');
    t.equal(target.blocks.getBlock('a block').fields.VARIABLE.id, 'pre-existing global var id');

    t.end();
});

test('fixUpVariableReferences fixes sprite local var conflicting with project global var', t => {
    const runtime = new Runtime();

    const stage = new Target(runtime);
    stage.isStage = true;

    const target = new Target(runtime);
    target.isStage = false;
    target.getName = () => 'Target';

    runtime.targets = [stage, target];

    // Create a global variable
    stage.createVariable('pre-existing global var id', 'a mock variable', Variable.SCALAR_TYPE);
    target.createVariable('mock var id', 'a mock variable', Variable.SCALAR_TYPE);

    target.blocks.createBlock(adapter(events.mockVariableBlock)[0]);

    t.equal(Object.keys(target.variables).length, 1);
    t.equal(Object.keys(stage.variables).length, 1);
    t.type(target.blocks.getBlock('a block'), 'object');
    t.type(target.blocks.getBlock('a block').fields, 'object');
    t.type(target.blocks.getBlock('a block').fields.VARIABLE, 'object');
    t.equal(target.blocks.getBlock('a block').fields.VARIABLE.id, 'mock var id');
    t.equal(target.variables['mock var id'].name, 'a mock variable');

    target.fixUpVariableReferences();

    t.equal(Object.keys(target.variables).length, 1);
    t.equal(Object.keys(stage.variables).length, 1);
    t.type(target.blocks.getBlock('a block'), 'object');
    t.type(target.blocks.getBlock('a block').fields, 'object');
    t.type(target.blocks.getBlock('a block').fields.VARIABLE, 'object');
    t.equal(target.blocks.getBlock('a block').fields.VARIABLE.id, 'mock var id');
    t.equal(target.variables['mock var id'].name, 'Target: a mock variable');

    t.end();
});

test('fixUpVariableReferences fixes conflicting sprite local var without blocks referencing var', t => {
    const runtime = new Runtime();

    const stage = new Target(runtime);
    stage.isStage = true;

    const target = new Target(runtime);
    target.isStage = false;
    target.getName = () => 'Target';

    runtime.targets = [stage, target];

    // Create a global variable
    stage.createVariable('pre-existing global var id', 'a mock variable', Variable.SCALAR_TYPE);
    target.createVariable('mock var id', 'a mock variable', Variable.SCALAR_TYPE);


    t.equal(Object.keys(target.variables).length, 1);
    t.equal(Object.keys(stage.variables).length, 1);
    t.equal(target.variables['mock var id'].name, 'a mock variable');

    target.fixUpVariableReferences();

    t.equal(Object.keys(target.variables).length, 1);
    t.equal(Object.keys(stage.variables).length, 1);
    t.equal(target.variables['mock var id'].name, 'Target: a mock variable');

    t.end();
});

test('fixUpVariableReferences fixes sprite global var conflicting with other sprite\'s local var', t => {
    const runtime = new Runtime();

    const stage = new Target(runtime);
    stage.isStage = true;

    const target = new Target(runtime);
    target.isStage = false;

    const existingTarget = new Target(runtime);
    existingTarget.isStage = false;

    runtime.targets = [stage, target, existingTarget];

    // Create a local variable on the pre-existing target
    existingTarget.createVariable('pre-existing local var id', 'a mock variable', Variable.SCALAR_TYPE);

    target.blocks.createBlock(adapter(events.mockVariableBlock)[0]);

    t.equal(Object.keys(existingTarget.variables).length, 1);
    const existingVariable = Object.values(existingTarget.variables)[0];
    t.equal(existingVariable.name, 'a mock variable');
    t.equal(Object.keys(target.variables).length, 0);
    t.equal(Object.keys(stage.variables).length, 0);
    t.type(target.blocks.getBlock('a block'), 'object');
    t.type(target.blocks.getBlock('a block').fields, 'object');
    t.type(target.blocks.getBlock('a block').fields.VARIABLE, 'object');
    t.equal(target.blocks.getBlock('a block').fields.VARIABLE.id, 'mock var id');

    target.fixUpVariableReferences();

    t.equal(Object.keys(existingTarget.variables).length, 1);
    t.equal(existingVariable.name, 'a mock variable');
    t.equal(Object.keys(target.variables).length, 0);
    t.equal(Object.keys(stage.variables).length, 1);
    t.type(target.blocks.getBlock('a block'), 'object');
    t.type(target.blocks.getBlock('a block').fields, 'object');
    t.type(target.blocks.getBlock('a block').fields.VARIABLE, 'object');
    t.equal(target.blocks.getBlock('a block').fields.VARIABLE.id, 'mock var id');
    const newGlobal = stage.variables[Object.keys(stage.variables)[0]];
    t.equal(newGlobal.name, 'a mock variable2');

    t.end();
});

test('fixUpVariableReferences does not change variable name if there is no variable conflict', t => {
    const runtime = new Runtime();

    const stage = new Target(runtime);
    stage.isStage = true;

    const target = new Target(runtime);
    target.isStage = false;
    target.getName = () => 'Target';

    runtime.targets = [stage, target];

    // Create a global variable
    stage.createVariable('pre-existing global var id', 'a variable', Variable.SCALAR_TYPE);
    stage.createVariable('pre-existing global list id', 'a mock variable', Variable.LIST_TYPE);
    target.createVariable('mock var id', 'a mock variable', Variable.SCALAR_TYPE);

    target.blocks.createBlock(adapter(events.mockVariableBlock)[0]);

    t.equal(Object.keys(target.variables).length, 1);
    t.equal(Object.keys(stage.variables).length, 2);
    t.type(target.blocks.getBlock('a block'), 'object');
    t.type(target.blocks.getBlock('a block').fields, 'object');
    t.type(target.blocks.getBlock('a block').fields.VARIABLE, 'object');
    t.equal(target.blocks.getBlock('a block').fields.VARIABLE.id, 'mock var id');
    t.equal(target.variables['mock var id'].name, 'a mock variable');

    target.fixUpVariableReferences();

    t.equal(Object.keys(target.variables).length, 1);
    t.equal(Object.keys(stage.variables).length, 2);
    t.type(target.blocks.getBlock('a block'), 'object');
    t.type(target.blocks.getBlock('a block').fields, 'object');
    t.type(target.blocks.getBlock('a block').fields.VARIABLE, 'object');
    t.equal(target.blocks.getBlock('a block').fields.VARIABLE.id, 'mock var id');
    t.equal(target.variables['mock var id'].name, 'a mock variable');

    t.end();
});
