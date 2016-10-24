var html = require('htmlparser2');

/**
 * Convert a part of a mutation DOM to a mutation VM object, recursively.
 * @param {Object} dom DOM object for mutation tag.
 * @return {Object} Object representing useful parts of this mutation.
 */
var mutatorTagToObject = function (dom) {
    var obj = Object.create(null);
    obj.tagName = dom.name;
    obj.children = [];
    for (var prop in dom.attribs) {
        if (prop === 'xmlns') continue;
        obj[prop] = dom.attribs[prop];
    }
    for (var i = 0; i < dom.children.length; i++) {
        obj.children.push(
            mutatorTagToObject(dom.children[i])
        );
    }
    return obj;
};

/**
 * Adapter between mutator XML or DOM and block representation which can be
 * used by the Scratch runtime.
 * @param {(Object|string)} mutation Mutation XML string or DOM.
 * @return {Object} Object representing the mutation.
 */
var mutationAdpater = function (mutation) {
    var mutationParsed;
    // Check if the mutation is already parsed; if not, parse it.
    if (typeof mutation === 'object') {
        mutationParsed = mutation;
    } else {
        mutationParsed = html.parseDOM(mutation)[0];
    }
    return mutatorTagToObject(mutationParsed);
};

module.exports = mutationAdpater;
