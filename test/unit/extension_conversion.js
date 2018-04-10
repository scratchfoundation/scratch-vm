const test = require('tap').test;

const ArgumentType = require('../../src/extension-support/argument-type');
const BlockType = require('../../src/extension-support/block-type');
const Runtime = require('../../src/engine/runtime');
const ScratchBlocksConstants = require('../../src/engine/scratch-blocks-constants');

/**
 * @type {ExtensionMetadata}
 */
const testExtensionInfo = {
    id: 'test',
    name: 'fake test extension',
    blocks: [
        {
            opcode: 'reporter',
            blockType: BlockType.REPORTER,
            text: 'simple text'
        },
        '---', // separator between groups of blocks in an extension
        {
            opcode: 'command',
            blockType: BlockType.COMMAND,
            text: 'text with [ARG]',
            arguments: {
                ARG: {
                    type: ArgumentType.STRING
                }
            }
        },
        {
            opcode: 'ifElse',
            blockType: BlockType.CONDITIONAL,
            branchCount: 2,
            text: [
                'test if [THING] is spiffy and if so then',
                'or elsewise'
            ],
            arguments: {
                THING: {
                    type: ArgumentType.BOOLEAN
                }
            }
        },
        {
            opcode: 'loop',
            blockType: BlockType.LOOP, // implied branchCount of 1 unless otherwise stated
            isTerminal: true,
            text: [
                'loopty [MANY] loops'
            ],
            arguments: {
                MANY: {
                    type: ArgumentType.NUMBER
                }
            }
        }
    ]
};

const testReporter = function (t, reporter) {
    t.equal(reporter.json.type, 'test.reporter');
    t.equal(reporter.json.outputShape, ScratchBlocksConstants.OUTPUT_SHAPE_ROUND);
    t.equal(reporter.json.output, 'String');
    t.notOk(reporter.json.hasOwnProperty('previousStatement'));
    t.notOk(reporter.json.hasOwnProperty('nextStatement'));
    t.equal(reporter.json.message0, 'simple text');
    t.notOk(reporter.json.hasOwnProperty('message1'));
    t.notOk(reporter.json.hasOwnProperty('args0'));
    t.notOk(reporter.json.hasOwnProperty('args1'));
    t.equal(reporter.xml, '<block type="test.reporter"></block>');
};

const testSeparator = function (t, separator) {
    t.equal(separator.json, null);
    t.equal(separator.xml, '<sep gap="36"/>');
};

const testCommand = function (t, command) {
    t.equal(command.json.type, 'test.command');
    t.equal(command.json.outputShape, ScratchBlocksConstants.OUTPUT_SHAPE_SQUARE);
    t.assert(command.json.hasOwnProperty('previousStatement'));
    t.assert(command.json.hasOwnProperty('nextStatement'));
    t.equal(command.json.message0, 'text with %1');
    t.notOk(command.json.hasOwnProperty('message1'));
    t.strictSame(command.json.args0[0], {
        type: 'input_value',
        name: 'ARG'
    });
    t.notOk(command.json.hasOwnProperty('args1'));
    t.equal(command.xml,
        '<block type="test.command"><value name="ARG"><shadow type="text"><field name="TEXT">' +
        '</field></shadow></value></block>');
};

const testConditional = function (t, conditional) {
    t.equal(conditional.json.type, 'test.ifElse');
    t.equal(conditional.json.outputShape, ScratchBlocksConstants.OUTPUT_SHAPE_SQUARE);
    t.ok(conditional.json.hasOwnProperty('previousStatement'));
    t.ok(conditional.json.hasOwnProperty('nextStatement'));
    t.equal(conditional.json.message0, 'test if %1 is spiffy and if so then');
    t.equal(conditional.json.message1, '%1'); // placeholder for substack #1
    t.equal(conditional.json.message2, 'or elsewise');
    t.equal(conditional.json.message3, '%1'); // placeholder for substack #2
    t.notOk(conditional.json.hasOwnProperty('message4'));
    t.strictSame(conditional.json.args0[0], {
        type: 'input_value',
        name: 'THING',
        check: 'Boolean'
    });
    t.strictSame(conditional.json.args1[0], {
        type: 'input_statement',
        name: 'SUBSTACK'
    });
    t.notOk(conditional.json.hasOwnProperty(conditional.json.args2));
    t.strictSame(conditional.json.args3[0], {
        type: 'input_statement',
        name: 'SUBSTACK2'
    });
    t.notOk(conditional.json.hasOwnProperty('args4'));
    t.equal(conditional.xml, '<block type="test.ifElse"><value name="THING"></value></block>');
};

const testLoop = function (t, loop) {
    t.equal(loop.json.type, 'test.loop');
    t.equal(loop.json.outputShape, ScratchBlocksConstants.OUTPUT_SHAPE_SQUARE);
    t.ok(loop.json.hasOwnProperty('previousStatement'));
    t.notOk(loop.json.hasOwnProperty('nextStatement')); // isTerminal is set on this block
    t.equal(loop.json.message0, 'loopty %1 loops');
    t.equal(loop.json.message1, '%1'); // placeholder for substack
    t.equal(loop.json.message2, '%1'); // placeholder for loop arrow
    t.notOk(loop.json.hasOwnProperty('message3'));
    t.strictSame(loop.json.args0[0], {
        type: 'input_value',
        name: 'MANY'
    });
    t.strictSame(loop.json.args1[0], {
        type: 'input_statement',
        name: 'SUBSTACK'
    });
    t.equal(loop.json.lastDummyAlign2, 'RIGHT'); // move loop arrow to right side
    t.equal(loop.json.args2[0].type, 'field_image');
    t.equal(loop.json.args2[0].flip_rtl, true);
    t.notOk(loop.json.hasOwnProperty('args3'));
    t.equal(loop.xml,
        '<block type="test.loop"><value name="MANY"><shadow type="math_number"><field name="NUM">' +
        '</field></shadow></value></block>');
};

test('registerExtensionPrimitives', t => {
    const runtime = new Runtime();

    runtime.on(Runtime.EXTENSION_ADDED, blocksInfo => {
        t.equal(blocksInfo.length, testExtensionInfo.blocks.length);

        // Note that this also implicitly tests that block order is preserved
        const [reporter, separator, command, conditional, loop] = blocksInfo;

        testReporter(t, reporter);
        testSeparator(t, separator);
        testCommand(t, command);
        testConditional(t, conditional);
        testLoop(t, loop);

        t.end();
    });

    runtime._registerExtensionPrimitives(testExtensionInfo);
});
