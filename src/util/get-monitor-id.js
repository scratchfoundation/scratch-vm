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
        let fieldValue = fields[fieldKey].value;
        if (fieldKey === 'CURRENTMENU') {
            // The 'sensing_current' block has field values in all caps.
            // However, when importing from scratch 2.0, these
            // could have gotten imported as lower case field values.
            // Normalize the field value here so that we don't ever
            // end up with a different monitor ID representing the same
            // block configuration
            // Note: we are not doing this for every block field that comes into
            // this function so as not to make the faulty assumption that block
            // field values coming in would be unique after being made lower case
            fieldValue = fieldValue.toLowerCase();
        }
        fieldString += `_${fieldValue}`;
    }
    return `${id}${fieldString}`;
};

module.exports = getMonitorIdForBlockWithArgs;
