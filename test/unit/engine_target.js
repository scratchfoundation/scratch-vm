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
