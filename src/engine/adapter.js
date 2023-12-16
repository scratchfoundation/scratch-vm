const mutationAdapter = require('./mutation-adapter');
const html = require('htmlparser2');
const uid = require('../util/uid');

/**
 * Convert and an individual block DOM to the representation tree.
 * Based on Blockly's `domToBlockHeadless_`.
 * @param {Element} blockDOM DOM tree for an individual block.
 * @param {object} blocks Collection of blocks to add to.
 * @param {boolean} isTopBlock Whether blocks at this level are "top blocks."
 * @param {?string} parent Parent block ID.
 * @return {undefined}
 */
const domToBlock = function (blockDOM, blocks, isTopBlock, parent) {
    if (!blockDOM.attribs.id) {
        blockDOM.attribs.id = uid();
    }

    // Block skeleton.
    const block = {
        id: blockDOM.attribs.id, // Block ID
        opcode: blockDOM.attribs.type, // For execution, "event_whengreenflag".
        inputs: {}, // Inputs to this block and the blocks they point to.
        fields: {}, // Fields on this block and their values.
        next: null, // Next block in the stack, if one exists.
        topLevel: isTopBlock, // If this block starts a stack.
        parent: parent, // Parent block ID, if available.
        shadow: blockDOM.name === 'shadow', // If this represents a shadow/slot.
        x: blockDOM.attribs.x, // X position of script, if top-level.
        y: blockDOM.attribs.y // Y position of script, if top-level.
    };

    // Add the block to the representation tree.
    blocks[block.id] = block;

    // Process XML children and find enclosed blocks, fields, etc.
    for (let i = 0; i < blockDOM.children.length; i++) {
        const xmlChild = blockDOM.children[i];
        // Enclosed blocks and shadows
        let childBlockNode = null;
        let childShadowNode = null;
        for (let j = 0; j < xmlChild.children.length; j++) {
            const grandChildNode = xmlChild.children[j];
            if (!grandChildNode.name) {
                // Non-XML tag node.
                continue;
            }
            const grandChildNodeName = grandChildNode.name.toLowerCase();
            if (grandChildNodeName === 'block') {
                childBlockNode = grandChildNode;
            } else if (grandChildNodeName === 'shadow') {
                childShadowNode = grandChildNode;
            }
        }

        // Use shadow block only if there's no real block node.
        if (!childBlockNode && childShadowNode) {
            childBlockNode = childShadowNode;
        }

        // Not all Blockly-type blocks are handled here,
        // as we won't be using all of them for Scratch.
        switch (xmlChild.name.toLowerCase()) {
        case 'field':
        {
            // Add the field to this block.
            const fieldName = xmlChild.attribs.name;
            // Add id in case it is a variable field
            const fieldId = xmlChild.attribs.id;
            let fieldData = '';
            if (xmlChild.children.length > 0 && xmlChild.children[0].data) {
                fieldData = xmlChild.children[0].data;
            } else {
                // If the child of the field with a data property
                // doesn't exist, set the data to an empty string.
                fieldData = '';
            }
            block.fields[fieldName] = {
                name: fieldName,
                id: fieldId,
                value: fieldData
            };
            const fieldVarType = xmlChild.attribs.variabletype;
            if (typeof fieldVarType === 'string') {
                block.fields[fieldName].variableType = fieldVarType;
            }
            break;
        }
        case 'comment':
        {
            block.comment = xmlChild.attribs.id;
            break;
        }
        case 'value':
        case 'statement':
        {
            // Recursively generate block structure for input block.
            domToBlock(childBlockNode, blocks, false, block.id);
            if (childShadowNode && childBlockNode !== childShadowNode) {
                // Also generate the shadow block.
                domToBlock(childShadowNode, blocks, false, block.id);
            }
            // Link this block's input to the child block.
            const inputName = xmlChild.attribs.name;
            block.inputs[inputName] = {
                name: inputName,
                block: childBlockNode.attribs.id,
                shadow: childShadowNode ? childShadowNode.attribs.id : null
            };
            break;
        }
        case 'next':
        {
            if (!childBlockNode || !childBlockNode.attribs) {
                // Invalid child block.
                continue;
            }
            // Recursively generate block structure for next block.
            domToBlock(childBlockNode, blocks, false, block.id);
            // Link next block to this block.
            block.next = childBlockNode.attribs.id;
            break;
        }
        case 'mutation':
        {
            block.mutation = mutationAdapter(xmlChild);
            break;
        }
        }
    }
};

/**
 * Convert outer blocks DOM from a Blockly CREATE event
 * to a usable form for the Scratch runtime.
 * This structure is based on Blockly xml.js:`domToWorkspace` and `domToBlock`.
 * @param {Element} blocksDOM DOM tree for this event.
 * @return {Array.<object>} Usable list of blocks from this CREATE event.
 */
const domToBlocks = function (blocksDOM) {
    // At this level, there could be multiple blocks adjacent in the DOM tree.
    const blocks = {};
    for (let i = 0; i < blocksDOM.length; i++) {
        const block = blocksDOM[i];
        if (!block.name || !block.attribs) {
            continue;
        }
        const tagName = block.name.toLowerCase();
        if (tagName === 'block' || tagName === 'shadow') {
            domToBlock(block, blocks, true, null);
        }
    }
    // Flatten blocks object into a list.
    const blocksList = [];
    for (const b in blocks) {
        if (!Object.prototype.hasOwnProperty.call(blocks, b)) continue;
        blocksList.push(blocks[b]);
    }
    return blocksList;
};

/**
 * Adapter between block creation events and block representation which can be
 * used by the Scratch runtime.
 * @param {object} e `Blockly.events.create` or `Blockly.events.endDrag`
 * @return {Array.<object>} List of blocks from this CREATE event.
 */
const adapter = function (e) {
    // Validate input
    if (typeof e !== 'object') return;
    if (typeof e.xml !== 'object') return;

    return domToBlocks(html.parseDOM(e.xml.outerHTML, {decodeEntities: true}));
};

module.exports = adapter;
