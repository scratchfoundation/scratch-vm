export = getMonitorIdForBlockWithArgs;
/**
 * Returns a string representing a unique id for a monitored block
 * where a single reporter block can have more than one monitor
 * (and therefore more than one monitor block) associated
 * with it (e.g. when reporter blocks have inputs).
 * @param {string} baseId The base id to use for the different monitor blocks
 * @param {object} fields The monitor block's fields object.
 */
declare function getMonitorIdForBlockWithArgs(id: any, fields: object): string;
