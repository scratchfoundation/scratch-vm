const tap = require('tap');
const Target = require('../../src/engine/target');
const Runtime = require('../../src/engine/runtime');
const VariableUtil = require('../../src/util/variable-util');

let target1;
let target2;

tap.beforeEach(() => {
    const runtime = new Runtime();
    target1 = new Target(runtime);
    target1.blocks.createBlock({
        id: 'a block',
        fields: {
            VARIABLE: {
                id: 'id1',
                value: 'foo'
            }
        }
    });
    target1.blocks.createBlock({
        id: 'another block',
        fields: {
            TEXT: {
                value: 'not a variable'
            }
        }
    });

    target2 = new Target(runtime);
    target2.blocks.createBlock({
        id: 'a different block',
        fields: {
            VARIABLE: {
                id: 'id2',
                value: 'bar'
            }
        }
    });
    target2.blocks.createBlock({
        id: 'another var block',
        fields: {
            VARIABLE: {
                id: 'id1',
                value: 'foo'
            }
        }
    });

    return Promise.resolve(null);
});

const test = tap.test;

test('get all var refs', t => {
    const allVarRefs = VariableUtil.getAllVarRefsForTargets([target1, target2]);
    t.equal(Object.keys(allVarRefs).length, 2);
    t.equal(allVarRefs.id1.length, 2);
    t.equal(allVarRefs.id2.length, 1);
    t.equal(allVarRefs['not a variable'], undefined);

    t.end();
});

test('merge variable ids', t => {
    // Redo the id for the variable with 'id1'
    VariableUtil.updateVariableIdentifiers(target1.blocks.getAllVariableAndListReferences().id1, 'renamed id');
    const varField = target1.blocks.getBlock('a block').fields.VARIABLE;
    t.equals(varField.id, 'renamed id');
    t.equals(varField.value, 'foo');

    t.end();
});

test('merge variable ids but with new name too', t => {
    // Redo the id for the variable with 'id1'
    VariableUtil.updateVariableIdentifiers(target1.blocks.getAllVariableAndListReferences().id1, 'renamed id', 'baz');
    const varField = target1.blocks.getBlock('a block').fields.VARIABLE;
    t.equals(varField.id, 'renamed id');
    t.equals(varField.value, 'baz');

    t.end();
});
