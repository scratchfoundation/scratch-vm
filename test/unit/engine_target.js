const test = require('tap').test;
const Target = require('../../src/engine/target');
const Variable = require('../../src/engine/variable');

test('spec', t => {
    const target = new Target();

    t.type(Target, 'function');
    t.type(target, 'object');
    t.ok(target instanceof Target);

    t.type(target.id, 'string');
    t.type(target.blocks, 'object');
    t.type(target.variables, 'object');
    t.type(target.lists, 'object');
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

test('lookupOrCreateList creates a list if var with given id does not exist', t => {
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
