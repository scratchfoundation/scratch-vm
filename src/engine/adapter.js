var html = require('htmlparser2');
var memoize = require('memoizee');
var parseDOM = memoize(html.parseDOM, {
    length: 1,
    resolvers: [String],
    max: 200
});

/**
 * Adapter between block creation events and block representation which can be
 * used by the Scratch runtime.
 *
 * @param {Object} `Blockly.events.create`
 *
 * @return {Object}
 */
module.exports = function (e) {
    // Validate input
    if (typeof e !== 'object') return;
    if (typeof e.blockId !== 'string') return;
    if (typeof e.xml !== 'object') return;

    // Storage object
    var obj = {
        id: e.blockId,
        opcode: null,
        next: null,
        fields: {}
    };

    // Set opcode
    if (typeof e.xml.attributes === 'object') {
        obj.opcode = e.xml.attributes.type.value;
    }

    // Extract fields from event's `innerHTML`
    if (typeof e.xml.innerHTML !== 'string') return obj;
    if (e.xml.innerHTML === '') return obj;
    obj.fields = extract(parseDOM(e.xml.innerHTML));

    return obj;
};

/**
 * Extracts fields from a block's innerHTML.
 * @todo Extend this to support vertical grammar / nested blocks.
 *
 * @param {Object} DOM representation of block's innerHTML
 *
 * @return {Object}
 */
function extract (dom) {
    // Storage object
    var fields = {};

    // Field
    var field = dom[0];
    var fieldName = field.attribs.name;
    fields[fieldName] = {
        name: fieldName,
        value: null,
        blocks: {}
    };

    // Shadow block
    var shadow = field.children[0];
    var shadowId = shadow.attribs.id;
    var shadowOpcode = shadow.attribs.type;
    fields[fieldName].blocks[shadowId] = {
        id: shadowId,
        opcode: shadowOpcode,
        next: null,
        fields: {}
    };

    // Primitive
    var primitive = shadow.children[0];
    var primitiveName = primitive.attribs.name;
    var primitiveValue = primitive.children[0].data;
    fields[fieldName].blocks[shadowId].fields[primitiveName] = {
        name: primitiveName,
        value: primitiveValue,
        blocks: null
    };

    return fields;
}
