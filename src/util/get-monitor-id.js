/**
 * Returns a string representing a unique id for a monitored block
 * where a single reporter block can have more than one monitor
 * (and therefore more than one monitor block) associated
 * with it (e.g. when reporter blocks have inputs).
 * @param {string} baseId The base id to use for the different monitor blocks
 * @param {string[]} params A list of strings representing selected
 * parameters on the block.
 */
// TODO this function should eventually be the single place where all monitor
// IDs are obtained given an opcode for the reporter block and the list of
// selected parameters.
const getMonitorIdForBlockWithArgs = function (id, params) {
    let fieldString = '';
    for (const param of params) {
        fieldString += `_${param}`;
    }
    return `${id}${fieldString}`;
};

module.exports = getMonitorIdForBlockWithArgs;
