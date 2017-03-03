/**
 * Filter Blockly toolbox XML node containing blocks to only those with
 * valid opcodes. Return a copy of the node with valid blocks.
 * @param {HTMLElement} node Blockly toolbox XML node
 * @param {Array.<string>} opcodes Valid opcodes. Blocks producing other opcodes
 * will be filtered.
 * @returns {HTMLElement} filtered toolbox XML node
 */
var filterToolboxNode = function (node, opcodes) {
    var filteredCategory = node.cloneNode();
    for (var block = node.firstElementChild; block; block = block.nextElementSibling) {
        if (block.nodeName.toLowerCase() !== 'block') continue;
        var opcode = block.getAttribute('type').toLowerCase();
        if (opcodes.indexOf(opcode) !== -1) {
            filteredCategory.appendChild(block.cloneNode(true));
        }
    }
    return filteredCategory;
};

/**
 * Filter Blockly toolbox XML and return a copy which only contains blocks with
 * existent opcodes. Categories with no valid children will be removed.
 * @param {HTMLElement} toolbox Blockly toolbox XML node
 * @param {Array.<string>} opcodes Valid opcodes. Blocks producing other opcodes
 * will be filtered.
 * @returns {HTMLElement} filtered toolbox XML node
 */
var filterToolbox = function (toolbox, opcodes) {
    if (!toolbox.hasChildNodes()) return toolbox;
    var filteredToolbox;
    if (toolbox.firstElementChild.nodeName.toLowerCase() === 'category') {
        filteredToolbox = toolbox.cloneNode();
        for (
            var category = toolbox.firstElementChild;
            category;
            category = category.nextElementSibling
        ) {
            if (category.nodeName.toLowerCase() !== 'category') continue;
            var filteredCategory = filterToolboxNode(category, opcodes);
            if (filteredCategory.hasChildNodes() ||
                filteredCategory.hasAttribute('custom')
            ) {
                filteredToolbox.appendChild(filteredCategory);
            }
        }
    } else {
        filteredToolbox = filterToolboxNode(toolbox, opcodes);
    }
    return filteredToolbox;
};

module.exports = filterToolbox;
