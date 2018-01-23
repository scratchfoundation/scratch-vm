const test = require('tap').test;
const Procedures = require('../../src/blocks/scratch3_procedures');

const blocks = new Procedures(null);

test('getPrimitives', t => {
    t.type(blocks.getPrimitives(), 'object');
    t.end();
});

// Originally inspired by https://github.com/LLK/scratch-gui/issues/809
test('calling a custom block with no definition does not throw', t => {
    const args = {
        mutation: {
            proccode: 'undefined proc'
        }
    };
    const util = {
        getProcedureParamNamesAndIds: () => null,
        stackFrame: {
            executed: false
        }
    };
    t.doesNotThrow(() => {
        blocks.call(args, util);
    });
    t.end();
});
