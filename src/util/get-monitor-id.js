/**
 * Returns a string representing a unique id for a monitored block
 * where a single reporter block can have more than one monitor
 * (and therefore more than one monitor block) associated
 * with it (e.g. when reporter blocks have inputs).
 * @param {string} baseId The base id to use for the different monitor blocks
 * @param {object} fields The monitor block's fields object.
 */
// TODO this function should eventually be the single place where all monitor
// IDs are obtained given an opcode for the reporter block and the list of
// selected parameters.
const getMonitorIdForBlockWithArgs = function (id, fields) {
    let fieldString = '';
    for (const fieldKey in fields) {
        fieldString += `_${fields[fieldKey].value}`;
    }
    return `${id}${fieldString}`;
};

module.exports = getMonitorIdForBlockWithArgs;
